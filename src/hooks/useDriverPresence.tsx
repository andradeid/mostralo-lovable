/**
 * useDriverPresence — DESATIVADO (Março/2026)
 * 
 * Motivo: O canal Realtime 'delivery-presence' e o setInterval de 30s
 * estavam consumindo recursos no painel do lojista mesmo sem entregadores ativos.
 * 
 * Impacto: Badges de online/offline sempre mostrarão "offline".
 * Quando o módulo de entregadores for reativado com notificações via WhatsApp,
 * este hook pode ser removido por completo.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useDriverPresence = (_driverId: string | null) => {
  return false;
};
