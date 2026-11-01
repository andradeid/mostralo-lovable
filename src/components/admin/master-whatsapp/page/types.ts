import type { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import type { MasterWhatsAppInstanceApi } from "@/hooks/masterWhatsapp/useMasterWhatsAppInstance";
import type { MasterWhatsAppTestsApi } from "@/hooks/masterWhatsapp/useMasterWhatsAppTests";

/** O que cada bloco da tela recebe: instância, testes e a configuração do WhatsApp Master. */
export interface MasterWhatsAppPageApi {
  wa: MasterWhatsAppInstanceApi;
  tests: MasterWhatsAppTestsApi;
  cfg: Omit<ReturnType<typeof useMasterWhatsAppConfig>, "sessions" | "toggleSessionPause">;
}
