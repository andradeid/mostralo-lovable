import { lazy, type ComponentProps } from 'react';
import { LazyRoute } from '@/components/LazyRoute';

// O painel (menu lateral, modo de edição do menu com arrastar e soltar etc.) só é baixado
// quando alguém abre uma tela do painel — a vitrine dos clientes não carrega esse código.
const AdminLayoutInner = lazy(() => import('./AdminLayout').then((m) => ({ default: m.AdminLayout })));

export function AdminLayout(props: ComponentProps<typeof AdminLayoutInner>) {
  return (
    <LazyRoute>
      <AdminLayoutInner {...props} />
    </LazyRoute>
  );
}
