// Cliente na página da loja: nome salvo no aparelho (com migração das chaves antigas),
// pedidos em aberto do cliente logado e limpeza do parâmetro legado ?auth=true.
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from '@/lib/safeStorage';
import { storePath } from '@/lib/storePath';

export function useStoreCustomer(storeId: string | undefined, slug: string) {
  const [customerName, setCustomerName] = useState<string | null>(null);

  // Carregar nome do cliente do localStorage
  // Carregar nome do cliente do localStorage e escutar atualizações
  useEffect(() => {
    const loadCustomerProfile = () => {
      if (storeId) {
        // Migrar dados antigos para o novo formato usando safeLocalStorage
        const oldCustomerData = safeLocalStorage.getItem('customer_data');
        const oldProfile = safeLocalStorage.getItem(`customerProfile_${storeId}`);
        const currentCustomer = safeLocalStorage.getItem(`customer_${storeId}`);

        // Se não existe customer_${storeId}, migrar de customer_data ou customerProfile
        if (!currentCustomer) {
          if (oldCustomerData) {
            safeLocalStorage.setItem(`customer_${storeId}`, oldCustomerData);
          } else if (oldProfile) {
            safeLocalStorage.setItem(`customer_${storeId}`, oldProfile);
          }
        }

        // Carregar perfil salvo do localStorage com a nova chave
        const savedProfile = safeLocalStorage.getItem(`customer_${storeId}`);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setCustomerName(profile.name || null);
          } catch (error) {
            console.error('Erro ao carregar perfil:', error);
          }
        }
      }
    };

    loadCustomerProfile();

    // Escutar evento de atualização de perfil
    const handleProfileUpdate = (event: CustomEvent) => {
      const profile = event.detail;
      setCustomerName(profile.name || null);
    };

    window.addEventListener('customerProfileUpdated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('customerProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, [storeId]);

  // Query para buscar customer_id e pedidos pendentes do cliente autenticado
  const { data: customerData } = useQuery({
    queryKey: ['customer-by-auth', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    },
    enabled: !!storeId,
  });

  const { data: pendingOrdersCount = 0 } = useQuery({
    queryKey: ['customer-pending-orders', customerData?.id],
    queryFn: async () => {
      if (!customerData?.id) return 0;

      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerData.id)
        .not('status', 'in', '(concluido,cancelado)');

      if (error) {
        console.error('Erro ao buscar pedidos pendentes:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!customerData?.id,
    refetchInterval: 60000, // Otimizado: era 30s, agora 60s
  });

  // Detectar parâmetro ?auth=true legado e apenas limpar a URL.
  // O checkout público não deve forçar autenticação automaticamente.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'true' && storeId) {
      // Limpar parâmetro da URL
      window.history.replaceState({}, '', storePath(slug));
    }
  }, [storeId, slug]);

  return { customerName, setCustomerName, pendingOrdersCount };
}
