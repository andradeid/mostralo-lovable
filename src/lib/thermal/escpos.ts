// Comandos ESC/POS para impressora térmica (Bluetooth ou rede usam os mesmos bytes).
// Texto em PC850 (página 2), que a maioria das térmicas aceita; com `semAcentos` vira ASCII puro.

const ESC = 0x1b;
const GS = 0x1d;

const PC850: Record<string, number> = {
  'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'ä': 0x84, 'à': 0x85, 'ç': 0x87, 'ê': 0x88, 'ë': 0x89, 'è': 0x8a,
  'ï': 0x8b, 'î': 0x8c, 'ì': 0x8d, 'Ä': 0x8e, 'É': 0x90, 'ô': 0x93, 'ö': 0x94, 'ò': 0x95, 'û': 0x96, 'ù': 0x97,
  'Ö': 0x99, 'Ü': 0x9a, 'á': 0xa0, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'ª': 0xa6, 'º': 0xa7,
  'Á': 0xb5, 'Â': 0xb6, 'À': 0xb7, 'ã': 0xc6, 'Ã': 0xc7, 'Ê': 0xd2, 'Í': 0xd6, 'Ó': 0xe0, 'Ô': 0xe2, 'õ': 0xe4,
  'Õ': 0xe5, 'Ú': 0xe9, '°': 0xf8,
};

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ºª°]/g, 'o');
}

export function encodeText(text: string, semAcentos = false): number[] {
  const src = semAcentos ? stripAccents(text) : text;
  const out: number[] = [];
  for (const ch of src) {
    const code = ch.charCodeAt(0);
    if (code === 10 || (code >= 32 && code < 127)) out.push(code);
    else if (!semAcentos && PC850[ch] !== undefined) out.push(PC850[ch]);
    else if (ch === '–' || ch === '—') out.push(0x2d);
    else if (ch === '“' || ch === '”') out.push(0x22);
    else if (ch === '‘' || ch === '’') out.push(0x27);
    else {
      const plain = stripAccents(ch);
      out.push(...[...plain].map(c => (c.charCodeAt(0) < 127 ? c.charCodeAt(0) : 0x3f)));
    }
  }
  return out;
}

export type Align = 'left' | 'center' | 'right';

/** Montador de recibo: acumula bytes e devolve tudo no fim. */
export class Receipt {
  private bytes: number[] = [ESC, 0x40]; // inicializa
  constructor(private semAcentos = false) {
    if (!semAcentos) this.bytes.push(ESC, 0x74, 2); // página PC850
  }
  align(a: Align) { this.bytes.push(ESC, 0x61, a === 'center' ? 1 : a === 'right' ? 2 : 0); return this; }
  bold(on = true) { this.bytes.push(ESC, 0x45, on ? 1 : 0); return this; }
  size(double: boolean) { this.bytes.push(GS, 0x21, double ? 0x11 : 0x00); return this; }
  text(t: string) { this.bytes.push(...encodeText(t, this.semAcentos)); return this; }
  line(t = '') { return this.text(t + '\n'); }
  feed(n = 1) { this.bytes.push(ESC, 0x64, n); return this; }
  cut() { this.bytes.push(GS, 0x56, 0x42, 0x00); return this; } // avança e corta (parcial)
  beep() { this.bytes.push(ESC, 0x42, 2, 2); return this; }
  build(): Uint8Array { return Uint8Array.from(this.bytes); }
}

export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
