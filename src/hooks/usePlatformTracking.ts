import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  initializeFacebookPixel,
  initializeGoogleAds,
  initializeGoogleAnalytics,
} from "@/lib/advertisingScripts";

/**
 * Hook que busca os IDs de tracking da tabela platform_marketing_config
 * e injeta os scripts nas páginas públicas automaticamente.
 * Deve ser usado uma única vez no nível mais alto da aplicação.
 */
export function usePlatformTracking() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_marketing_config")
          .select("google_ads_id, facebook_pixel_id, google_analytics_id")
          .limit(1)
          .single();

        if (error || !data) return;

        if (data.google_ads_id) {
          initializeGoogleAds(data.google_ads_id);
        }
        if (data.facebook_pixel_id) {
          initializeFacebookPixel(data.facebook_pixel_id);
        }
        if (data.google_analytics_id) {
          initializeGoogleAnalytics(data.google_analytics_id);
        }
      } catch (err) {
        console.error("Erro ao carregar config de tracking:", err);
      }
    };

    loadConfig();
  }, []);
}
