// Domínio próprio da loja: textos e modelo de configuração. Puro; testado em customDomain.test.ts.
//
// Dois modelos:
//  - "cname": o lojista cria CNAME www → lojas.mostralo.com.br no registrador. Só o www abre.
//  - "managed": a equipe Mostralo põe o domínio inteiro na Cloudflare do Mostralo e liga
//    raiz e www ao projeto (ex.: uninkimpressoras.com.br). Abre com e sem www.
//    Na loja fica gravado o domínio SEM www e marcado como verificado.

export const CNAME_TARGET = 'lojas.mostralo.com.br';
export const DOMAIN_SUPPORT_WHATSAPP = '5561994009368';

const clean = (d: string | null | undefined) =>
  (d ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');

/** Domínio sem o "www." (ex.: www.loja.com.br → loja.com.br). */
export function rootOf(domain: string | null | undefined): string {
  return clean(domain).replace(/^www\./, '');
}

/** Configurado pela equipe (domínio inteiro na Cloudflare do Mostralo): verificado e gravado sem www. */
export function isManagedDomain(domain: string | null | undefined, verified: boolean): boolean {
  const d = clean(domain);
  return verified && d.length > 0 && !d.startsWith('www.');
}

/** Link do WhatsApp para pedir à equipe que deixe o domínio abrir também sem www. */
export function domainHelpLink(domain: string | null | undefined): string {
  const root = rootOf(domain);
  const text = root
    ? `Olá! Quero que minha loja abra também em ${root} (sem www). Podem configurar para mim?`
    : 'Olá! Quero ajuda para ligar meu domínio à minha loja no Mostralo.';
  return `https://wa.me/${DOMAIN_SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
