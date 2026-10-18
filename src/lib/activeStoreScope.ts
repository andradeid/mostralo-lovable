/** Masters keep their global view; everyone else must have a validated store. */
export function scopeToActiveStore<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  isMasterAdmin: boolean,
  storeId: string | null,
): T | null {
  if (isMasterAdmin) return query;
  if (!storeId) return null;
  return query.eq('store_id', storeId);
}