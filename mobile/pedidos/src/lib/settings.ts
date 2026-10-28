import type { Printer } from './printers';
import type { PrintWhen } from './printRules';

export interface Settings {
  storeId: string | null;
  storeName: string;
  printer: Printer | null;
  paper: 58 | 80;
  semAcentos: boolean;
  copies: number;
  autoPrint: boolean;
  when: PrintWhen;
  subnets: string;
}

const KEY = 'mostralo-pedidos-settings';
export const defaults: Settings = { storeId: null, storeName: '', printer: null, paper: 58, semAcentos: false, copies: 1, autoPrint: true, when: 'arrive', subnets: '192.168.0, 192.168.1' };

export function loadSettings(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return defaults; }
}
export function saveSettings(s: Settings) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ } }

const PKEY = 'mostralo-pedidos-impressos';
export function loadPrinted(): string[] { try { return JSON.parse(localStorage.getItem(PKEY) || '[]'); } catch { return []; } }
export function savePrinted(l: string[]) { try { localStorage.setItem(PKEY, JSON.stringify(l)); } catch { /* */ } }
