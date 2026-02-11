import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackingOverview } from "@/components/admin/marketing/TrackingOverview";
import { PlatformTrackingConfig } from "@/components/admin/marketing/PlatformTrackingConfig";
import { ConversionEventsList } from "@/components/admin/marketing/ConversionEventsList";
import { VisitsAnalytics } from "@/components/admin/marketing/VisitsAnalytics";
import { BarChart3, Settings, Zap, Eye } from "lucide-react";

export default function MarketingTrackingPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing & Tracking</h1>
        <p className="text-muted-foreground">
          Configure e monitore o rastreamento de campanhas de todas as lojas da plataforma.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:block" />
            Plataforma
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Zap className="h-4 w-4 hidden sm:block" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2">
            <Eye className="h-4 w-4 hidden sm:block" />
            Visitas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TrackingOverview />
        </TabsContent>

        <TabsContent value="platform">
          <PlatformTrackingConfig />
        </TabsContent>

        <TabsContent value="events">
          <ConversionEventsList />
        </TabsContent>

        <TabsContent value="visits">
          <VisitsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
