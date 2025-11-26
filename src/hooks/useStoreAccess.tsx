import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StoreAccess {
  storeId: string | null;
  storeName: string | null;
  isLoading: boolean;
  hasAccess: boolean;
}

/**
 * Hook para garantir que lojistas só acessem sua própria loja
 * Impede vazamento de dados entre lojas diferentes
 */
export function useStoreAccess(): StoreAccess {
  const { profile, user, userRole } = useAuth();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Ref para evitar múltiplas execuções simultâneas
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const checkStoreAccess = async () => {
      // Evitar múltiplas execuções simultâneas
      if (isCheckingRef.current) {
        console.log('⏸️ useStoreAccess: Verificação já em andamento, aguardando...');
        return;
      }

      console.log('🔍 useStoreAccess: Iniciando verificação', { 
        userId: user?.id, 
        userRole, 
        profileUserType: profile?.user_type 
      });

      if (!user) {
        console.log('❌ useStoreAccess: Sem usuário');
        setStoreId(null);
        setStoreName(null);
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // CRÍTICO: Aguardar userRole ser definido antes de continuar
      if (!userRole && !profile?.user_type) {
        console.log('⏳ useStoreAccess: Aguardando userRole');
        return; // Mantém isLoading = true
      }

      // Marcar que uma verificação está em andamento
      isCheckingRef.current = true;

      try {
        // Master admins têm acesso a tudo
        if (userRole === 'master_admin' || profile?.user_type === 'master_admin') {
          console.log('✅ useStoreAccess: Master admin detectado');
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        // ATENDENTES E STORE_ADMIN: Buscar store_id da mesma forma
        // Atendentes têm store_id na user_roles
        // Store admins têm lojas onde são owner_id
        let finalStoreId: string | null = null;
        let finalStoreName: string | null = null;

        if (userRole === 'attendant') {
          // Atendentes: buscar store_id direto da user_roles
          console.log('🔍 useStoreAccess: Buscando loja do atendente', user.id);
          
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('store_id, stores(name)')
            .eq('user_id', user.id)
            .eq('role', 'attendant')
            .single();

          console.log('📊 useStoreAccess: Resultado atendente:', { roleData, roleError });

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
          // Store admins: buscar loja onde é owner
          console.log('🔍 useStoreAccess: Buscando loja do store_admin', user.id);

          if (!profile) {
            console.log('⚠️ useStoreAccess: Sem profile');
            setIsLoading(false);
            return;
          }

          const { data: stores, error } = await supabase
            .from('stores')
            .select('id, name')
            .eq('owner_id', user.id);

          console.log('📊 useStoreAccess: Lojas do store_admin:', stores);

          if (error) {
            console.error('❌ Erro ao verificar lojas:', error);
            toast.error('Erro ao verificar permissões');
            setHasAccess(false);
            setIsLoading(false);
            return;
          }

          if (!stores || stores.length === 0) {
            console.warn('⚠️ Store admin sem loja:', user.email);
            
            // Verificar se está aguardando aprovação
            if (profile?.approval_status === 'pending') {
              console.log('↪️ Redirecionando para assinatura (pendente)');
              navigate('/dashboard/subscription');
              setHasAccess(false);
              setIsLoading(false);
              return;
            }
            
            toast.error('Você não está vinculado a nenhuma loja. Contate o suporte.');
            setHasAccess(false);
            setIsLoading(false);
            await supabase.auth.signOut();
            navigate('/auth');
            return;
          }

          if (stores.length > 1) {
            console.error('🚨 SEGURANÇA: Store admin com múltiplas lojas:', user.email);
            toast.error('Erro de configuração. Contate o suporte.');
            setHasAccess(false);
            setIsLoading(false);
            return;
          }

          finalStoreId = stores[0].id;
          finalStoreName = stores[0].name;
          
        } else {
          // Usuário sem role válida
          console.log('⚠️ useStoreAccess: Sem role válida');
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // SUCESSO: Definir store_id e acesso (tanto para atendente quanto store_admin)
        if (finalStoreId) {
          setStoreId(finalStoreId);
          setStoreName(finalStoreName);
          setHasAccess(true);
          console.log('✅ useStoreAccess: Acesso validado - Loja:', finalStoreName, 'ID:', finalStoreId);
        } else {
          setStoreId(null);
          setStoreName(null);
          setHasAccess(false);
          console.log('❌ useStoreAccess: Nenhum store_id encontrado');
        }
        
      } catch (error) {
        console.error('❌ useStoreAccess: Erro ao verificar acesso:', error);
        setStoreId(null);
        setStoreName(null);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
        isCheckingRef.current = false;
        console.log('🏁 useStoreAccess: Verificação concluída');
      }
    };

    checkStoreAccess();
  }, [user, profile, userRole, navigate]);

  return {
    storeId,
    storeName,
    isLoading,
    hasAccess
  };
}
