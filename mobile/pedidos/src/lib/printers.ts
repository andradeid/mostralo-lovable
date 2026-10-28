// Impressoras: procura Bluetooth (térmicas pareadas/por perto) e de rede (porta 9100 no mesmo Wi-Fi) e envia os bytes ESC/POS.
import { CapacitorThermalPrinter } from 'capacitor-thermal-printer';
import { TcpSocket, DataEncoding } from 'capacitor-tcp-socket';
import { toBase64 } from './escpos';

export type Printer =
  | { kind: 'bluetooth'; name: string; address: string }
  | { kind: 'network'; name: string; ip: string; port: number };

export const printerLabel = (p: Printer) => (p.kind === 'bluetooth' ? `${p.name || 'Bluetooth'} · ${p.address}` : `${p.name} · ${p.ip}:${p.port}`);

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

/** Procura térmicas Bluetooth por até `ms`. */
export async function scanBluetooth(onFound: (list: Printer[]) => void, ms = 12000): Promise<void> {
  const seen = new Map<string, Printer>();
  const sub = await CapacitorThermalPrinter.addListener('discoverDevices', ({ devices }) => {
    for (const d of devices) seen.set(d.address, { kind: 'bluetooth', name: d.name, address: d.address });
    onFound([...seen.values()]);
  });
  const done = new Promise<void>(resolve => {
    CapacitorThermalPrinter.addListener('discoveryFinish', () => resolve());
    setTimeout(resolve, ms);
  });
  try {
    await CapacitorThermalPrinter.startScan();
    await done;
  } finally {
    await CapacitorThermalPrinter.stopScan().catch(() => undefined);
    await sub.remove();
  }
}

/** Testa a porta 9100 em cada IP das redes informadas (ex.: "192.168.0", "192.168.1"). */
export async function scanNetwork(subnets: string[], onFound: (list: Printer[]) => void, onProgress?: (done: number, total: number) => void): Promise<void> {
  const ips = subnets.flatMap(s => Array.from({ length: 254 }, (_, i) => `${s}.${i + 1}`));
  const found: Printer[] = [];
  let done = 0;
  const batch = 40;
  for (let i = 0; i < ips.length; i += batch) {
    await Promise.all(ips.slice(i, i + batch).map(async ip => {
      try {
        const { client } = await withTimeout(TcpSocket.connect({ ipAddress: ip, port: 9100 }), 1500);
        await TcpSocket.disconnect({ client }).catch(() => undefined);
        found.push({ kind: 'network', name: 'Impressora de rede', ip, port: 9100 });
        onFound([...found]);
      } catch { /* sem impressora neste IP */ }
      finally { done++; onProgress?.(done, ips.length); }
    }));
  }
}

let btConnected: string | null = null;

/** Envia os bytes para a impressora escolhida (reconecta o Bluetooth se precisar). */
export async function sendToPrinter(p: Printer, bytes: Uint8Array): Promise<void> {
  if (p.kind === 'bluetooth') {
    const connected = await CapacitorThermalPrinter.isConnected().catch(() => false);
    if (!connected || btConnected !== p.address) {
      const dev = await withTimeout(CapacitorThermalPrinter.connect({ address: p.address }), 15000);
      if (!dev) throw new Error('Não conectou na impressora Bluetooth. Ela está ligada e perto?');
      btConnected = p.address;
    }
    await CapacitorThermalPrinter.begin().raw(toBase64(bytes)).write();
    return;
  }
  const { client } = await withTimeout(TcpSocket.connect({ ipAddress: p.ip, port: p.port }), 5000);
  try {
    await TcpSocket.send({ client, data: toBase64(bytes), encoding: DataEncoding.BASE64 });
  } finally {
    await TcpSocket.disconnect({ client }).catch(() => undefined);
  }
}
