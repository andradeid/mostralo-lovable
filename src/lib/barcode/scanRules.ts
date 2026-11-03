// O que fazer com o produto lido (regras puras): pode entrar na venda? quem pode cadastrar
// um código novo? textos dos avisos.

export interface ScanProductInfo {
  name: string;
  is_available: boolean;
  track_stock: boolean | null;
  stock_quantity: number | null;
}

export type ScanCheck = { ok: true; warning?: string } | { ok: false; message: string };

/**
 * Mesma regra do PDV: produto indisponível não entra (a grade só mostra os disponíveis).
 * Estoque controlado zerado com o produto ainda disponível entra, com aviso.
 * `requireAvailable: false` (entrada de mercadoria) aceita qualquer produto da loja.
 */
export function checkScannedProduct(p: ScanProductInfo, { requireAvailable = true } = {}): ScanCheck {
  if (!requireAvailable) return { ok: true };
  if (p.is_available === false) return { ok: false, message: `${p.name} está indisponível` };
  if (p.track_stock && (Number(p.stock_quantity) || 0) <= 0) return { ok: true, warning: `${p.name}: estoque zerado` };
  return { ok: true };
}

/** Só dono/admin da loja (e o master) cadastram produto; atendente vê o aviso sem o botão. */
export function canManageProducts(role: string | null | undefined): boolean {
  return role === 'store_admin' || role === 'master_admin';
}

export const scanAddedMessage = (name: string) => `Adicionado: ${name}`;
export const notFoundMessage = (code: string) => `Código ${code} não cadastrado`;
