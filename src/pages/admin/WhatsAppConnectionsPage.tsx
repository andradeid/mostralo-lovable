import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Zap, Activity } from "lucide-react";
import EvolutionConfigPage from "./EvolutionConfigPage";
import UaZapiConfigTab from "@/components/admin/whatsapp/UaZapiConfigTab";
import UaZapiWebhookMonitor from "@/components/admin/whatsapp/UaZapiWebhookMonitor";

export default function WhatsAppConnectionsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
          Conexões WhatsApp
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Gerencie seus provedores de API do WhatsApp
        </p>
      </div>

      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Evolution API</span>
            <span className="sm:hidden">Evolution</span>
          </TabsTrigger>
          <TabsTrigger value="uazapi" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            UaZapi
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="mt-4">
          <EvolutionConfigPage embedded />
        </TabsContent>

        <TabsContent value="uazapi" className="mt-4">
          <UaZapiConfigTab />
        </TabsContent>

        <TabsContent value="monitor" className="mt-4">
          <UaZapiWebhookMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
