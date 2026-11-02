// Aviso "venda fechada" do PDV para o cupom fiscal: o PDV só chama notifyFiscalSaleClosed(id)
// e o PDVFiscalAfterSale (montado na página) oferece emitir. Sem estado global além dos ouvintes.
type Listener = (comandaId: string) => void;
const listeners = new Set<Listener>();

export function notifyFiscalSaleClosed(comandaId: string | null | undefined) {
  if (!comandaId) return;
  for (const l of [...listeners]) l(comandaId);
}

export function onFiscalSaleClosed(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
