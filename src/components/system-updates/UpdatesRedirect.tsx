import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export function UpdatesRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Redirecionar baseado no papel do usuário
    switch (userRole) {
      case 'master_admin':
      case 'store_admin':
      case 'attendant':
        navigate('/dashboard/novidades', { replace: true });
        break;
      case 'salesperson':
        navigate('/vendedor/novidades', { replace: true });
        break;
      case 'delivery_driver':
        navigate('/entregador/novidades', { replace: true });
        break;
      default:
        navigate('/auth', { replace: true, state: { from: location.pathname + location.search } });
    }
  }, [userRole, loading, navigate, location.pathname, location.search]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
