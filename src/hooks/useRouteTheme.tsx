import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';

export function useRouteTheme() {
  const location = useLocation();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Landing page (/) = tema escuro
    if (location.pathname === '/') {
      setTheme('dark');
    } 
    // Todas as outras páginas = tema claro
    else {
      setTheme('light');
    }
  }, [location.pathname, setTheme]);
}
