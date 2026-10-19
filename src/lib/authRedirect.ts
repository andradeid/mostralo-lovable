/** Only allow same-origin application paths; reject protocol-relative redirects. */
export function getAuthReturnPath(state: unknown, search: string): string | null {
  const from = state && typeof state === 'object' && 'from' in state ? state.from : null;
  const candidates = [from, new URLSearchParams(search).get('redirect')];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//') || /[\\\u0000-\u0020]/.test(candidate)) continue;
    try {
      const base = 'https://mostralo.invalid';
      const url = new URL(candidate, base);
      if (url.origin !== base || url.pathname === '/auth' || url.pathname === '/auth/') continue;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      // Ignore invalid destinations and use the existing role-specific default.
    }
  }
  return null;
}