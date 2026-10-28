// Impressora térmica do app: escolha (Bluetooth ou rede), configurações e envio dos bytes ESC/POS.
import { nativePlugin } from './nativeBridge';
import { toBase64 } from './escpos';

export type Printer =
  | { kind: 'bluetooth'; name: string; address: string }
  | { kind: 'network'; name: string; ip: string; port: number };

export interface NativePrintSettings {
  printer: Printer | null;
  paper: 58 | 80;
  semAcentos: boolean;
  copies: number;
  printOnAccept: boolean;
  subnets: string;
}

const KEY = 'mostralo-app-impressora';
export const defaultPrintSettings: NativePrintSettings = { printer: null, paper: 58, semAcentos: false, copies: 1, printOnAccept: true, subnets: '192.168.0, 192.168.1' };

export function loadPrintSettings(): NativePrintSettings {
  try { return { ...defaultPrintSettings, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return defaultPrintSettings; }
}
export function savePrintSettings(s: NativePrintSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* armazenamento indisponível */ }
}

export const printerLabel = (p: Printer) => (p.kind === 'bluetooth' ? `${p.name || 'Bluetooth'} · ${p.address}` : `${p.name} · ${p.ip}:${p.port}`);
export const printerKey = (p: Printer) => (p.kind === 'bluetooth' ? p.address : `${p.ip}:${p.port}`);

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), ms))]);

export async function scanBluetooth(onFound: (list: Printer[]) => void, ms = 12000): Promise<void> {
  const bt = nativePlugin('CapacitorThermalPrinter');
  const seen = new Map<string, Printer>();
  const sub = await bt.addListener('discoverDevices', ({ devices }: { devices: { name: string; address: string }[] }) => {
    for (const d of devices) seen.set(d.address, { kind: 'bluetooth', name: d.name, address: d.address });
    onFound([...seen.values()]);
  });
  let finish: Listener | undefined;
  const done = new Promise<void>(resolve => {
    Promise.resolve(bt.addListener('discoveryFinish', () => resolve())).then(l => { finish = l; });
    setTimeout(resolve, ms);
  });
  try {
    await bt.startScan();
    await done;
  } finally {
    await bt.stopScan().catch(() => undefined);
    await sub.remove().catch(() => undefined);
    await finish?.remove().catch(() => undefined);
  }
}
type Listener = { remove: () => Promise<void> };

/** Testa a porta 9100 em cada IP das redes informadas (ex.: "192.168.0"). */
export async function scanNetwork(subnets: string[], onFound: (list: Printer[]) => void, onProgress?: (pct: number) => void): Promise<void> {
  const tcp = nativePlugin('TcpSocket');
  const ips = subnets.flatMap(s => Array.from({ length: 254 }, (_, i) => `${s}.${i + 1}`));
  const found: Printer[] = [];
  let done = 0;
  for (let i = 0; i < ips.length; i += 40) {
    await Promise.all(ips.slice(i, i + 40).map(async ip => {
      try {
        const { client } = await withTimeout(tcp.connect({ ipAddress: ip, port: 9100 }), 1500);
        await tcp.disconnect({ client }).catch(() => undefined);
        found.push({ kind: 'network', name: 'Impressora de rede', ip, port: 9100 });
        onFound([...found]);
      } catch { /* nada neste IP */ } finally { done++; onProgress?.(Math.round((done / ips.length) * 100)); }
    }));
  }
}

let btConnected: string | null = null;

export async function sendToPrinter(p: Printer, bytes: Uint8Array): Promise<void> {
  const data = toBase64(bytes);
  if (p.kind === 'bluetooth') {
    const bt = nativePlugin('CapacitorThermalPrinter');
    const state = await bt.isConnected().then(r => !!r?.state).catch(() => false);
    if (!state || btConnected !== p.address) {
      const dev = await withTimeout(bt.connect({ address: p.address }), 15000);
      if (!dev) throw new Error('não conectou na impressora Bluetooth (ligada e perto?)');
      btConnected = p.address;
    }
    await bt.begin();
    await bt.raw({ data });
    await bt.write();
    return;
  }
  const tcp = nativePlugin('TcpSocket');
  const { client } = await withTimeout(tcp.connect({ ipAddress: p.ip, port: p.port }), 5000);
  try {
    await tcp.send({ client, data, encoding: 'base64' });
  } finally {
    await tcp.disconnect({ client }).catch(() => undefined);
  }
}
