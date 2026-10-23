/**
 * Registro de erros no navegador de quem usa o Mostralo (visitantes, lojistas, master).
 * Grava em public.client_error_logs (só inserção; leitura só para o master).
 * - Sem dependência do cliente Supabase: usa fetch direto, para funcionar mesmo se o app quebrar no início.
 * - Ignora ruído (extensões do navegador, "Script error." sem detalhe, ResizeObserver).
 * - No máximo 10 registros por visita e sem repetir o mesmo erro na mesma página.
 */

const SUPABASE_URL = "https://noshwvwpjtnvndokbfjx.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA";

type Kind = "error" | "unhandledrejection" | "react" | "chunk" | "manual";

const MAX_PER_VISIT = 10;
const sent = new Set<string>();
let count = 0;
let installed = false;

const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /chrome-extension:|moz-extension:|safari-extension:/i,
  /Non-Error promise rejection captured/i,
  /AbortError|The user aborted a request/i,
];

function cut(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

function visitorId(): string | null {
  try {
    const k = "mostralo_vid";
    let id = localStorage.getItem(k);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return null;
  }
}

function currentUserId(): string | null {
  try {
    const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!key) return null;
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Loja da página: /loja/:slug, /agendar/:slug ou (domínio próprio) o slug guardado pelo app. */
function storeSlug(): string | null {
  const m = window.location.pathname.match(/^\/(?:loja|agendar)\/([^/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  try {
    const raw = sessionStorage.getItem("mostralo_custom_domain_slug");
    const slug = raw ? (JSON.parse(raw) as { slug?: string }).slug : null;
    return slug ?? null;
  } catch {
    return null;
  }
}

/** Versão publicada = hash do arquivo principal do app (muda a cada deploy). */
function appVersion(): string | null {
  const src = (document.querySelector('script[type="module"][src*="/assets/"]') as HTMLScriptElement | null)?.src;
  const m = src?.match(/\/assets\/[^/]*?-([A-Za-z0-9_-]{6,})\.js/);
  return m ? m[1] : null;
}

export function reportClientError(kind: Kind, error: unknown, extra?: string) {
  try {
    if (count >= MAX_PER_VISIT) return;
    const err = error as { message?: unknown; stack?: unknown; reason?: unknown } | null;
    let message = typeof error === "string" ? error : String(err?.message ?? err ?? "Erro desconhecido");
    if (extra) message = `${message} · ${extra}`;
    const stack = typeof err?.stack === "string" ? err.stack : null;
    if (NOISE.some((r) => r.test(message) || (stack ? r.test(stack) : false))) return;

    const path = window.location.pathname;
    const key = `${kind}|${message.slice(0, 200)}|${path}`;
    if (sent.has(key)) return;
    sent.add(key);
    count++;

    const body = {
      kind,
      message: cut(message, 1000),
      stack: cut(stack, 4000),
      path: cut(path + window.location.search, 500),
      store_slug: cut(storeSlug(), 120),
      host: cut(window.location.host, 200),
      user_agent: cut(navigator.userAgent, 400),
      app_version: cut(appVersion(), 60),
      user_id: currentUserId(),
      visitor_id: cut(visitorId(), 64),
    };
    void fetch(`${SUPABASE_URL}/rest/v1/client_error_logs`, {
      method: "POST",
      keepalive: true,
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      // user_id é só informativo (o envio usa a chave pública, sem a sessão do usuário)
      body: JSON.stringify({ ...body, message: body.message ?? "Erro desconhecido" }),
    }).catch(() => { /* sem rede: ignora */ });
  } catch {
    /* o registro de erro nunca pode quebrar a página */
  }
}

export function installErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    // Erro de carregamento de recurso (imagem, script) não tem e.error; registra só scripts do próprio app
    if (!e.error && e.target && e.target !== window) {
      const t = e.target as HTMLElement & { src?: string };
      if (t.tagName === "SCRIPT" && t.src?.includes("/assets/")) reportClientError("chunk", `Falha ao carregar ${t.src}`);
      return;
    }
    reportClientError("error", e.error ?? e.message);
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    reportClientError("unhandledrejection", (e as PromiseRejectionEvent).reason);
  });

  // Vite: parte do app (rota) não carregou — típico de versão antiga guardada depois de um deploy
  window.addEventListener("vite:preloadError", (e) => {
    reportClientError("chunk", (e as Event & { payload?: unknown }).payload ?? "Falha ao carregar parte do app");
  });
}
