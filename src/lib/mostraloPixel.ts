/**
 * Pixel da Meta do MOSTRALO (anúncios do próprio Mostralo).
 * - O ID vem de platform_marketing_config.facebook_pixel_id (Super Admin → Marketing).
 * - Só roda no site institucional do Mostralo (mostralo.com.br): páginas de venda, nichos,
 *   cadastro e checkout. NÃO roda nas páginas dos lojistas (loja, agendamento, mesa, totem,
 *   pedido, painel do cliente), nem em domínio próprio de lojista, nem nos painéis.
 * - Eventos: PageView, Contact (clique em link do WhatsApp), Lead (checkout iniciado),
 *   Purchase (assinatura paga), CompleteRegistration (cadastro pelo /signup).
 * Falhas nunca quebram a página.
 */

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };

declare global {
  interface Window { fbq?: Fbq; _fbq?: Fbq }
}

/** Rotas de lojista/cliente final e painéis: o pixel do Mostralo nunca roda aqui. */
const BLOCKED_PREFIXES = [
  "/loja/", "/agendar/", "/c/", "/p/", "/r/", "/avaliar/", "/meu-agendamento/", "/convite-profissional/",
  "/mesa/", "/totem/", "/assinaturas/", "/cliente/", "/painel-cliente", "/checkout", "/pedido/",
  "/painel/", "/invoice-payment/", "/receipt/", "/external-invoice/", "/external-receipt/", "/pagar/",
  "/auth", "/reset-password", "/dashboard", "/admin", "/entregador", "/delivery-", "/vendedor", "/profissional",
  "/cadastro-entregador", "/sitemap.xml", "/navegar",
];

let pixelId: string | null = null;
let started = false;

/** Domínio do próprio Mostralo (não domínio personalizado de lojista). */
export function isMostraloHost(host: string = typeof window !== "undefined" ? window.location.hostname : ""): boolean {
  const h = host.toLowerCase();
  return h === "mostralo.com.br" || h === "www.mostralo.com.br" || h === "localhost" || h === "127.0.0.1";
}

export function isMostraloMarketingPath(path: string): boolean {
  if (!path || path === "/") return true;
  return !BLOCKED_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p));
}

function allowed(path: string): boolean {
  return typeof window !== "undefined" && !!pixelId && isMostraloHost() && isMostraloMarketingPath(path);
}

function ensureLoaded() {
  if (started || !pixelId) return;
  started = true;
  try {
    if (!window.fbq) {
      const n = function (...args: unknown[]) {
        if (n.callMethod) n.callMethod(...args); else (n.queue as unknown[]).push(args);
      } as Fbq;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      window.fbq = n;
      window._fbq = n;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    window.fbq("init", pixelId);
    document.addEventListener("click", onDocumentClick, true);
  } catch { /* medição nunca pode quebrar a página */ }
}

function onDocumentClick(e: MouseEvent) {
  try {
    if (!allowed(window.location.pathname)) return;
    const a = (e.target as HTMLElement | null)?.closest?.("a") as HTMLAnchorElement | null;
    if (!a?.href) return;
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(a.href)) {
      window.fbq?.("track", "Contact", { content_name: "whatsapp", page: window.location.pathname });
    }
  } catch { /* ignora */ }
}

function track(event: string, params?: Record<string, unknown>) {
  if (!allowed(window.location.pathname)) return;
  ensureLoaded();
  try { window.fbq?.("track", event, params); } catch { /* ignora */ }
}

/** Define o ID (vindo do banco). Sem ID, nada é carregado. */
export function setMostraloPixelId(id: string | null | undefined) {
  const clean = (id || "").trim();
  pixelId = /^\d{10,20}$/.test(clean) ? clean : null;
}

export function trackMostraloPageView(path: string) {
  if (!allowed(path)) return;
  ensureLoaded();
  try { window.fbq?.("track", "PageView"); } catch { /* ignora */ }
}

/** Formulário do /assinar enviado (checkout iniciado). */
export function trackMostraloLead(params: { plan?: string; cycle?: string } = {}) {
  track("Lead", { content_name: params.plan, billing_cycle: params.cycle });
}

/** Assinatura paga (uma vez por checkout). */
export function trackMostraloPurchase(token: string, value: number, plan?: string) {
  try {
    const key = `mostralo_px_purchase_${token}`;
    if (window.sessionStorage.getItem(key) || window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch { /* sem armazenamento: segue */ }
  track("Purchase", { value: Number(value) || 0, currency: "BRL", content_name: plan });
}

/** Cadastro pelo /signup (fluxo antigo, por proposta). */
export function trackMostraloSignup() {
  track("CompleteRegistration", { content_name: "mostralo_signup", status: true });
}
