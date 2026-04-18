import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  initializeFacebookPixel,
  initializeGoogleAds,
  initializeGoogleAnalytics,
} from "@/lib/advertisingScripts";

/**
 * Hook que busca os IDs de tracking da tabela platform_marketing_config
 * e injeta os scripts nas páginas públicas automaticamente.
 *
 * IMPORTANTE: Só roda em rotas PÚBLICAS (não no /auth nem em painéis admin).
 * Isso evita carga inútil no banco e travamento do login quando o DB está degradado.
 */
const ADMIN_PREFIXES = [
  "/auth",
  "/reset-password",
  "/dashboard",
  "/admin",
  "/entregador",
  "/delivery-panel",
  "/vendedor",
  "/profissional",
  "/cliente",
  "/painel-cliente",
];

export function usePlatformTracking() {
  const initialized = useRef(false);
  const location = useLocation();

  useEffect(() => {
    if (initialized.current) return;

    // Não rodar em rotas administrativas / auth
    if (ADMIN_PREFIXES.some((p) => location.pathname.startsWith(p))) return;

    initialized.current = true;

    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_marketing_config")
          .select("google_ads_id, facebook_pixel_id, google_analytics_id")
          .limit(1)
          .maybeSingle();

        if (error || !data) return;

        if (data.google_ads_id) initializeGoogleAds(data.google_ads_id);
        if (data.facebook_pixel_id) initializeFacebookPixel(data.facebook_pixel_id);
        if (data.google_analytics_id) initializeGoogleAnalytics(data.google_analytics_id);
      } catch (err) {
        console.error("Erro ao carregar config de tracking:", err);
      }
    };

    loadConfig();
  }, [location.pathname]);
}
