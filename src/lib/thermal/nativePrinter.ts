// Impressora térmica do app: escolha (Bluetooth ou rede), configurações e envio dos bytes ESC/POS.
import { nativePlugin, nativePluginNames } from './nativeBridge';
import { supabase } from '@/integrations/supabase/client';
import { toBase64, type CodePage } from './escpos';

export type Printer =
  | { kind: 'bluetooth'; name: string; address: string; paired?: boolean; likely?: boolean }
  | { kind: 'network'; name: string; ip: string; port: number };

export interface NativePrintSettings {
  printer: Printer | null;
  paper: 58 | 80;
  semAcentos: boolean;
  /** Tabela de acentos que a impressora entende (escolhida pelo teste). */
  codepage?: CodePage;
  /** Impressora corta o papel sozinha (guilhotina). */
  cutter?: boolean;
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
/** Guarda só o essencial da impressora escolhida (sem as marcas da busca). */
export const cleanPrinter = (p: Printer): Printer => (p.kind === 'bluetooth' ? { kind: 'bluetooth', name: p.name, address: p.address } : p);
export const printerKey = (p: Printer) => (p.kind === 'bluetooth' ? p.address : `${p.ip}:${p.port}`);

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), ms))]);

/** Nomes comuns de térmicas (ajuda a pôr a impressora no topo da lista de pareados). */
const PRINTER_NAME = /print|impress|pos|pt-?\d|mpt|mtp|rpp|58|80|thermal|termica|innerprinter|knup|elgin|bema|epson|tanca|gertec|sunmi|goojprt|xprinter|zjiang|bluetooth printer/i;

export const WEB_VERSION = 'site-bt-diag-5';

/** Manda o registro de diagnóstico para o banco (tabela app_debug_logs), em lotes. */
const SESSION = Math.random().toString(36).slice(2, 10);
let pending: string[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
export function remoteLog(line: string, source = 'impressora') {
  pending.push(line.slice(0, 1900));
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    const rows = pending.map(l => ({ session: SESSION, source, line: l }));
    pending = []; flushTimer = null;
    try { await (supabase as any).from('app_debug_logs').insert(rows); } catch { /* sem rede: ignora */ }
  }, 800);
}

/** Registro da busca de impressoras, mostrado na tela do app para diagnóstico. */
type LogFn = (line: string) => void;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e));

/**
 * Lista as impressoras Bluetooth.
 * 1º: aparelhos já pareados no celular — é assim que a maioria das térmicas aparece.
 * 2º: busca de aparelhos visíveis por perto (o plugin só devolve os que se declaram "impressora").
 */
export async function scanBluetooth(onFound: (list: Printer[]) => void, ms = 12000, log: LogFn = () => undefined): Promise<void> {
  const seen = new Map<string, Printer>();
  const emit = () => onFound([...seen.values()].sort((a, b) => Number(!!(b as any).likely) - Number(!!(a as any).likely)));
  let pairedError: Error | null = null;

  log(`Versão do site: ${WEB_VERSION}`);
  log(`Plugins no APK: ${nativePluginNames().join(', ') || 'nenhum listado'}`);

  // 1. Diagnóstico do aparelho
  try {
    const d = await withTimeout(nativePlugin('PairedPrinters').diag(), 5000);
    log(`App nativo: ${d.version} · Android SDK ${d.sdk} · ${d.device}`);
    log(`Permissão Dispositivos por perto (conectar): ${d.permConnect ? 'OK' : 'NEGADA'}`);
    log(`Permissão Dispositivos por perto (buscar): ${d.permScan ? 'OK' : 'NEGADA'}`);
    log(`Permissão Localização: ${d.permLocation ? 'OK' : 'NEGADA'} · Localização ligada: ${d.locationOn ? 'sim' : 'NÃO'}`);
    log(`Bluetooth: ${d.hasBluetooth ? (d.bluetoothOn ? 'ligado' : 'DESLIGADO') : 'NÃO EXISTE'}`);
  } catch (e) {
    log(`Diagnóstico indisponível: ${errMsg(e)} (APK antigo? instale o APK novo)`);
  }

  // 2. Pareados
  try {
    log('Lendo aparelhos pareados…');
    const { devices } = await withTimeout(nativePlugin('PairedPrinters').list(), 5000);
    const list = (devices ?? []) as { name?: string; address: string; likelyPrinter?: boolean; type?: string; majorName?: string }[];
    log(`Pareados encontrados: ${list.length}`);
    for (const d of list) {
      const name = d.name || 'Bluetooth';
      const audio = /áudio|audio|telefone|computador|vestível/i.test(d.majorName ?? '');
      const likely = !audio && (!!d.likelyPrinter || PRINTER_NAME.test(name));
      log(`  • ${name} · ${d.address} · ${d.type ?? '?'} · ${d.majorName ?? '?'}${likely ? ' · parece impressora' : ''}`);
      seen.set(d.address, { kind: 'bluetooth', name, address: d.address, paired: true, likely });
    }
    emit();
  } catch (e) {
    const m = errMsg(e);
    log(`Erro ao ler pareados: ${m}`);
    if (!/not implemented|não implementad/i.test(m)) pairedError = new Error(m);
  }

  // 3. Busca de aparelhos visíveis
  const bt = nativePlugin('CapacitorThermalPrinter');
  let events = 0;
  const sub = await bt.addListener('discoverDevices', ({ devices }: { devices: { name: string; address: string }[] }) => {
    events++;
    for (const d of devices) {
      if (!seen.has(d.address)) {
        log(`  • Busca achou: ${d.name || 'sem nome'} · ${d.address}`);
        seen.set(d.address, { kind: 'bluetooth', name: d.name || 'Impressora', address: d.address, likely: true });
      }
    }
    emit();
  });
  let finish: Listener | undefined;
  const done = new Promise<void>(resolve => {
    Promise.resolve(bt.addListener('discoveryFinish', () => { log('Busca terminou'); resolve(); })).then(l => { finish = l; });
    setTimeout(() => { log(`Busca encerrada após ${ms / 1000}s`); resolve(); }, ms);
  });
  try {
    log('Buscando aparelhos visíveis por perto…');
    await bt.startScan();
    log('Busca iniciada');
    await done;
  } catch (e) {
    log(`Erro na busca: ${errMsg(e)}`);
    if (seen.size === 0) throw pairedError ?? (e instanceof Error ? e : new Error(errMsg(e)));
  } finally {
    await bt.stopScan().catch(() => undefined);
    await Promise.resolve(sub.remove()).catch(() => undefined);
    await finish?.remove().catch(() => undefined);
  }
  log(`Fim: ${seen.size} aparelho(s) na lista (eventos da busca: ${events})`);
  if (seen.size === 0 && pairedError) throw pairedError;
}
type Listener = { remove: () => Promise<void> };

/** Rede do celular (a.b.c) descoberta pelo app; vazio se não der. */
export async function phoneSubnets(log: LogFn = () => undefined): Promise<string[]> {
  try {
    const n = await withTimeout(nativePlugin('PairedPrinters').network(), 4000);
    const list = ((n?.addresses ?? []) as { ip: string; prefix: number }[]);
    log(`Rede do celular: ${n?.wifi ? 'Wi-Fi' : n?.ethernet ? 'cabo' : n?.cellular ? 'DADOS MÓVEIS (ligue o Wi-Fi da loja)' : 'desconhecida'} · ${list.map(a => `${a.ip}/${a.prefix}`).join(', ') || 'sem IP'}`);
    return list.filter(a => !a.ip.startsWith('127.') && !a.ip.startsWith('100.') && a.prefix >= 16)
      .map(a => a.ip.split('.').slice(0, 3).join('.'));
  } catch (e) {
    log(`Não deu para ler a rede do celular: ${errMsg(e)} (APK antigo?)`);
    return [];
  }
}

/** Testa a porta 9100 (impressoras de rede) em cada IP: primeiro a rede do celular, depois as informadas. */
export async function scanNetwork(subnets: string[], onFound: (list: Printer[]) => void, onProgress?: (pct: number) => void, log: LogFn = () => undefined): Promise<string[]> {
  const tcp = nativePlugin('TcpSocket');
  const auto = await phoneSubnets(log);
  const nets = [...new Set([...auto, ...subnets])];
  log(`Procurando nas redes: ${nets.map(n => n + '.x').join(', ') || 'nenhuma'} (porta 9100)`);
  const ips = nets.flatMap(s => Array.from({ length: 254 }, (_, i) => `${s}.${i + 1}`));
  const found: Printer[] = [];
  let done = 0;
  let lastPct = -1;
  for (let i = 0; i < ips.length; i += 40) {
    await Promise.all(ips.slice(i, i + 40).map(async ip => {
      try {
        const { client } = await withTimeout(tcp.connect({ ipAddress: ip, port: 9100 }), 1500);
        await tcp.disconnect({ client }).catch(() => undefined);
        log(`  • Impressora respondeu em ${ip}:9100`);
        found.push({ kind: 'network', name: 'Impressora de rede', ip, port: 9100 });
        onFound([...found]);
      } catch { /* nada neste IP */ } finally {
        done++;
        const pct = Math.round((done / ips.length) * 100);
        onProgress?.(pct);
        if (pct % 25 === 0 && pct !== lastPct) { lastPct = pct; log(`Busca na rede: ${pct}%`); }
      }
    }));
  }
  log(`Fim da busca na rede: ${found.length} impressora(s)`);
  return auto;
}

let btConnected: string | null = null;

export async function sendToPrinter(p: Printer, bytes: Uint8Array, log: LogFn = () => undefined): Promise<void> {
  const data = toBase64(bytes);
  if (p.kind === 'bluetooth') {
    const bt = nativePlugin('CapacitorThermalPrinter');
    const state = await bt.isConnected().then(r => !!r?.state).catch(() => false);
    log(`Já conectado: ${state ? 'sim' : 'não'}`);
    if (!state || btConnected !== p.address) {
      log(`Conectando em ${p.address}…`);
      const dev = await withTimeout(bt.connect({ address: p.address }), 15000).catch(e => { log(`Erro ao conectar: ${errMsg(e)}`); throw e; });
      if (!dev) { log('Conexão devolveu vazio'); throw new Error('não conectou na impressora Bluetooth (ligada e perto?)'); }
      log('Conectado');
      btConnected = p.address;
    }
    log(`Enviando ${bytes.length} bytes…`);
    await bt.begin();
    await bt.raw({ data });
    await bt.write();
    log('Enviado para a impressora');
    return;
  }
  const tcp = nativePlugin('TcpSocket');
  log(`Conectando em ${p.ip}:${p.port}…`);
  const { client } = await withTimeout(tcp.connect({ ipAddress: p.ip, port: p.port }), 5000)
    .catch(e => { log(`Erro ao conectar na rede: ${errMsg(e)}`); throw new Error(`não conectou em ${p.ip}:${p.port} (mesma rede? IP certo?)`); });
  log(`Conectado · enviando ${bytes.length} bytes…`);
  try {
    await tcp.send({ client, data, encoding: 'base64' });
    log('Enviado para a impressora');
  } finally {
    await tcp.disconnect({ client }).catch(() => undefined);
  }
}
