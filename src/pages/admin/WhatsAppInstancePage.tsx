import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Smartphone, Bot } from "lucide-react";
import { WhatsAppStatusCardMobile } from "@/components/admin/whatsapp/WhatsAppStatusCardMobile";
import { useWhatsAppInstancePage } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";
import { NoInstanceCard } from "@/components/admin/whatsapp/page/NoInstanceCard";
import { ConnectionStatusCard } from "@/components/admin/whatsapp/page/ConnectionStatusCard";
import { ManagementInstructionsCard } from "@/components/admin/whatsapp/page/ManagementInstructionsCard";
import { QrCodeCard } from "@/components/admin/whatsapp/page/QrCodeCard";
import { QuickTestCard } from "@/components/admin/whatsapp/page/QuickTestCard";
import { SendTemplateCard } from "@/components/admin/whatsapp/page/SendTemplateCard";
import { MessageHistoryCard } from "@/components/admin/whatsapp/page/MessageHistoryCard";
import { BotTabContent } from "@/components/admin/whatsapp/page/BotTabContent";

// Tela de WhatsApp da loja: só orquestra. Lógica em hooks/whatsappInstance, blocos em components/admin/whatsapp/page.

export default function WhatsAppInstancePage() {
  const page = useWhatsAppInstancePage();
  const {
    loading, instance, hasAIModule, actionLoading, contactsCount, messagesCount, pausedSessionsCount,
    handleConnect, handleCheckStatus, restartInstance, disconnectInstance, deleteInstance, isUazapiInstance,
  } = page;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = instance?.status === 'connected';
  const ctx = { ...page, isConnected };

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-0">
      {/* Header compacto no mobile */}
      <div className="px-1 sm:px-0">
        <h1 className="text-lg sm:text-2xl font-bold">WhatsApp</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          Conecte o WhatsApp da sua loja para enviar confirmações, lembretes e avisos automáticos aos clientes.
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-3 sm:space-y-6">
        {hasAIModule && (
        <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
          <TabsTrigger value="connection" className="gap-1.5 text-xs sm:text-sm h-full">
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Conexão</span>
          </TabsTrigger>
          {hasAIModule && (
            <TabsTrigger value="bot" className="gap-1.5 text-xs sm:text-sm h-full">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>IA</span>
            </TabsTrigger>
          )}
        </TabsList>
        )}

        <TabsContent value="connection" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
          {!instance ? (
            <NoInstanceCard ctx={ctx} />
          ) : (
            <>
            {/* Card Mobile - Visível apenas em telas pequenas */}
            <div className="sm:hidden">
              <WhatsAppStatusCardMobile
                instance={instance}
                actionLoading={actionLoading}
                contactsCount={contactsCount}
                messagesCount={messagesCount}
                pausedSessionsCount={pausedSessionsCount}
                onConnect={() => handleConnect()}
                onCheckStatus={handleCheckStatus}
                onRestart={restartInstance}
                onDisconnect={disconnectInstance}
                onDelete={deleteInstance}
                showConnectButton={!isUazapiInstance}
              />
            </div>

            <ConnectionStatusCard ctx={ctx} />

            <ManagementInstructionsCard ctx={ctx} />

            <QrCodeCard ctx={ctx} />

            <QuickTestCard ctx={ctx} />

            <SendTemplateCard ctx={ctx} />

            <MessageHistoryCard ctx={ctx} />
          </>
          )}
        </TabsContent>

        {hasAIModule && (
        <TabsContent value="bot" className="space-y-4 sm:space-y-6">
          <BotTabContent ctx={ctx} />
        </TabsContent>
        )}
      </Tabs>

    </div>
  );
}
