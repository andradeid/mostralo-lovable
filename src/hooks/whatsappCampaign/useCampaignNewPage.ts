// Tela Nova Campanha: junta os hooks (estado, carregamento, mídia, mensagem, público e envio).
// Código movido da WhatsAppCampaignNewPage sem mudança de comportamento.
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useCampaignState } from "./useCampaignState";
import { useCampaignLoaders } from "./useCampaignLoaders";
import { useCampaignMedia } from "./useCampaignMedia";
import { useCampaignMessageTools } from "./useCampaignMessageTools";
import { useCampaignAudience } from "./useCampaignAudience";
import { useCampaignSubmit } from "./useCampaignSubmit";

export function useCampaignNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const ctx0 = { navigate, toast, storeId };
  const h0 = useCampaignState();
  const ctx1 = { ...ctx0, ...h0 };
  const h1 = useCampaignLoaders(ctx1);
  const ctx2 = { ...ctx1, ...h1 };
  const h2 = useCampaignMedia(ctx2);
  const ctx3 = { ...ctx2, ...h2 };
  const h3 = useCampaignMessageTools(ctx3);
  const ctx4 = { ...ctx3, ...h3 };
  const h4 = useCampaignAudience(ctx4);
  const ctx5 = { ...ctx4, ...h4 };
  const h5 = useCampaignSubmit(ctx5);
  const ctx6 = { ...ctx5, ...h5 };
  return ctx6;
}

export type CampaignNewPageCtx = ReturnType<typeof useCampaignNewPage>;
