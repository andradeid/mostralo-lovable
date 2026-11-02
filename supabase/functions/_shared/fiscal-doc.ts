// Módulo fiscal: regras puras de documentos (CPF, CNPJ, GTIN), números e datas.
// Sem dependências: usado pelas edge functions (Deno) e pelo painel (src/lib/fiscal).

export const onlyDigits = (v: unknown): string => String(v ?? "").replace(/\D/g, "");

export function isValidCpf(value: unknown): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function isValidCnpj(value: unknown): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** 'cpf' | 'cnpj' quando válido; 'empty' sem nada digitado; 'invalid' nos outros casos. */
export function classifyDocument(value: unknown): "cpf" | "cnpj" | "empty" | "invalid" {
  const d = onlyDigits(value);
  if (!d) return "empty";
  if (d.length === 11) return isValidCpf(d) ? "cpf" : "invalid";
  if (d.length === 14) return isValidCnpj(d) ? "cnpj" : "invalid";
  return "invalid";
}

export function formatCpfCnpj(value: unknown): string {
  const d = onlyDigits(value);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d;
}

/** GTIN (EAN-8, UPC-12, EAN-13, GTIN-14) com dígito verificador certo. Código interno não é GTIN. */
export function isValidGtin(value: unknown): boolean {
  const d = onlyDigits(value);
  if (![8, 12, 13, 14].includes(d.length) || String(value ?? "").trim() !== d) return false;
  // Prefixos 2xx (uso interno/peso variável) não são GTIN válidos para a nota
  const padded = d.padStart(14, "0");
  if (padded.slice(1, 2) === "2" && d.length === 13) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(padded[i]) * (i % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === Number(padded[13]);
}

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB",
  "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
export const isValidUf = (uf: unknown) => (UFS as readonly string[]).includes(String(uf ?? "").toUpperCase());

// ── Números no formato da Focus (string com ponto decimal) ──
const round = (n: number, dec: number) => {
  const f = 10 ** dec;
  return Math.round((n + Number.EPSILON) * f) / f;
};
export const round2 = (n: number) => round(n, 2);
export const money = (n: number) => round2(n).toFixed(2);
/** Até `maxDec` casas, sem zeros sobrando (mínimo `minDec`). */
export function decimal(n: number, maxDec: number, minDec = 0): string {
  let s = round(n, maxDec).toFixed(maxDec);
  if (maxDec > 0) s = s.replace(/0+$/, "");
  if (s.endsWith(".")) s = s.slice(0, -1);
  const [, dec = ""] = s.split(".");
  if (dec.length < minDec) s = round(n, maxDec).toFixed(minDec);
  return s;
}

/** Divide um valor em centavos proporcional aos pesos; o último leva a sobra (soma exata). */
export function allocate(total: number, weights: number[]): number[] {
  const cents = Math.round(round2(total) * 100);
  const sum = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (!weights.length) return [];
  if (cents === 0 || sum <= 0) return weights.map(() => 0);
  const out: number[] = [];
  let used = 0;
  weights.forEach((w, i) => {
    if (i === weights.length - 1) out.push((cents - used) / 100);
    else {
      const c = Math.floor((cents * Math.max(0, w)) / sum);
      used += c;
      out.push(c / 100);
    }
  });
  return out;
}

/** Data/hora ISO com o fuso da loja (a Focus exige fuso e no máximo 5 min de diferença). */
export function isoWithOffset(date: Date, timeZone = "America/Sao_Paulo"): string {
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date)) parts[p.type] = p.value;
  const localMs = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offsetMin = Math.round((localMs - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const sign = offsetMin < 0 ? "-" : "+";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${hh}:${mm}`;
}
