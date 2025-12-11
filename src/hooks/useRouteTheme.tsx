import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';

export function useRouteTheme() {
  const location = useLocation();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Landing page (/) e páginas de vendedores públicas = tema escuro
    if (location.pathname === '/' || 
        location.pathname === '/seja-vendedor' ||
        location.pathname === '/cadastro-vendedor' ||
        location.pathname === '/cadastro-vendedor-sucesso' ||
        location.pathname === '/para-lojistas' ||
        location.pathname === '/para-feirantes' ||
        location.pathname === '/para-farmacias' ||
        location.pathname === '/proposta-biomundo') {
      setTheme('dark');
    }
    // Dashboard e sub-rotas = respeitar preferência do usuário (não forçar nada)
    else if (location.pathname.startsWith('/dashboard') || 
             location.pathname.startsWith('/entregador') ||
             location.pathname.startsWith('/vendedor')) {
      // Não fazer nada - usuário controla o tema manualmente
      return;
    }
    // Páginas públicas (loja, checkout, cliente, etc.) = tema claro
    else {
      setTheme('light');
    }
  }, [location.pathname, setTheme]);
}
