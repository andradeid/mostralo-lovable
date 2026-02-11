import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Gera um session_id único por sessão do browser
function getSessionId(): string {
  const key = "mostralo_session_id";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

// Extrai parâmetros UTM da URL
function getUtmParams(search: string) {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
  };
}

// Detecta store_id a partir da URL (ex: /loja/slug -> buscar depois, ou extrair de contexto)
function extractStoreSlug(pathname: string): string | null {
  const match = pathname.match(/^\/loja\/([^/]+)/);
  return match ? match[1] : null;
}

const TRACK_URL = "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/track-visit";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA";

// Rotas do dashboard/admin que NÃO devem ser rastreadas
const ADMIN_PREFIXES = ["/dashboard", "/admin", "/entregador", "/vendedor", "/profissional", "/cliente"];

export function useTrackPageVisit() {
  const location = useLocation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    const fullPath = location.pathname + location.search;

    // Não rastrear rotas admin
    if (ADMIN_PREFIXES.some((p) => location.pathname.startsWith(p))) return;

    // Evitar duplicata na mesma navegação
    if (lastTracked.current === fullPath) return;
    lastTracked.current = fullPath;

    const utms = getUtmParams(location.search);

    const payload = {
      page_url: location.pathname,
      session_id: getSessionId(),
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      ...utms,
    };

    // Fire-and-forget
    fetch(TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silenciosamente ignora erros de tracking
    });
  }, [location.pathname, location.search]);
}
