import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImpersonatedUser {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  roles?: any[];
}

interface ImpersonationData {
  impersonatedUser: ImpersonatedUser;
  originalAdminId: string;
  originalAdminEmail: string;
}

const IMPERSONATION_KEY = 'impersonation_data';

export function useImpersonation() {
  const navigate = useNavigate();
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(IMPERSONATION_KEY);
    if (stored) {
      setImpersonationData(JSON.parse(stored));
    }
  }, []);

  const impersonate = async (user: ImpersonatedUser) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Usuário não autenticado');

      // Salvar dados de impersonação
      const data: ImpersonationData = {
        impersonatedUser: user,
        originalAdminId: currentUser.id,
        originalAdminEmail: currentUser.email || '',
      };

      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(data));
      setImpersonationData(data);

      // Registrar no audit log
      await supabase.rpc('log_admin_action', {
        p_action: 'impersonate',
        p_target_user_id: user.id,
        p_details: { user_type: user.user_type },
      });

      // Redirecionar baseado no tipo de usuário
      if (user.user_type === 'store_admin') {
        navigate('/dashboard/my-store');
      } else if (user.roles?.some((r: any) => r.role === 'delivery_driver')) {
        navigate('/delivery-panel');
      } else if (user.roles?.some((r: any) => r.role === 'customer')) {
        // Redirecionar para a loja do cliente
        const storeId = user.roles.find((r: any) => r.role === 'customer')?.store_id;
        if (storeId) {
          const { data: store } = await supabase
            .from('stores')
            .select('slug')
            .eq('id', storeId)
            .single();
          
          if (store) {
            navigate(`/${store.slug}`);
          }
        }
      }

      toast.success(`Visualizando como ${user.full_name}`);
    } catch (error: any) {
      console.error('Erro ao impersonar:', error);
      toast.error('Erro ao impersonar usuário');
    }
  };

  const stopImpersonation = () => {
    localStorage.removeItem(IMPERSONATION_KEY);
    setImpersonationData(null);
    navigate('/dashboard/users');
    toast.success('Voltou ao painel admin');
  };

  return {
    impersonate,
    stopImpersonation,
    isImpersonating: !!impersonationData,
    impersonatedUser: impersonationData?.impersonatedUser || null,
    originalAdmin: impersonationData ? {
      id: impersonationData.originalAdminId,
      email: impersonationData.originalAdminEmail,
    } : null,
  };
}
