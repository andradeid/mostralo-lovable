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
import { WebhookCleanupCard } from "@/components/admin/system-health/WebhookCleanupCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WhatsAppCleanupPanel from "@/components/admin/whatsapp-cleanup/WhatsAppCleanupPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

      {/* Tabs: Monitoramento vs Guia */}
      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Guia de Diagnóstico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6 mt-6">
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

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Queries mais lentas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
                ) : data?.slowQueries?.length ? (
                  <div className="space-y-3">
                    {data.slowQueries.slice(0, 5).map((query) => (
                      <div key={query.queryid} className="rounded border p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{query.calls} execuções</span>
                          <span>{Math.round(query.meanExecTimeMs)}ms média</span>
                        </div>
                        <p className="text-sm font-medium">{Math.round(query.totalExecTimeMs)}ms total</p>
                        <p className="text-xs text-muted-foreground line-clamp-3">{query.query}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados de queries lentas.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertas de índice</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
                ) : data?.indexAlerts?.length ? (
                  <div className="space-y-3">
                    {data.indexAlerts.slice(0, 5).map((item) => (
                      <div key={item.tableName} className="rounded border p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.tableName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.seqScans} seq scans • {item.idxScans} idx scans • {item.liveRows} linhas
                          </p>
                        </div>
                        <span className="text-xs font-medium rounded px-2 py-1 bg-destructive/10 text-destructive">
                          {item.indexUsagePercent}% idx
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem alertas de índice.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alert Config */}
          <AlertConfigCard showExplanations={showExplanations} />

          {/* Webhook Cleanup */}
          <WebhookCleanupCard />

          {/* WhatsApp Cleanup */}
          <WhatsAppCleanupPanel />

          {/* Footer */}
          {data && (
            <p className="text-xs text-muted-foreground text-center">
              Última atualização: {new Date(data.timestamp).toLocaleTimeString("pt-BR")} • 
              Próxima em ~60s • Apenas pg_stat_* views (read-only, zero impacto)
            </p>
          )}
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <DiagnosticGuideCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
