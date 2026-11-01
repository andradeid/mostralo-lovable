// Tela de WhatsApp da loja: junta os hooks (dados, conexão UaZapi/Evolution, ações e testes).
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { useToast } from "@/hooks/use-toast";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useStoreModules } from "@/hooks/useStoreModules";
import { useBotConfig } from "@/hooks/useBotConfig";
import { useNicheWizardDefaults } from "@/hooks/useNicheWizardDefaults";
import { getFriendlyLogErrorMessage } from "@/lib/whatsappInstance/messageLogs";
import { useWhatsAppInstanceData } from "./useWhatsAppInstanceData";
import { useWhatsAppConnectionState } from "./useWhatsAppConnectionState";
import { useUazapiConnection } from "./useUazapiConnection";
import { useEvolutionConnection } from "./useEvolutionConnection";
import { useWhatsAppConnectionActions } from "./useWhatsAppConnectionActions";
import { useWhatsAppTestTools } from "./useWhatsAppTestTools";

export function useWhatsAppInstancePage() {
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  
  // Verificar se módulo de IA está habilitado
  const { hasModule, loading: modulesLoading } = useStoreModules(storeId);
  const hasAIModule = hasModule('whatsapp_ai');
  
  // Hook para configuração do bot - só executa queries se módulo IA ativo
  const {
    config: botConfig,
    loading: botLoading,
    syncing: botSyncing,
    promptData,
    lastUpdated,
    hasUnsyncedChanges,
    hasOpenAIKey,
    promptSettings,
    productCount,
    updateConfig: updateBotConfig,
    updatePromptSettings,
    syncWithEvolution,
    refreshPrompt,
    setOptimizedPrompt,
  } = useBotConfig(storeId, hasAIModule);

  // Buscar defaults do nicho para o Wizard - só se módulo IA ativo
  const { data: nicheDefaults } = useNicheWizardDefaults(storeId, hasAIModule);

  const data = useWhatsAppInstanceData({ storeId });
  const conn = useWhatsAppConnectionState();
  const base = { storeId, toast, ...data, ...conn };
  const uazapi = useUazapiConnection(base);
  const evolution = useEvolutionConnection(base);
  const actions = useWhatsAppConnectionActions({ ...base, ...uazapi, ...evolution });
  const tests = useWhatsAppTestTools({ ...base, ...actions });

  return {
    toast, storeId, hasModule, modulesLoading, hasAIModule,
    botConfig, botLoading, botSyncing, promptData, lastUpdated, hasUnsyncedChanges, hasOpenAIKey, promptSettings, productCount,
    updateBotConfig, updatePromptSettings, syncWithEvolution, refreshPrompt, setOptimizedPrompt, nicheDefaults,
    getFriendlyLogErrorMessage,
    ...data, ...conn, ...uazapi, ...evolution, ...actions, ...tests,
  };
}

export type WhatsAppInstancePageCtx = ReturnType<typeof useWhatsAppInstancePage>;
