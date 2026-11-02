// Regras da entrada de mercadoria e do estoque (puras): parâmetros da função
// stock_add_entry, situação do estoque e mensagens de erro em português.

export interface StockEntryForm {
  productId: string | null;
  quantity: string;
  /** Custo unitário em reais; null = não informado (não mexe no custo do produto). */
  unitCost: number | null;
  supplier: string;
  invoiceNumber: string;
  notes: string;
}

export interface StockEntryArgs {
  p_product_id: string;
  p_quantity: number;
  p_unit_cost: number | null;
  p_supplier: string | null;
  p_invoice_number: string | null;
  p_notes: string | null;
}

const textOrNull = (v: string) => (v.trim() === '' ? null : v.trim());

/** Confere o formulário e monta os parâmetros da função do banco. Erro = texto para a tela. */
export function buildStockEntryArgs(form: StockEntryForm): { args: StockEntryArgs } | { error: string } {
  if (!form.productId) return { error: 'Escolha o produto' };
  const raw = form.quantity.trim();
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) return { error: 'Informe uma quantidade inteira maior que zero' };
  if (form.unitCost !== null && (!Number.isFinite(form.unitCost) || form.unitCost < 0)) {
    return { error: 'O custo não pode ser negativo' };
  }
  return {
    args: {
      p_product_id: form.productId,
      p_quantity: Number(raw),
      p_unit_cost: form.unitCost,
      p_supplier: textOrNull(form.supplier),
      p_invoice_number: textOrNull(form.invoiceNumber),
      p_notes: textOrNull(form.notes),
    },
  };
}

export type StockStatus = 'sem_estoque' | 'baixo' | 'ok';

export function stockStatus(quantity: number | null | undefined, alertThreshold: number | null | undefined): StockStatus {
  const q = Number(quantity) || 0;
  if (q <= 0) return 'sem_estoque';
  if (q <= (alertThreshold ?? 5)) return 'baixo';
  return 'ok';
}

interface DbError { code?: string; message?: string; details?: string }

/** Código de barras repetido na mesma loja (índice único products_store_barcode_key). */
export function isDuplicateBarcodeError(error: unknown): boolean {
  const e = (error ?? {}) as DbError;
  const text = `${e.message ?? ''} ${e.details ?? ''}`;
  return e.code === '23505' && (text.includes('products_store_barcode_key') || text.includes('barcode'));
}

export const DUPLICATE_BARCODE_MESSAGE = 'Este código de barras já está em outro produto';

/** Mensagem da função stock_add_entry (já vem em português) ou uma genérica. */
export function stockErrorMessage(error: unknown): string {
  const msg = ((error ?? {}) as DbError).message?.trim();
  if (msg && !/^(permission denied|new row violates|JWT|Failed to fetch)/i.test(msg)) return msg;
  if (msg && /permission denied|row-level security/i.test(msg)) return 'Sem permissão para esta loja';
  return 'Não foi possível registrar a entrada. Tente de novo.';
}

/**
 * Custo depois da entrada (mesma conta da função stock_add_entry): média ponderada quando já
 * havia estoque e custo; senão, o custo da entrada. Sem custo informado, o custo não muda.
 */
export function costAfterEntry(
  currentCost: number | null | undefined,
  stockBefore: number | null | undefined,
  quantity: number,
  unitCost: number | null,
): number | null {
  if (unitCost === null) return currentCost ?? null;
  const before = Number(stockBefore) || 0;
  if (currentCost !== null && currentCost !== undefined && before > 0) {
    return Math.round(((currentCost * before + unitCost * quantity) / (before + quantity)) * 10000) / 10000;
  }
  return Math.round(unitCost * 10000) / 10000;
}
