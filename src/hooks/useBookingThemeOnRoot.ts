import { useEffect } from 'react';

/**
 * Aplica o tema da loja (cores e modo escuro) na página inteira enquanto ela estiver aberta.
 * Janelas (Dialog/AlertDialog/Popover) abrem fora do container da página; sem isso elas
 * apareciam claras sobre a página escura. Ao sair, devolve o que havia antes.
 */
export function useBookingThemeOnRoot(style: Record<string, any> | null | undefined, dark: boolean, enabled = true) {
  const key = JSON.stringify(style || {});
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const prevDark = root.classList.contains('dark');
    const prevVars: Record<string, string> = {};
    Object.entries(style || {}).forEach(([k, v]) => {
      if (!k.startsWith('--') || v == null) return;
      prevVars[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, String(v));
    });
    root.classList.toggle('dark', dark);
    return () => {
      Object.entries(prevVars).forEach(([k, v]) => (v ? root.style.setProperty(k, v) : root.style.removeProperty(k)));
      root.classList.toggle('dark', prevDark);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dark, enabled]);
}
