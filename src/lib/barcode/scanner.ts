// Leitor de código de barras em modo teclado (USB/Bluetooth, de mão ou de mesa): ele "digita"
// o código numa rajada muito rápida e termina com Enter (ou Tab). Regras puras: juntar a
// rajada, decidir se foi leitor (e não uma pessoa digitando) e onde a leitura pode agir.
import { looksLikeBarcode, normalizeBarcode } from '../pdv/barcode.ts';

export interface ScannerConfig {
  /** Menor código aceito (EAN-8 tem 8; códigos internos curtos ficam de fora de propósito). */
  minLength: number;
  maxLength: number;
  /** Maior intervalo entre duas teclas da rajada. Pessoa digitando rápido fica acima de 80 ms. */
  maxGapMs: number;
  /** Maior intervalo entre a última tecla e o Enter/Tab do leitor. */
  maxEndGapMs: number;
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  minLength: 6,
  maxLength: 20,
  maxGapMs: 50,
  maxEndGapMs: 100,
};

export interface ScanBuffer {
  chars: string;
  times: number[];
}

export const EMPTY_BUFFER: ScanBuffer = { chars: '', times: [] };

export interface KeyInput {
  key: string;
  time: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** Teclas que o leitor aperta junto (Shift das letras maiúsculas) e que não quebram a rajada. */
const MODIFIER_KEYS = new Set(['Shift', 'CapsLock', 'NumLock', 'Unidentified']);

export const isTerminatorKey = (key: string) => key === 'Enter' || key === 'Tab';

/** O que foi juntado até aqui é uma leitura? (chamado no Enter/Tab, com o horário dele) */
export function isScan(buffer: ScanBuffer, endTime: number, cfg: ScannerConfig = DEFAULT_SCANNER_CONFIG): boolean {
  const { chars, times } = buffer;
  if (chars.length < cfg.minLength || chars.length > cfg.maxLength) return false;
  if (!/^[A-Za-z0-9._/-]+$/.test(chars) || !looksLikeBarcode(chars)) return false;
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] > cfg.maxGapMs) return false;
  }
  return endTime - times[times.length - 1] <= cfg.maxEndGapMs;
}

export interface FeedResult {
  buffer: ScanBuffer;
  /** Código lido (só no Enter/Tab de uma rajada válida). */
  code: string | null;
}

/** Recebe uma tecla e devolve o novo acumulado e, no fim de uma rajada válida, o código. */
export function feedKey(buffer: ScanBuffer, input: KeyInput, cfg: ScannerConfig = DEFAULT_SCANNER_CONFIG): FeedResult {
  const { key, time } = input;
  if (MODIFIER_KEYS.has(key)) return { buffer, code: null };
  if (input.ctrlKey || input.metaKey || input.altKey) return { buffer: EMPTY_BUFFER, code: null };

  if (isTerminatorKey(key)) {
    const code = isScan(buffer, time, cfg) ? normalizeBarcode(buffer.chars) : null;
    return { buffer: EMPTY_BUFFER, code };
  }

  if (key.length !== 1) return { buffer: EMPTY_BUFFER, code: null };

  const last = buffer.times[buffer.times.length - 1];
  // Pausa longa: o que veio antes era outra coisa; a rajada recomeça nesta tecla
  if (last === undefined || time - last > cfg.maxGapMs) return { buffer: { chars: key, times: [time] }, code: null };
  // Mais comprido que qualquer código: continua juntando (e vai falhar no fim), sem crescer sem limite
  if (buffer.chars.length > cfg.maxLength) return { buffer: { chars: buffer.chars, times: [time] }, code: null };
  return { buffer: { chars: buffer.chars + key, times: [...buffer.times, time] }, code: null };
}

/** Onde está o foco quando a tecla chega. */
export type FocusKind =
  /** Campo de busca de produto (marcado com data-barcode-search): a leitura é consumida e a busca limpa. */
  | 'search'
  /** Outro campo de texto (valor recebido, desconto, CPF, nome...): a leitura não interfere. */
  | 'editable'
  /** Nada focado, botão, aba...: a leitura é consumida (o Enter não "clica" no botão focado). */
  | 'other';

export interface ElementInfo {
  tagName: string;
  type?: string | null;
  role?: string | null;
  isContentEditable?: boolean;
  isProductSearch?: boolean;
}

const NON_TEXT_INPUTS = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image']);
const EDITABLE_ROLES = new Set(['textbox', 'combobox', 'searchbox', 'spinbutton', 'listbox', 'menu', 'menuitem', 'option']);

export function classifyFocus(el: ElementInfo | null): FocusKind {
  if (!el) return 'other';
  if (el.isProductSearch) return 'search';
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return 'editable';
  if (tag === 'INPUT') return NON_TEXT_INPUTS.has((el.type ?? 'text').toLowerCase()) ? 'other' : 'editable';
  if (el.role && EDITABLE_ROLES.has(el.role)) return 'editable';
  return 'other';
}

/**
 * Diálogos abertos (na ordem do DOM: o último é o de cima) e a "zona" de cada um
 * (data-barcode-zone, ou null). Sem zona, a tela só lê sem nenhum diálogo aberto;
 * com zona, só quando o diálogo de cima é o dela (ex.: "Novo pedido").
 */
export function scanAllowed(zone: string | undefined, openDialogZones: (string | null)[]): boolean {
  if (!zone) return openDialogZones.length === 0;
  return openDialogZones.length > 0 && openDialogZones[openDialogZones.length - 1] === zone;
}
