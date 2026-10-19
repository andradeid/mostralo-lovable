import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * O cadastro antigo (/signup) continua só para propostas comerciais.
 * Todo o resto vai para o checkout curto (/assinar), que cobra antes e deixa a configuração para depois.
 */
export function SignupGate({ children }: { children: ReactNode }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (params.get('from') === 'proposal') return <>{children}</>;
  const next = new URLSearchParams();
  for (const key of ['plan', 'billing_cycle', 'ref']) {
    const v = params.get(key);
    if (v) next.set(key, v);
  }
  const qs = next.toString();
  return <Navigate to={`/assinar${qs ? `?${qs}` : ''}`} replace />;
}
