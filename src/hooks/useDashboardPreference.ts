import { useState, useEffect } from 'react';
import { safeLocalStorage } from '@/lib/safeStorage';

export type DashboardMode = 'auto' | 'booking' | 'shop' | 'hybrid';

const DASHBOARD_PREF_KEY = 'mostralo-dashboard-mode';

/**
 * Hook para gerenciar a preferência de tipo de painel do usuário.
 * Valores: 'auto' (detecta automaticamente), 'booking', 'shop', 'hybrid'
 */
export function useDashboardPreference() {
  const [mode, setModeState] = useState<DashboardMode>(() => {
    const saved = safeLocalStorage.getItem(DASHBOARD_PREF_KEY);
    if (saved === 'booking' || saved === 'shop' || saved === 'hybrid') return saved;
    return 'auto';
  });

  const setMode = (newMode: DashboardMode) => {
    setModeState(newMode);
    safeLocalStorage.setItem(DASHBOARD_PREF_KEY, newMode);
  };

  return { mode, setMode };
}

/**
 * Resolve o modo efetivo do dashboard com base na preferência e módulos ativos.
 */
export function resolveEffectiveMode(
  preference: DashboardMode,
  bookingEnabled: boolean,
  shopEnabled: boolean
): { effectiveBooking: boolean; effectiveShop: boolean } {
  if (preference === 'auto') {
    return { effectiveBooking: bookingEnabled, effectiveShop: shopEnabled };
  }
  if (preference === 'booking') {
    return { effectiveBooking: true, effectiveShop: false };
  }
  if (preference === 'shop') {
    return { effectiveBooking: false, effectiveShop: true };
  }
  // hybrid
  return { effectiveBooking: true, effectiveShop: true };
}
