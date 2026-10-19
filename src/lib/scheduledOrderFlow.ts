/** Confirmed advance orders belong to scheduled management, never the daily board. */
export function belongsToDailyKanban(status: string): boolean {
  return status !== 'confirmado';
}

export function scheduledCountdown(at: string, now: number) {
  const delta = new Date(at).getTime() - now;
  const remaining = Math.ceil(Math.abs(delta) / 60000);
  const duration = remaining >= 60 ? `${Math.floor(remaining / 60)}h${String(remaining % 60).padStart(2, '0')}` : `${remaining}min`;
  return {
    elapsedTime: delta >= 0 ? `faltam ${duration}` : `atrasado ${duration}`,
    color: delta < 0 ? 'red' as const : 'green' as const,
    minutes: Math.ceil(delta / 60000),
  };
}