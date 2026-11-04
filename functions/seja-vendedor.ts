// Cloudflare Pages Function: /seja-vendedor (e /afiliado, /sejavendedor, /vendas, que redirecionam para cá).
// A página é SPA: sem isto, a prévia do link (WhatsApp, Facebook…) mostraria o título e a imagem da home.
// Troca título, descrição e imagem de compartilhamento no HTML que sai do servidor.
interface PagesContext { request: Request; next: () => Promise<Response> }

const URL_PAGE = 'https://mostralo.com.br/seja-vendedor';
const TITLE = 'Seja parceiro do Mostralo | Indique e receba todo mês';
const DESC = 'Indique o Mostralo para barbearias, salões, deliveries e outros negócios da sua cidade. Enquanto o cliente pagar, você recebe comissão todo mês por Pix.';
const IMAGE = 'https://mostralo.com.br/vendedor/og-seja-vendedor.jpg';

const META: Record<string, string> = {
  'og:url': URL_PAGE, 'og:title': TITLE, 'og:description': DESC, 'og:image': IMAGE,
  'twitter:url': URL_PAGE, 'twitter:title': TITLE, 'twitter:description': DESC, 'twitter:image': IMAGE,
  description: DESC,
};

class MetaRewriter {
  element(el: Element) {
    const key = el.getAttribute('property') || el.getAttribute('name') || '';
    if (key in META) el.setAttribute('content', META[key]);
  }
}
class TitleRewriter { element(el: Element) { el.setInnerContent(TITLE); } }
class CanonicalRewriter { element(el: Element) { el.setAttribute('href', URL_PAGE); } }

export async function onRequest(context: PagesContext): Promise<Response> {
  const res = await context.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  return new HTMLRewriter()
    .on('meta', new MetaRewriter())
    .on('title', new TitleRewriter())
    .on('link[rel="canonical"]', new CanonicalRewriter())
    .transform(res);
}
