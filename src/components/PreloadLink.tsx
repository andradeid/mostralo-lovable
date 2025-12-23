import { Link, LinkProps, NavLink, NavLinkProps } from 'react-router-dom';
import { usePreloadRoute } from '@/hooks/usePreloadRoute';
import { forwardRef } from 'react';

interface PreloadLinkProps extends LinkProps {
  children: React.ReactNode;
}

/**
 * Componente Link com preload inteligente.
 * Quando o usuário passa o mouse sobre o link, a página de destino é carregada em background.
 */
export const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(
  ({ to, children, onMouseEnter, onMouseLeave, onFocus, ...props }, ref) => {
    const { preloadWithDebounce, cancelPreload } = usePreloadRoute();
    
    // Extrair path do 'to' (pode ser string ou objeto)
    const path = typeof to === 'string' ? to : to.pathname || '';

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      preloadWithDebounce(path);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
      cancelPreload();
      onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
      preloadWithDebounce(path);
      onFocus?.(e);
    };

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PreloadLink.displayName = 'PreloadLink';

interface PreloadNavLinkProps extends NavLinkProps {
  children: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
}

/**
 * Componente NavLink com preload inteligente.
 * Mesmo comportamento do PreloadLink, mas com suporte a className dinâmico baseado no estado ativo.
 */
export const PreloadNavLink = forwardRef<HTMLAnchorElement, PreloadNavLinkProps>(
  ({ to, children, onMouseEnter, onMouseLeave, onFocus, ...props }, ref) => {
    const { preloadWithDebounce, cancelPreload } = usePreloadRoute();
    
    // Extrair path do 'to' (pode ser string ou objeto)
    const path = typeof to === 'string' ? to : to.pathname || '';

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      preloadWithDebounce(path);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
      cancelPreload();
      onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
      preloadWithDebounce(path);
      onFocus?.(e);
    };

    return (
      <NavLink
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </NavLink>
    );
  }
);

PreloadNavLink.displayName = 'PreloadNavLink';
