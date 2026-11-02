import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StoreAccess {
  storeId: string | null;
  storeName: string | null;
  isLoading: boolean;
  hasAccess: boolean;
  /** Lista de lojas disponíveis para store_admin com múltiplas lojas */
  availableStores: { id: string; name: string }[];
  /** Trocar loja ativa (para store_admin com múltiplas lojas) */
  switchStore: (storeId: string) => void;
}

const ACTIVE_STORE_KEY = 'mostralo_active_store_id';

/**
 * Cache compartilhado das buscas de loja do usuário: cada componente que usa este hook
 * (menu, cabeçalho, página...) disparava a mesma consulta. Agora todos esperam a mesma
 * promessa por até 60 s (erros não ficam no cache).
 */
const ROLE_CACHE_MS = 60_000;
const roleQueryCache = new Map<string, { at: number; promise: Promise<{ data: any; error: any }> }>();
function sharedQuery(key: string, run: () => PromiseLike<{ data: any; error: any }>): Promise<{ data: any; error: any }> {
  const hit = roleQueryCache.get(key);
  if (hit && Date.now() - hit.at < ROLE_CACHE_MS) return hit.promise;
  const promise = Promise.resolve(run()).then((res) => {
    if (res?.error) roleQueryCache.delete(key);
    return res;
  }, (err) => {
    roleQueryCache.delete(key);
    throw err;
  });
  roleQueryCache.set(key, { at: Date.now(), promise });
  return promise;
}

/**
 * Hook para garantir que lojistas só acessem sua própria loja
 * Impede vazamento de dados entre lojas diferentes
 * Suporta store_admin com múltiplas lojas via seletor
 */
export function useStoreAccess(): StoreAccess {
  const { profile, user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [availableStores, setAvailableStores] = useState<{ id: string; name: string }[]>([]);
  
  // Ref para evitar múltiplas execuções simultâneas
  const isCheckingRef = useRef(false);

  const switchStore = useCallback((newStoreId: string) => {
    const store = availableStores.find(s => s.id === newStoreId);
    if (store) {
      localStorage.setItem(ACTIVE_STORE_KEY, newStoreId);
      setStoreId(newStoreId);
      setStoreName(store.name);
      setHasAccess(true);
      // Recarregar a página para atualizar todos os dados
      window.location.reload();
    }
  }, [availableStores]);

  useEffect(() => {
    const checkStoreAccess = async () => {
      // Evitar múltiplas execuções simultâneas
      if (isCheckingRef.current) {
        return;
      }

      if (authLoading) {
        setIsLoading(true);
        return;
      }

      if (!user) {
        setStoreId(null);
        setStoreName(null);
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // CRÍTICO: Aguardar userRole ser definido antes de continuar
      if (!userRole && !profile?.user_type) {
        setIsLoading(true);
        return; // Mantém isLoading = true
      }

      // Marcar que uma verificação está em andamento
      isCheckingRef.current = true;
      setIsLoading(true);

      try {
        // Master admins têm acesso a tudo
        if (userRole === 'master_admin' || profile?.user_type === 'master_admin') {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        let finalStoreId: string | null = null;
        let finalStoreName: string | null = null;

        if (userRole === 'attendant') {
          // Atendentes: buscar store_id direto da user_roles
          const { data: roleData, error: roleError } = await sharedQuery(`attendant:${user.id}`, () => (supabase as any)
            .from('user_roles')
            .select('store_id, stores(name)')
            .eq('user_id', user.id)
            .eq('role', 'attendant')
            .single());

          if (roleError || !roleData?.store_id) {
            console.error('❌ Erro ao buscar loja do atendente:', roleError);
            toast.error('Erro: Atendente sem loja vinculada');
            setHasAccess(false);
            setIsLoading(false);
            return;
          }

          finalStoreId = roleData.store_id;
          finalStoreName = (roleData.stores as any)?.name || null;
          
        } else if (userRole === 'store_admin' || profile?.user_type === 'store_admin') {
          if (!profile) {
            setIsLoading(false);
            return;
          }

          const { data: roleStores, error } = await sharedQuery(`store_admin:${user.id}`, () => (supabase as any)
            .from('user_roles')
            .select('store_id, stores(id, name)')
            .eq('user_id', user.id)
            .eq('role', 'store_admin')
            .not('store_id', 'is', null));

          if (error) {
            console.error('❌ Erro ao verificar lojas por role:', error);
            toast.error('Erro ao verificar permissões');
            setHasAccess(false);
            setIsLoading(false);
            return;
          }

          // Normalizar + deduplicar lojas
          const stores: { id: string; name: string }[] = Array.from(
            new Map<string, { id: string; name: string }>(
              (roleStores ?? [])
                .map((item: any) => ({
                  id: item.store_id as string,
                  name: item.stores?.name as string | undefined,
                }))
                .filter((s): s is { id: string; name: string } => Boolean(s.id && s.name))
                .map((s) => [s.id, s])
            ).values()
          );

          if (stores.length === 0) {
            // Fallback legado: owner_id (para contas antigas)
            const { data: ownedStores } = await sharedQuery(`owner:${user.id}`, () => supabase
              .from('stores')
              .select('id, name')
              .eq('owner_id', user.id));

            const normalizedOwnedStores: { id: string; name: string }[] = (ownedStores ?? [])
              .filter((s): s is { id: string; name: string } => Boolean(s?.id && s?.name));

            if (normalizedOwnedStores.length > 0) {
              setAvailableStores(normalizedOwnedStores);
              const savedStoreId = localStorage.getItem(ACTIVE_STORE_KEY);
              const savedStore = savedStoreId ? normalizedOwnedStores.find(s => s.id === savedStoreId) : null;
              finalStoreId = savedStore?.id ?? normalizedOwnedStores[0].id;
              finalStoreName = savedStore?.name ?? normalizedOwnedStores[0].name;
              if (!savedStoreId) localStorage.setItem(ACTIVE_STORE_KEY, finalStoreId);
            } else {
              if (profile?.approval_status === 'pending') {
                navigate('/dashboard/subscription');
                setHasAccess(false);
                setIsLoading(false);
                return;
              }

              toast.error('Você não está vinculado a nenhuma loja. Contate o suporte.');
              setHasAccess(false);
              setIsLoading(false);
              return;
            }
          } else {
            setAvailableStores(stores);

            if (stores.length === 1) {
              finalStoreId = stores[0].id;
              finalStoreName = stores[0].name;
            } else {
              const savedStoreId = localStorage.getItem(ACTIVE_STORE_KEY);
              const savedStore = savedStoreId ? stores.find(s => s.id === savedStoreId) : null;

              if (savedStore) {
                finalStoreId = savedStore.id;
                finalStoreName = savedStore.name;
              } else {
                finalStoreId = stores[0].id;
                finalStoreName = stores[0].name;
                localStorage.setItem(ACTIVE_STORE_KEY, stores[0].id);
              }
            }
          }
          
        } else {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // SUCESSO: Definir store_id e acesso
        if (finalStoreId) {
          setStoreId(finalStoreId);
          setStoreName(finalStoreName);
          setHasAccess(true);
        } else {
          setStoreId(null);
          setStoreName(null);
          setHasAccess(false);
        }
        
      } catch (error) {
        console.error('❌ useStoreAccess: Erro ao verificar acesso:', error);
        setStoreId(null);
        setStoreName(null);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
        isCheckingRef.current = false;
      }
    };

    checkStoreAccess();
  }, [user, profile, userRole, authLoading, navigate]);

  return {
    storeId,
    storeName,
    isLoading: authLoading || isLoading || (!!user && !userRole),
    hasAccess,
    availableStores,
    switchStore
  };
}
