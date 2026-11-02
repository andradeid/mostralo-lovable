// Dados fiscais do produto (tabela product_fiscal): formulário ↔ linha e validação. Regras puras (testadas).
// Campo vazio = usa o padrão da configuração fiscal da loja.
import { onlyDigits } from '../../../supabase/functions/_shared/fiscal-doc.ts';

export interface ProductFiscalForm {
  ncm: string;
  cfop: string;
  cest: string;
  icms_origem: string; // '' = padrão da loja
  icms_situacao: string;
  pis_cst: string;
  cofins_cst: string;
  unidade: string;
}

export interface ProductFiscalRow {
  ncm: string | null;
  cfop: string | null;
  cest: string | null;
  icms_origem: number | null;
  icms_situacao: string | null;
  pis_cst: string | null;
  cofins_cst: string | null;
  unidade: string | null;
}

export const emptyProductFiscal = (): ProductFiscalForm => ({
  ncm: '', cfop: '', cest: '', icms_origem: '', icms_situacao: '', pis_cst: '', cofins_cst: '', unidade: '',
});

export function productFiscalFromRow(row: Partial<ProductFiscalRow> | null | undefined): ProductFiscalForm {
  if (!row) return emptyProductFiscal();
  return {
    ncm: row.ncm ?? '',
    cfop: row.cfop ?? '',
    cest: row.cest ?? '',
    icms_origem: row.icms_origem === null || row.icms_origem === undefined ? '' : String(row.icms_origem),
    icms_situacao: row.icms_situacao ?? '',
    pis_cst: row.pis_cst ?? '',
    cofins_cst: row.cofins_cst ?? '',
    unidade: row.unidade ?? '',
  };
}

export type ProductFiscalErrors = Partial<Record<keyof ProductFiscalForm, string>>;

export function validateProductFiscal(f: ProductFiscalForm): ProductFiscalErrors {
  const e: ProductFiscalErrors = {};
  if (f.ncm.trim() && onlyDigits(f.ncm).length !== 8) e.ncm = 'NCM tem 8 dígitos';
  if (f.cfop.trim() && !/^[56]\d{3}$/.test(onlyDigits(f.cfop))) e.cfop = 'CFOP de saída com 4 dígitos (ex.: 5102, 5405)';
  if (f.cest.trim() && onlyDigits(f.cest).length !== 7) e.cest = 'CEST tem 7 dígitos';
  if (f.unidade.trim().length > 6) e.unidade = 'Até 6 letras (ex.: UN, KG, LT)';
  return e;
}

export function productFiscalToRow(f: ProductFiscalForm): ProductFiscalRow {
  const digits = (v: string) => (onlyDigits(v) === '' ? null : onlyDigits(v));
  const text = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    ncm: digits(f.ncm),
    cfop: digits(f.cfop),
    cest: digits(f.cest),
    icms_origem: f.icms_origem === '' ? null : Number(f.icms_origem),
    icms_situacao: text(f.icms_situacao),
    pis_cst: text(f.pis_cst),
    cofins_cst: text(f.cofins_cst),
    unidade: text(f.unidade)?.toUpperCase() ?? null,
  };
}

export const isProductFiscalEmpty = (row: ProductFiscalRow) => Object.values(row).every((v) => v === null);

export const sameProductFiscal = (a: ProductFiscalRow, b: ProductFiscalRow) =>
  (Object.keys(a) as (keyof ProductFiscalRow)[]).every((k) => a[k] === b[k]);
