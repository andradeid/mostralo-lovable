import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, Smartphone } from "lucide-react";
import { MasterBotConfigTab } from "@/components/admin/master-whatsapp/MasterBotConfigTab";
import { MasterSessionsTab } from "@/components/admin/master-whatsapp/MasterSessionsTab";
import { MasterNotificationsCard } from "@/components/admin/master-whatsapp/MasterNotificationsCard";
import { WhatsAppLinkConfigCard } from "@/components/admin/master-whatsapp/WhatsAppLinkConfigCard";
import { MasterFaqTab } from "@/components/admin/master-whatsapp/MasterFaqTab";

import { OpenAIConfigCard } from "@/components/shared/OpenAIConfigCard";
import { useMasterWhatsAppInstance } from "@/hooks/masterWhatsapp/useMasterWhatsAppInstance";
import { useMasterWhatsAppTests } from "@/hooks/masterWhatsapp/useMasterWhatsAppTests";
import { InstanceStatusBadge } from "@/components/admin/master-whatsapp/page/InstanceStatusBadge";
import { MasterWhatsAppTabsList } from "@/components/admin/master-whatsapp/page/MasterWhatsAppTabsList";
import { InstanceCreateForm } from "@/components/admin/master-whatsapp/page/InstanceCreateForm";
import { InstanceStatusBanner } from "@/components/admin/master-whatsapp/page/InstanceStatusBanner";
import { InstanceInfoSection } from "@/components/admin/master-whatsapp/page/InstanceInfoSection";
import { InstanceWebhookInfo } from "@/components/admin/master-whatsapp/page/InstanceWebhookInfo";
import { InstanceBotsAndStats } from "@/components/admin/master-whatsapp/page/InstanceBotsAndStats";
import { InstanceActions } from "@/components/admin/master-whatsapp/page/InstanceActions";
import { ConnectWhatsAppCard } from "@/components/admin/master-whatsapp/page/ConnectWhatsAppCard";
import { TestSendCard } from "@/components/admin/master-whatsapp/page/TestSendCard";
import { TestHistoryCard } from "@/components/admin/master-whatsapp/page/TestHistoryCard";
import { BotsInfoCards } from "@/components/admin/master-whatsapp/page/BotsInfoCards";
import { MasterAssistantCard } from "@/components/admin/master-whatsapp/page/MasterAssistantCard";
import { DeleteAssistantDialog } from "@/components/admin/master-whatsapp/page/DeleteAssistantDialog";

// Tela WhatsApp Master: só orquestra. Lógica em hooks/masterWhatsapp e blocos em components/admin/master-whatsapp/page.

export default function MasterWhatsAppPage() {
  const { 
    config, 
    loading, 
    updateConfig, 
    syncBots, 
    syncing,
    syncError,
    clearSyncError,
    toggleBot,
    updateApproach,
    updateKeywords,
    updateSupportPrompt,
    updateBotBehavior,
    updatePrimaryBotType,
    updateOpenAIModel,
    updateTriggerConfig,
    hasUnsyncedChanges,
    lastSyncedAt
  } = useMasterWhatsAppConfig();
  const isMobile = useIsMobile();
  const wa = useMasterWhatsAppInstance(config);
  const tests = useMasterWhatsAppTests(config, wa.setLoadingAction);
  const cfg = { config, loading, updateConfig, syncBots, syncing, syncError, clearSyncError, toggleBot, updateApproach, updateKeywords,
    updateSupportPrompt, updateBotBehavior, updatePrimaryBotType, updateOpenAIModel, updateTriggerConfig, hasUnsyncedChanges, lastSyncedAt };
  const api = { wa, tests, cfg };
  const { instanceStatus, fetchWebhookStatus } = wa;

  // Buscar status do webhook quando instância estiver conectada
  useEffect(() => {
    if (config?.instance_name && (instanceStatus === 'connected' || instanceStatus === 'open')) {
      fetchWebhookStatus();
    }
  }, [config?.instance_name, instanceStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">WhatsApp Master</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie bots de vendas, recrutamento e suporte
          </p>
        </div>
        <InstanceStatusBadge instanceStatus={instanceStatus} />
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <MasterWhatsAppTabsList {...api} />

        {/* Tab Conexão */}
        <TabsContent value="connection">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Criar/Gerenciar Instância - Card Redesenhado */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Instância WhatsApp
                </CardTitle>
                <CardDescription>
                  Configure a conexão do WhatsApp Master
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!config?.instance_name ? (
                  <InstanceCreateForm {...api} />
                ) : (
                  <div className="space-y-4">
                    <InstanceStatusBanner {...api} />

                    <InstanceInfoSection {...api} />

                    <InstanceWebhookInfo {...api} />

                    <InstanceBotsAndStats {...api} />

                    <InstanceActions {...api} />
                  </div>
                )}
              </CardContent>
            </Card>

            <ConnectWhatsAppCard {...api} />

            <TestSendCard {...api} />

            {/* Card OpenAI Configuração */}
            <OpenAIConfigCard context="master" configId={config?.id} />

            {/* Card de Notificações */}
            <MasterNotificationsCard 
              config={config}
              updateConfig={updateConfig}
              instanceStatus={instanceStatus}
            />


          </div>

          <TestHistoryCard {...api} />


          <BotsInfoCards {...api} />
        </TabsContent>

        {/* Tab Configuração dos Bots */}
        <TabsContent value="bots">
          <MasterAssistantCard {...api} />

          <MasterBotConfigTab 
            config={config!}
            syncing={syncing}
            syncError={syncError}
            clearSyncError={clearSyncError}
            toggleBot={toggleBot}
            updateApproach={updateApproach}
            updateKeywords={updateKeywords}
            updateSupportPrompt={updateSupportPrompt}
            updateBotBehavior={updateBotBehavior}
            syncBots={syncBots}
            updatePrimaryBotType={updatePrimaryBotType}
            updateOpenAIModel={updateOpenAIModel}
            updateTriggerConfig={updateTriggerConfig}
            updateConfig={updateConfig}
            hasUnsyncedChanges={hasUnsyncedChanges}
            lastSyncedAt={lastSyncedAt}
          />
        </TabsContent>

        {/* Tab FAQ */}
        <TabsContent value="faq">
          <MasterFaqTab />
        </TabsContent>

        {/* Tab Sessões */}
        <TabsContent value="sessions">
          <MasterSessionsTab />
        </TabsContent>

        {/* Tab Links Páginas */}
        <TabsContent value="links">
          <WhatsAppLinkConfigCard 
            configId={config?.id || null}
            instancePhone={config?.instance_phone || null}
          />
        </TabsContent>
      </Tabs>

      <DeleteAssistantDialog {...api} />
    </div>
  );
}
