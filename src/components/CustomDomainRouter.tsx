import { ReactNode } from 'react';
import { useCustomDomain } from '@/hooks/useCustomDomain';
import Store from '@/pages/Store';
import StoreUnavailable from '@/pages/StoreUnavailable';

interface CustomDomainRouterProps {
  children: ReactNode;
}

export function CustomDomainRouter({ children }: CustomDomainRouterProps) {
  const { storeSlug, isCustomDomain, isLoading } = useCustomDomain();

  // Enquanto carrega, mostrar nada (evita flash)
  if (isLoading) {
    return null;
  }

  // Se não é domínio personalizado, renderizar rotas normais
  if (!isCustomDomain) {
    return <>{children}</>;
  }

  // Se é domínio personalizado mas não encontrou loja, mostrar página de indisponível
  if (!storeSlug) {
    return <StoreUnavailable />;
  }

  // Se é domínio personalizado e encontrou loja, renderizar a loja na raiz
  return <Store />;
}
