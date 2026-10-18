/** Masters keep their global view; everyone else must have a validated store. */
export function activeStoreScope(
  isMasterAdmin: boolean,
  storeId: string | null,
): { kind: 'all' } | { kind: 'store'; storeId: string } | { kind: 'waiting' } {
  if (isMasterAdmin) return { kind: 'all' };
  if (!storeId) return { kind: 'waiting' };
  return { kind: 'store', storeId };
}