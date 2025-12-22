import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useCustomDomain } from '@/hooks/useCustomDomain';
import Store from '@/pages/Store';
import StoreUnavailable from '@/pages/StoreUnavailable';

interface CustomDomainRouterProps {
  children: ReactNode;
}

// Rotas que devem renderizar diretamente sem verificação de domínio
const BYPASS_ROUTES = ['/painel/', '/sitemap.xml', '/robots.txt'];

export function CustomDomainRouter({ children }: CustomDomainRouterProps) {
  const location = useLocation();
  const { storeSlug, isCustomDomain, isLoading } = useCustomDomain();

  // Bypass para rotas públicas específicas
  const shouldBypass = BYPASS_ROUTES.some(route => location.pathname.startsWith(route));
  if (shouldBypass) {
    return <>{children}</>;
  }

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
