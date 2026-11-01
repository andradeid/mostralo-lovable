// Erro amigável do histórico e dias sem pedir (funções puras).
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import type { MessageLog } from "./types";

export function getFriendlyLogErrorMessage(log: MessageLog): string | null {
  if (!log.error_message) return null;

  // error_message normalmente vem como JSON.stringify(sendData) do Evolution
  try {
    const parsed = JSON.parse(log.error_message);
    const msgs = parsed?.response?.message;

    if (Array.isArray(msgs) && msgs.some((m: any) => m?.exists === false)) {
      return `O número ${log.phone_number} não possui WhatsApp ativo. Verifique se está correto e inclui o 9º dígito (ex: DDD + 9XXXX-XXXX).`;
    }
  } catch {
    // Se não for JSON, manter mensagem original
  }

  return log.error_message;
}

export function calculateDaysInactive(lastOrderAt: string | null): string {
  if (!lastOrderAt) return '—';
  const lastOrder = new Date(lastOrderAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays.toString();
}
