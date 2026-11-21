// Configuração pública de envio da loja (Melhor Envio). null enquanto carrega ou sem envio.
import { useEffect, useState } from 'react';
import { fetchShippingSettings, type StoreShippingSettings } from '@/lib/shipping/shippingClient';

export function useStoreShippingSettings(storeId: string | undefined, enabled = true): StoreShippingSettings | null {
  const [settings, setSettings] = useState<StoreShippingSettings | null>(null);
  useEffect(() => {
    if (!storeId || !enabled) return;
    let alive = true;
    fetchShippingSettings(storeId).then((s) => alive && setSettings(s));
    return () => { alive = false; };
  }, [storeId, enabled]);
  return settings;
}
