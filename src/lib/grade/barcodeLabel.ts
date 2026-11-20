// Código de barras das combinações: EAN-13 interno (prefixo 2, uso dentro da loja) e as barras
// para a etiqueta (EAN-13 quando o código é um EAN válido; Code 128 para qualquer outro texto).

/** Dígito verificador do EAN-13 a partir dos 12 primeiros dígitos. */
export function ean13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

/** EAN-13 interno (começa com 2). `random` devolve 0..1 (Math.random por padrão). */
export function internalEan13(random: () => number = Math.random): string {
  let body = '2';
  for (let i = 0; i < 11; i++) body += Math.floor(random() * 10) % 10;
  return body + ean13CheckDigit(body);
}

/** Gera códigos para as combinações sem código, sem repetir os que já existem. */
export function fillMissingBarcodes<T extends { barcode?: string | null }>(items: T[], taken: Iterable<string> = [], random: () => number = Math.random): T[] {
  const used = new Set<string>([...taken, ...items.map((i) => (i.barcode ?? '').trim()).filter(Boolean)]);
  return items.map((item) => {
    if ((item.barcode ?? '').trim()) return item;
    let code = internalEan13(random);
    for (let tries = 0; used.has(code) && tries < 50; tries++) code = internalEan13(random);
    used.add(code);
    return { ...item, barcode: code };
  });
}

// ── EAN-13 ──
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** Módulos (1 = barra) do EAN-13: 95 módulos. */
export function ean13Modules(code: string): string {
  const d = code.split('').map(Number);
  const parity = PARITY[d[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === 'L' ? L : G)[d[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return bits + '101';
}

// ── Code 128 (conjunto B) ──
const C128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232',
  '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122',
  '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311',
  '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113',
  '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422',
  '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111',
  '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121',
  '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

/** Módulos do Code 128-B (texto ASCII imprimível). */
export function code128Modules(text: string): string {
  const codes = [104];
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    codes.push(c >= 32 && c <= 126 ? c - 32 : 0);
  }
  let check = codes[0];
  for (let i = 1; i < codes.length; i++) check += codes[i] * i;
  codes.push(check % 103, 106);
  let bits = '';
  for (const code of codes) {
    const widths = C128[code];
    for (let i = 0; i < widths.length; i++) bits += (i % 2 === 0 ? '1' : '0').repeat(Number(widths[i]));
  }
  return bits;
}

/** Módulos do código (EAN-13 se válido, senão Code 128). */
export function barcodeModules(code: string): string {
  return isValidEan13(code) ? ean13Modules(code) : code128Modules(code);
}

/** SVG das barras (sem texto), largura em módulos com 10 módulos de margem de cada lado. */
export function barcodeSvg(code: string, height = 40, moduleWidth = 2): string {
  const bits = barcodeModules(code);
  const quiet = 10;
  const width = (bits.length + quiet * 2) * moduleWidth;
  let rects = '';
  let x = quiet;
  for (let i = 0; i < bits.length; ) {
    if (bits[i] === '1') {
      let w = 1;
      while (bits[i + w] === '1') w++;
      rects += `<rect x="${x * moduleWidth}" y="0" width="${w * moduleWidth}" height="${height}"/>`;
      x += w;
      i += w;
    } else {
      x++;
      i++;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="#000">${rects}</svg>`;
}
