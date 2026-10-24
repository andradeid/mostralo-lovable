import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setMostraloPixelId, trackMostraloPageView } from "@/lib/mostraloPixel";
import {
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
        // Pixel da Meta do Mostralo: só no site institucional (ver src/lib/mostraloPixel.ts)
        if (data.facebook_pixel_id) setMostraloPixelId(data.facebook_pixel_id);
        if (data.google_analytics_id) initializeGoogleAnalytics(data.google_analytics_id);
      } catch (err) {
        console.error("Erro ao carregar config de tracking:", err);
      }
    };

    loadConfig();
  }, [location.pathname]);

  // PageView do pixel do Mostralo a cada troca de página (só no site institucional)
  useEffect(() => {
    trackMostraloPageView(location.pathname);
  }, [location.pathname]);
}
