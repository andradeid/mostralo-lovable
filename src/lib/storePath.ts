/**
 * Helpers de domínio personalizado da vitrine.
 * Em domínio próprio da loja, os caminhos não levam o prefixo /loja/:slug.
 */
export const INTERNAL_DOMAINS = [
  'localhost', '127.0.0.1', 'mostralo.me', 'mostralo.app', 'mostralo.com.br',
  'lovable.app', 'pages.dev', 'lovable.dev', 'lovableproject.com', 'gptengineer.run',
  'webcontainer.io', 'stackblitz.io', 'codesandbox.io',
];

/** true quando o host atual NÃO é um domínio interno do Mostralo */
export function isCustomDomainHost(hostname: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost'): boolean {
  return !INTERNAL_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

/** Monta o caminho de uma página da loja conforme o domínio atual. */
export function storePath(slug: string | null | undefined, subpath: string = ''): string {
  const sub = subpath && !subpath.startsWith('/') && !subpath.startsWith('?') ? `/${subpath}` : subpath;
  if (isCustomDomainHost()) {
    if (!sub) return '/';
    return sub.startsWith('?') ? `/${sub}` : sub;
  }
  return `/loja/${slug ?? ''}${sub}`;
}
