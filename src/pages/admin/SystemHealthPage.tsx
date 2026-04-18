import { useState } from "react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { useAuth } from "@/hooks/use-auth";
import { Activity, RefreshCw, Clock, BookOpen, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionsCard } from "@/components/admin/system-health/ConnectionsCard";
import { DatabaseStatsCard } from "@/components/admin/system-health/DatabaseStatsCard";
import { RealtimeCard } from "@/components/admin/system-health/RealtimeCard";
import { ModulesCard } from "@/components/admin/system-health/ModulesCard";
import { TopTablesCard } from "@/components/admin/system-health/TopTablesCard";
import { AlertConfigCard } from "@/components/admin/system-health/AlertConfigCard";
import { DiagnosticGuideCard } from "@/components/admin/system-health/DiagnosticGuideCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WhatsAppCleanupPanel from "@/components/admin/whatsapp-cleanup/WhatsAppCleanupPanel";

export default function SystemHealthPage() {
  const { profile } = useAuth();
  const { data, isLoading, isFetching, error, manualRefresh, canManualRefresh, isPageVisible } = useSystemHealth();
  const [showExplanations, setShowExplanations] = useState(false);

  if (profile?.user_type !== "master_admin") {
    return (
      <Alert variant="destructive">
        <AlertDescription>Acesso restrito ao Master Admin.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Saúde do Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real — atualiza a cada 60s
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Explanation mode toggle */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <Label htmlFor="explain-mode" className="text-xs text-muted-foreground cursor-pointer">
              Explicações
            </Label>
            <Switch
              id="explain-mode"
              checked={showExplanations}
              onCheckedChange={setShowExplanations}
              className="scale-75"
            />
          </div>

          {data && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Query: {data.queryTimeMs}ms</span>
            </div>
          )}
          {!isPageVisible && (
            <span className="text-xs text-yellow-500 font-medium">⏸ Pausado (aba inativa)</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={!canManualRefresh || isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ConnectionsCard data={data?.connections ?? null} isLoading={isLoading} showExplanations={showExplanations} />
        <DatabaseStatsCard data={data?.database ?? null} isLoading={isLoading} showExplanations={showExplanations} />
        <RealtimeCard data={data?.realtime ?? null} isLoading={isLoading} showExplanations={showExplanations} />
      </div>

      {/* Modules */}
      <ModulesCard data={data?.modules ?? null} isLoading={isLoading} showExplanations={showExplanations} />

      {/* Top Tables */}
      <TopTablesCard data={data?.topTables ?? null} isLoading={isLoading} showExplanations={showExplanations} />

      {/* Alert Config */}
      <AlertConfigCard showExplanations={showExplanations} />

      {/* WhatsApp Cleanup */}
      <WhatsAppCleanupPanel />

      {/* Footer */}
      {data && (
        <p className="text-xs text-muted-foreground text-center">
          Última atualização: {new Date(data.timestamp).toLocaleTimeString("pt-BR")} • 
          Próxima em ~60s • Apenas pg_stat_* views (read-only, zero impacto)
        </p>
      )}
    </div>
  );
}
