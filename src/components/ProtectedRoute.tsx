import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('delivery_driver' | 'store_admin' | 'master_admin' | 'customer' | 'attendant' | 'salesperson' | 'professional')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, profile, loading: authLoading, userRole } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const location = useLocation();

  // 🔒 Redirecionar clientes que tentam acessar dashboard
  useEffect(() => {
    if (userRole === 'customer' && location.pathname.startsWith('/dashboard') && user?.id) {
      console.error('🚨 SECURITY: Customer attempting to access dashboard - redirecting');
      
      // Buscar loja do cliente e redirecionar
      const redirectToStore = async () => {
        try {
          const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          
          if (customerData?.id) {
            const { data: lastOrder } = await supabase
              .from('orders')
              .select('store_id')
              .eq('customer_id', customerData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (lastOrder?.store_id) {
              const { data: storeData } = await supabase
                .from('stores')
                .select('slug')
                .eq('id', lastOrder.store_id)
                .maybeSingle();
              
              if (storeData?.slug) {
                window.location.href = `/loja/${storeData.slug}`;
                return;
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar loja do cliente:', error);
        }
        window.location.href = '/';
      };
      
      redirectToStore();
    }
  }, [userRole, location.pathname, user?.id]);

  useEffect(() => {
    if (!authLoading) {
      setLoadingTimeout(false);
      return;
    }
    
    const timer = setTimeout(() => {
      console.warn('⚠️ ProtectedRoute: Loading timeout detectado');
      setLoadingTimeout(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (loadingTimeout && authLoading) {
      console.warn('⚠️ Loading timeout - usuário pode clicar no botão para recarregar');
    }
  }, [loadingTimeout, authLoading]);

  // Timeout de autenticação - mostrar erro e opção de login
  if (loadingTimeout && authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-destructive" />
        <p className="text-sm text-destructive font-medium text-center">
          Erro ao carregar autenticação
        </p>
        <p className="text-xs text-muted-foreground text-center max-w-md">
          Por favor, faça login novamente
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/auth';
          }}
        >
          Fazer Login Novamente
        </Button>
      </div>
    );
  }

  if (authLoading || (user && !profile && !userRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Log para debug (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.log('🔐 ProtectedRoute:', {
      path: location.pathname,
      userRole,
      allowedRoles,
      email: user.email
    });
  }

  // 🔒 VALIDAÇÃO CRÍTICA 1: Bloquear delivery_driver de rotas admin
  if (userRole === 'delivery_driver') {
    if (allowedRoles.includes('store_admin') || allowedRoles.includes('master_admin')) {
      console.error('🚨 SECURITY: Delivery driver blocked from admin route:', location.pathname);
      
      // Registrar tentativa de acesso não autorizado
      supabase.from('security_audit_log').insert({
        user_id: user.id,
        user_email: user.email,
        user_role: userRole,
        attempted_route: location.pathname,
        allowed_roles: allowedRoles,
        action: 'blocked'
      }).then();
      
      return <Navigate to="/delivery-panel" replace />;
    }
  }

  // 🔒 VALIDAÇÃO CRÍTICA 2: Bloquear customer de QUALQUER rota do dashboard
  if (userRole === 'customer') {
    // Clientes NUNCA podem acessar rotas do dashboard, independente de allowedRoles
    if (location.pathname.startsWith('/dashboard')) {
      console.error('🚨 SECURITY: Customer blocked from dashboard route:', location.pathname);
      
      // Registrar tentativa de acesso não autorizado
      supabase.from('security_audit_log').insert({
        user_id: user.id,
        user_email: user.email,
        user_role: userRole,
        attempted_route: location.pathname,
        allowed_roles: allowedRoles,
        action: 'blocked'
      }).then();
      
      // O useEffect acima já vai redirecionar, mas retornamos Navigate como fallback
      return <Navigate to="/" replace />;
    }
    
    // Bloquear também de outras rotas restritas
    if (allowedRoles.includes('store_admin') || 
        allowedRoles.includes('master_admin') || 
        allowedRoles.includes('delivery_driver') ||
        allowedRoles.includes('attendant')) {
      console.error('🚨 SECURITY: Customer blocked from restricted route:', location.pathname);
      
      // Registrar tentativa de acesso não autorizado
      supabase.from('security_audit_log').insert({
        user_id: user.id,
        user_email: user.email,
        user_role: userRole,
        attempted_route: location.pathname,
        allowed_roles: allowedRoles,
        action: 'blocked'
      }).then();
      
      return <Navigate to="/" replace />;
    }
  }

  // 🔒 VALIDAÇÃO CRÍTICA 3: Verificar se a role está na lista permitida
  if (!allowedRoles.includes(userRole as any)) {
    console.error('🚨 SECURITY: Unauthorized role access attempt:', { 
      userRole, 
      allowedRoles,
      path: location.pathname 
    });
    
    // Registrar tentativa de acesso não autorizado
    supabase.from('security_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      user_role: userRole,
      attempted_route: location.pathname,
      allowed_roles: allowedRoles,
      action: 'unauthorized'
    }).then();
    
    // Redirecionar baseado no tipo de usuário
    if (userRole === 'delivery_driver') {
      return <Navigate to="/delivery-panel" replace />;
    } else if (userRole === 'customer') {
      return <Navigate to="/" replace />;
    } else if (userRole === 'master_admin' || userRole === 'store_admin' || userRole === 'attendant') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  // ✅ Acesso permitido
  return <>{children}</>;

}
