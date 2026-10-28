// O mesmo pedido pode ser mandado para impressão por dois caminhos ao aceitar (aceite + "imprimir ao aceitar").
const recent = new Map<string, number>();
export const DEDUPE_MS = 20_000;

/** true quando o mesmo pedido já foi mandado há menos de 20 s. */
export function isDuplicatePrint(orderId: string, now = Date.now(), seen = recent): boolean {
  const last = seen.get(orderId);
  if (last !== undefined && now - last < DEDUPE_MS) return true;
  seen.set(orderId, now);
  return false;
}

export function forgetPrint(orderId: string, seen = recent) { seen.delete(orderId); }
