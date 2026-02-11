// Utilitário fire-and-forget para rastrear cliques em botões importantes
const TRACK_URL = "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/track-visit";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA";

function getSessionId(): string {
  const key = "mostralo_session_id";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
  };
}

/**
 * Rastreia um clique em botão importante.
 * Fire-and-forget: não bloqueia a ação do botão.
 * 
 * @param eventType - Tipo do evento (ex: "click_whatsapp", "click_cta_signup")
 * @param eventLabel - Detalhes extras (ex: "botao-flutuante", "hero-section")
 */
export function trackClick(eventType: string, eventLabel?: string): void {
  const payload = {
    page_url: window.location.pathname,
    session_id: getSessionId(),
    referrer: document.referrer || undefined,
    user_agent: navigator.userAgent,
    event_type: eventType,
    event_label: eventLabel,
    ...getUtmParams(),
  };

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
}
