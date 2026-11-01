// App Mostralo Pedidos: avisa quando a bateria do celular está fraca (o app para de receber e imprimir se desligar).
// Usa a API de bateria do navegador do app; aviso na tela + notificação com som em 20% e 10%, se não estiver carregando.
import { useEffect, useState } from 'react';
import { isNativeApp, nativePlugin } from '@/lib/thermal/nativeBridge';
import { remoteLog } from '@/lib/thermal/nativePrinter';

type BatteryLike = { level: number; charging: boolean; addEventListener: (e: string, f: () => void) => void; removeEventListener: (e: string, f: () => void) => void };

export const LOW_BATTERY = 0.2;
const CRITICAL_BATTERY = 0.1;

export function useAppBatteryWatch() {
  const [state, setState] = useState<{ level: number; charging: boolean } | null>(null);

  useEffect(() => {
    if (!isNativeApp()) return;
    const getBattery = (navigator as unknown as { getBattery?: () => Promise<BatteryLike> }).getBattery;
    if (!getBattery) { remoteLog('Bateria: indisponível neste celular', 'app'); return; }
    let battery: BatteryLike | null = null;
    let warned: 'none' | 'low' | 'critical' = 'none';
    let lastLog = 0;
    const check = () => {
      if (!battery) return;
      const level = battery.level;
      const charging = battery.charging;
      setState({ level, charging });
      const pct = Math.round(level * 100);
      if (Date.now() - lastLog > 30 * 60_000) { lastLog = Date.now(); remoteLog(`Bateria: ${pct}%${charging ? ' (carregando)' : ''}`, 'app'); }
      if (charging || level > LOW_BATTERY) { if (charging || level > LOW_BATTERY + 0.05) warned = 'none'; return; }
      const level2 = level <= CRITICAL_BATTERY ? 'critical' : 'low';
      if (warned === level2 || (warned === 'critical' && level2 === 'low')) return;
      warned = level2;
      remoteLog(`Bateria fraca: ${pct}%`, 'app');
      void Promise.resolve().then(() => nativePlugin('PedidosService').notifyOrder({
        id: `bateria-${level2}`,
        title: `Bateria em ${pct}%: coloque o celular para carregar`,
        text: 'Se o celular desligar, o Mostralo Pedidos para de receber e imprimir pedidos.',
      })).catch(() => undefined);
    };
    getBattery.call(navigator).then(b => {
      battery = b;
      check();
      b.addEventListener('levelchange', check);
      b.addEventListener('chargingchange', check);
    }).catch(() => undefined);
    const id = setInterval(check, 60_000);
    return () => {
      clearInterval(id);
      battery?.removeEventListener('levelchange', check);
      battery?.removeEventListener('chargingchange', check);
    };
  }, []);

  return state;
}
