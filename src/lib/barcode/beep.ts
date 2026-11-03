// Bip curto da leitura (WebAudio, sem arquivo). Se o navegador bloquear o áudio, fica em silêncio.
// Para desligar neste navegador: localStorage "mostralo:leitor-bip" = "off".
const PREF_KEY = 'mostralo:leitor-bip';

let ctx: AudioContext | null = null;

function beepEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function playScanBeep(kind: 'ok' | 'error' = 'ok') {
  if (!beepEnabled()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const duration = kind === 'ok' ? 0.08 : 0.25;
    osc.type = kind === 'ok' ? 'sine' : 'square';
    osc.frequency.value = kind === 'ok' ? 1800 : 300;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // áudio indisponível ou bloqueado: segue sem bip
  }
}
