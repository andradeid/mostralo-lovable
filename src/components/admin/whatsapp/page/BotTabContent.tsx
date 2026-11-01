// Aba IA: aviso, assistente e cards do bot.
// JSX movido da WhatsAppInstancePage sem mudança.
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  BotActivationCard,
  BotBehaviorCard,
  BotSessionCard,
  BotTriggerCard,
  BotPromptPreviewCard,
  BotSyncFloatingAlert,
  BotTimezoneCard,
} from "@/components/admin/bot";
import { AssistantWizard } from "@/components/admin/bot/wizard/AssistantWizard";
import type { WizardData } from "@/components/admin/bot/wizard/types";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function BotTabContent({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { storeId, nicheDefaults, botConfig, botLoading, botSyncing, promptData, lastUpdated, hasUnsyncedChanges, hasOpenAIKey, promptSettings, updateBotConfig, updatePromptSettings, syncWithEvolution, refreshPrompt, setOptimizedPrompt, isConnected, loading, instance } = ctx;

  return (
    <>
      {(!instance || !isConnected) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium whitespace-normal">
                {!instance 
                  ? "Crie uma instância na aba 'Conexão' para ativar o assistente."
                  : "Conecte seu WhatsApp para que o assistente funcione."
                }
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 whitespace-normal">
                Configure agora e ative depois.
              </p>
            </div>
          </div>
        </div>
      )}

      {botLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : botConfig && (
          <>
            {/* Wizard de Criação de Assistente */}
            <AssistantWizard
              storeId={storeId}
              nicheName={nicheDefaults?.nicheName}
              initialData={{
                assistantType: (botConfig as any).assistant_type || 'custom',
                identity: {
                  name: (botConfig as any).assistant_identity?.name || botConfig.bot_name || 'Assistente Virtual',
                  nicheDescription: (botConfig as any).assistant_identity?.nicheDescription || '',
                  personality: (botConfig as any).assistant_identity?.personality || promptSettings.personalitySettings.personality || 'friendly',
                  emojiLevel: (botConfig as any).assistant_identity?.emojiLevel || promptSettings.personalitySettings.emojiLevel || 'moderate',
                  greeting: (botConfig as any).assistant_identity?.greeting || promptSettings.personalitySettings.customGreeting || '',
                },
                enabledTools: (botConfig as any).enabled_tools || nicheDefaults?.enabledTools || ['search_products', 'check_stock', 'get_product_details', 'list_categories', 'get_promotions', 'check_store_status', 'get_store_info'],
                rules: (botConfig as any).enabled_rules || {},
                storeInfo: {
                  includeLocation: promptSettings.includeLocation,
                  includeBusinessHours: promptSettings.includeBusinessHours,
                  includePaymentMethods: promptSettings.includePaymentMethods,
                  includeDeliveryFee: promptSettings.includeDeliveryFee,
                  includeMinOrder: promptSettings.includeMinOrder,
                },
                customInstructions: (botConfig as any).wizard_custom_instructions || '',
                upsellProducts: (botConfig as any).upsell_products || [],
              }}
              onComplete={async (wizardData: WizardData) => {
                const botModeMap: Record<string, string> = {
                  triage: 'conversational_simple',
                  sales: 'conversational',
                  support: 'assistant',
                  custom: 'assistant',
                };
                const resolvedBotMode = botModeMap[wizardData.assistantType] || 'assistant';

                const updates: Partial<typeof botConfig> = {
                  bot_name: wizardData.identity.name,
                  bot_mode: resolvedBotMode as any,
                  custom_prompt_instructions: wizardData.customInstructions,
                };

                if (botConfig.id) {
                  const { supabase } = await import("@/integrations/supabase/client");
                  await (supabase as any)
                    .from('store_bot_config')
                    .update({
                      assistant_type: wizardData.assistantType,
                      enabled_tools: wizardData.enabledTools,
                      enabled_rules: wizardData.rules,
                      assistant_identity: wizardData.identity,
                      bot_name: wizardData.identity.name,
                      bot_mode: resolvedBotMode,
                      wizard_custom_instructions: wizardData.customInstructions,
                      personality: wizardData.identity.personality,
                      emoji_level: wizardData.identity.emojiLevel,
                      custom_greeting: wizardData.identity.greeting,
                      include_location: wizardData.storeInfo.includeLocation,
                      include_business_hours: wizardData.storeInfo.includeBusinessHours,
                      include_payment_methods: wizardData.storeInfo.includePaymentMethods,
                      include_delivery_fee: wizardData.storeInfo.includeDeliveryFee,
                      include_min_order: wizardData.storeInfo.includeMinOrder,
                      upsell_products: wizardData.upsellProducts || [],
                      needs_sync: true,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', botConfig.id);
                }

                updateBotConfig(updates);
                updatePromptSettings({
                  includeLocation: wizardData.storeInfo.includeLocation,
                  includeBusinessHours: wizardData.storeInfo.includeBusinessHours,
                  includePaymentMethods: wizardData.storeInfo.includePaymentMethods,
                  includeDeliveryFee: wizardData.storeInfo.includeDeliveryFee,
                  includeMinOrder: wizardData.storeInfo.includeMinOrder,
                  personalitySettings: {
                    personality: wizardData.identity.personality,
                    emojiLevel: wizardData.identity.emojiLevel,
                    customGreeting: wizardData.identity.greeting,
                  },
                });

                await syncWithEvolution('update');
              }}
              saving={botSyncing}
              promptPreview={promptData?.prompt || null}
              onPromptOptimized={setOptimizedPrompt}
            />

            <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
              <div className="space-y-3 sm:space-y-6 min-w-0">
                <BotActivationCard
                  config={botConfig}
                  syncing={botSyncing}
                  isConnected={isConnected}
                  hasUnsyncedChanges={hasUnsyncedChanges}
                  hasOpenAIKey={hasOpenAIKey}
                  storeId={storeId}
                  onUpdate={updateBotConfig}
                  onSync={syncWithEvolution}
                />
                <BotTriggerCard
                  config={botConfig}
                  onUpdate={updateBotConfig}
                  disabled={!isConnected}
                />
                <BotTimezoneCard
                  storeId={storeId}
                  disabled={!isConnected}
                />
              </div>
              <div className="space-y-3 sm:space-y-6 min-w-0">
                <BotBehaviorCard
                  config={botConfig}
                  onUpdate={updateBotConfig}
                  disabled={!isConnected}
                />
                <BotSessionCard
                  config={botConfig}
                  onUpdate={updateBotConfig}
                  disabled={!isConnected}
                />
              </div>
            </div>

            <BotPromptPreviewCard
              promptData={promptData}
              lastUpdated={lastUpdated}
              onRefresh={refreshPrompt}
              loading={botLoading}
              hasUnsyncedChanges={hasUnsyncedChanges}
              onSync={() => syncWithEvolution('update')}
              syncing={botSyncing}
              storeId={storeId}
              onPromptOptimized={setOptimizedPrompt}
            />
            
            <BotSyncFloatingAlert
              visible={hasUnsyncedChanges && botConfig.enabled}
              onSync={() => syncWithEvolution('update')}
              syncing={botSyncing}
            />
          </>
        )}
    </>
  );
}
