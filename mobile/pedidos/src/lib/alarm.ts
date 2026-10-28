// Alarme de pedido novo (som gerado no aparelho, sem arquivo) + vibração + notificação.
import { LocalNotifications } from '@capacitor/local-notifications';

let ctx: AudioContext | null = null;

export function beep(times = 3) {
  try {
    ctx = ctx ?? new AudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      for (const [f, d] of [[880, 0], [1175, 0.18]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square'; o.frequency.value = f;
        const t = now + i * 0.6 + d;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.18);
      }
    }
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch { /* sem áudio */ }
}

export async function notify(title: string, body: string) {
  try {
    await LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() % 2147483647), title, body }] });
  } catch { /* sem permissão */ }
}

export async function askNotificationPermission() {
  try { await LocalNotifications.requestPermissions(); } catch { /* web */ }
}
