import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { safeLocalStorage } from '@/lib/safeStorage';

const USER_THEME_KEY = 'mostralo-user-theme';

// Rotas que forçam tema escuro
const DARK_ROUTES = [
  '/', '/sobre', '/seja-vendedor', '/cadastro-vendedor',
  '/cadastro-vendedor-sucesso', '/para-lojistas', '/para-feirantes',
  '/para-farmacias', '/proposta-biomundo', '/para-supermercados',
  '/para-acougues', '/diagnostico', '/diagnostico-delivery',
  '/diagnostico-servicos'
];

// Prefixos de rotas onde o usuário controla o tema
const USER_CONTROLLED_PREFIXES = ['/dashboard', '/entregador', '/vendedor'];

export function useRouteTheme() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const prevPathRef = useRef<string>('');

  // Salva a preferência do usuário quando ele muda o tema manualmente no dashboard
  useEffect(() => {
    const isUserControlled = USER_CONTROLLED_PREFIXES.some(
      prefix => location.pathname.startsWith(prefix)
    );
    // Só salva se estiver em rota controlada pelo usuário e o tema mudou
    if (isUserControlled && theme && prevPathRef.current === location.pathname) {
      safeLocalStorage.setItem(USER_THEME_KEY, theme);
    }
  }, [theme, location.pathname]);

  useEffect(() => {
    prevPathRef.current = location.pathname;

    const isUserControlled = USER_CONTROLLED_PREFIXES.some(
      prefix => location.pathname.startsWith(prefix)
    );

    if (isUserControlled) {
      // Restaura a preferência salva do usuário
      const savedTheme = safeLocalStorage.getItem(USER_THEME_KEY);
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setTheme(savedTheme);
      }
      return;
    }

    // Landing page e rotas de vendedores = tema escuro
    if (DARK_ROUTES.includes(location.pathname)) {
      setTheme('dark');
      return;
    }

    // Páginas públicas (loja, checkout, cliente, etc.) = tema claro
    setTheme('light');
  }, [location.pathname, setTheme]);
}
