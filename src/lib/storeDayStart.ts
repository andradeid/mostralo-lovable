/** Convert midnight of the store's current calendar day to an absolute UTC instant. */
export function storeDayStart(timeZone: string, now = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const parts = (date: Date) => {
    const values = formatter.formatToParts(date);
    const value = (key: string) => Number(values.find(part => part.type === key)?.value || 0);
    return Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
  };
  const localNow = parts(now);
  const local = new Date(localNow);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  let instant = midnight;
  for (let i = 0; i < 4; i++) instant += midnight - parts(new Date(instant));
  return new Date(instant).toISOString();
}