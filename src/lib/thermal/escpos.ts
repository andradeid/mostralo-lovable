// Comandos ESC/POS para impressora térmica (Bluetooth ou rede usam os mesmos bytes).
// Texto na tabela de acentos escolhida (PC850 por padrão); 'none' vira ASCII puro.
// Antes, desliga o modo de caracteres chineses (FS .), que faz térmicas chinesas ignorarem a tabela.

const ESC = 0x1b;
const GS = 0x1d;
const FS = 0x1c;

const PC850: Record<string, number> = { 'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'ä': 0x84, 'à': 0x85, 'ç': 0x87, 'ê': 0x88, 'ë': 0x89, 'è': 0x8a, 'ï': 0x8b, 'î': 0x8c, 'ì': 0x8d, 'Ä': 0x8e, 'É': 0x90, 'ô': 0x93, 'ö': 0x94, 'ò': 0x95, 'û': 0x96, 'ù': 0x97, 'Ö': 0x99, 'Ü': 0x9a, 'á': 0xa0, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'ª': 0xa6, 'º': 0xa7, 'Á': 0xb5, 'Â': 0xb6, 'À': 0xb7, 'ã': 0xc6, 'Ã': 0xc7, 'Ê': 0xd2, 'Í': 0xd6, 'Ó': 0xe0, 'Ô': 0xe2, 'õ': 0xe4, 'Õ': 0xe5, 'Ú': 0xe9, '°': 0xf8, 'È': 0xd4, 'Ì': 0xde, 'Ò': 0xe3, 'Ù': 0xeb };
const PC860: Record<string, number> = { 'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'à': 0x85, 'ç': 0x87, 'ê': 0x88, 'è': 0x8a, 'ì': 0x8d, 'É': 0x90, 'ô': 0x93, 'ò': 0x95, 'ù': 0x97, 'Ü': 0x9a, 'á': 0xa0, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'ª': 0xa6, 'º': 0xa7, 'Á': 0x86, 'Â': 0x8f, 'À': 0x91, 'ã': 0x84, 'Ã': 0x8e, 'Ê': 0x89, 'Í': 0x8b, 'Ó': 0x9f, 'Ô': 0x8c, 'õ': 0x94, 'Õ': 0x99, 'Ú': 0x96, '°': 0xf8, 'È': 0x92, 'Ì': 0x98, 'Ò': 0xa9, 'Ù': 0x9d };
const PC437: Record<string, number> = { 'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'ä': 0x84, 'à': 0x85, 'ç': 0x87, 'ê': 0x88, 'ë': 0x89, 'è': 0x8a, 'ï': 0x8b, 'î': 0x8c, 'ì': 0x8d, 'Ä': 0x8e, 'É': 0x90, 'ô': 0x93, 'ö': 0x94, 'ò': 0x95, 'û': 0x96, 'ù': 0x97, 'Ö': 0x99, 'Ü': 0x9a, 'á': 0xa0, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'ª': 0xa6, 'º': 0xa7, '°': 0xf8 };
const WPC1252: Record<string, number> = { 'Ç': 0xc7, 'ü': 0xfc, 'é': 0xe9, 'â': 0xe2, 'ä': 0xe4, 'à': 0xe0, 'ç': 0xe7, 'ê': 0xea, 'ë': 0xeb, 'è': 0xe8, 'ï': 0xef, 'î': 0xee, 'ì': 0xec, 'Ä': 0xc4, 'É': 0xc9, 'ô': 0xf4, 'ö': 0xf6, 'ò': 0xf2, 'û': 0xfb, 'ù': 0xf9, 'Ö': 0xd6, 'Ü': 0xdc, 'á': 0xe1, 'í': 0xed, 'ó': 0xf3, 'ú': 0xfa, 'ñ': 0xf1, 'Ñ': 0xd1, 'ª': 0xaa, 'º': 0xba, 'Á': 0xc1, 'Â': 0xc2, 'À': 0xc0, 'ã': 0xe3, 'Ã': 0xc3, 'Ê': 0xca, 'Í': 0xcd, 'Ó': 0xd3, 'Ô': 0xd4, 'õ': 0xf5, 'Õ': 0xd5, 'Ú': 0xda, '°': 0xb0, 'È': 0xc8, 'Ì': 0xcc, 'Ò': 0xd2, 'Ù': 0xd9 };

/** Tabelas de acentos: página que se manda à impressora (ESC t n) e o mapa de caracteres. */
export type CodePage = 'pc850' | 'pc860' | 'wpc1252' | 'pc437' | 'none' | 'gbk';

/** Térmicas chinesas presas no modo chinês (ignoram ESC t): só estes acentos existem na tabela GB2312. */
const GBK: Record<string, number[]> = {
  'á': [0xa8, 0xa2], 'é': [0xa8, 0xa6], 'í': [0xa8, 0xaa], 'ó': [0xa8, 0xae], 'ú': [0xa8, 0xb2],
  'à': [0xa8, 0xa4], 'è': [0xa8, 0xa8], 'ì': [0xa8, 0xac], 'ò': [0xa8, 0xb0], 'ù': [0xa8, 0xb4],
  'ü': [0xa8, 0xb9], 'ê': [0xa8, 0xba],
};
export const CODE_PAGES: { id: CodePage; label: string; n: number; map: Record<string, number> }[] = [
  { id: 'pc850', label: 'PC850', n: 2, map: PC850 },
  { id: 'pc860', label: 'PC860 (Portugal)', n: 3, map: PC860 },
  { id: 'wpc1252', label: 'Windows 1252', n: 16, map: WPC1252 },
  { id: 'pc437', label: 'PC437', n: 0, map: PC437 },
];
const pageOf = (cp: CodePage) => CODE_PAGES.find(p => p.id === cp);
/** Opções que aparecem no app, na ordem das linhas do teste. */
export const CODE_PAGE_OPTIONS: { id: CodePage; label: string }[] = [
  ...CODE_PAGES.map(p => ({ id: p.id, label: p.label })),
  { id: 'none', label: 'Sem acentos' },
  { id: 'gbk', label: 'Modo chinês (alguns acentos)' },
];

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ºª°]/g, 'o');
}

export function encodeText(text: string, cp: CodePage = 'pc850'): number[] {
  const map = pageOf(cp)?.map;
  // NFC: acento digitado separado da letra (e + ^) vira um caractere só (ê)
  const src = map || cp === 'gbk' ? text.normalize('NFC') : stripAccents(text);
  const out: number[] = [];
  for (const ch of src) {
    const code = ch.charCodeAt(0);
    if (code === 10 || (code >= 32 && code < 127)) out.push(code);
    else if (cp === 'gbk' && GBK[ch]) out.push(...GBK[ch]);
    else if (map && map[ch] !== undefined) out.push(map[ch]);
    else if (ch === '–' || ch === '—' || ch === '·' || ch === '•') out.push(0x2d);
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
  constructor(private cp: CodePage = 'pc850') {
    this.page(cp);
  }
  /** Troca a tabela de acentos dali para frente. */
  page(cp: CodePage) {
    this.cp = cp;
    const p = pageOf(cp);
    if (cp === 'gbk') this.bytes.push(FS, 0x26); // liga o modo chinês
    else { this.bytes.push(FS, 0x2e); if (p) this.bytes.push(ESC, 0x74, p.n); } // desliga o modo chinês e escolhe a tabela
    return this;
  }
  align(a: Align) { this.bytes.push(ESC, 0x61, a === 'center' ? 1 : a === 'right' ? 2 : 0); return this; }
  bold(on = true) { this.bytes.push(ESC, 0x45, on ? 1 : 0); return this; }
  size(double: boolean) { this.bytes.push(GS, 0x21, double ? 0x11 : 0x00); return this; }
  text(t: string) { this.bytes.push(...encodeText(t, this.cp)); return this; }
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
