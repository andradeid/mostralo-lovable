// Código de barras: normalização, tipo (EAN/GTIN ou interno) e busca exata.
// Funções puras, usadas no PDV, no cadastro de produto e na tela de Estoque.
// A detecção do leitor (rajada de teclas + Enter) fica em src/lib/barcode/scanner.ts.

export type BarcodeKind = 'ean8' | 'upc12' | 'ean13' | 'gtin14' | 'interno';

/** Tira espaços (inclusive no meio, como "789 1234 56789 0") e quebras de linha do leitor. */
export function normalizeBarcode(value: string | null | undefined): string {
  return String(value ?? '').replace(/\s+/g, '');
}

/** Valor para gravar em products.barcode: vazio vira null. */
export function barcodeForSave(value: string | null | undefined): string | null {
  const code = normalizeBarcode(value);
  return code === '' ? null : code;
}

/** Dígito verificador GS1 (EAN-8, UPC-A, EAN-13, GTIN-14). */
export function hasValidGtinCheckDigit(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  let sum = 0;
  // Da direita para a esquerda: pesos 3, 1, 3, 1...
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += digits[i] * w;
  return (10 - (sum % 10)) % 10 === check;
}

/** Tipo do código: EAN/GTIN quando só dígitos no tamanho padrão e dígito verificador certo; senão, interno. */
export function barcodeKind(value: string): BarcodeKind {
  const code = normalizeBarcode(value);
  if (hasValidGtinCheckDigit(code)) {
    if (code.length === 8) return 'ean8';
    if (code.length === 12) return 'upc12';
    if (code.length === 13) return 'ean13';
    return 'gtin14';
  }
  return 'interno';
}

/**
 * Parece um código (para tentar a busca exata): de 3 a 48 caracteres, sem espaço depois de
 * normalizar, só letras, números e - _ . / (códigos internos como "CX-12" ou "000123").
 * Nomes com espaço ("coca lata") não passam. Precisa ter pelo menos um dígito.
 */
export function looksLikeBarcode(value: string): boolean {
  const raw = String(value ?? '').trim();
  if (/\s/.test(raw)) return false;
  return /^[A-Za-z0-9._/-]{3,48}$/.test(raw) && /\d/.test(raw);
}

/** Pode ir com segurança dentro de um filtro .or() do PostgREST (sem vírgula, ponto, parênteses...). */
export function isFilterSafeCode(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,48}$/.test(value);
}

/** Produto cujo código bate exatamente (depois de normalizar). */
export function findByBarcode<T extends { barcode?: string | null }>(products: T[], value: string): T | null {
  const code = normalizeBarcode(value);
  if (!code) return null;
  return products.find((p) => normalizeBarcode(p.barcode) === code) ?? null;
}

/**
 * Filtro .or() para buscar por nome (contém) OU código de barras (igual).
 * Devolve null quando o termo não é um código seguro: aí a tela usa só a busca por nome, como antes.
 */
export function nameOrBarcodeFilter(term: string, extraColumns: string[] = []): string | null {
  const t = term.trim();
  if (!t || !isFilterSafeCode(t)) return null;
  return [`name.ilike.%${t}%`, ...extraColumns.map((c) => `${c}.ilike.%${t}%`), `barcode.eq.${t}`].join(',');
}
