import { useState, useEffect } from "react";
import { useSystemAlertConfig } from "@/hooks/useSystemAlertConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Send, Save, Clock, AlertTriangle } from "lucide-react";

export function AlertConfigCard({ showExplanations }: { showExplanations: boolean }) {
  const { config, isLoading, save, isSaving, testAlert, isTesting } = useSystemAlertConfig();

  const [phone, setPhone] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [maxConnPercent, setMaxConnPercent] = useState(80);
  const [minCacheHit, setMinCacheHit] = useState(95);
  const [maxQueryTime, setMaxQueryTime] = useState(5000);
  const [cooldown, setCooldown] = useState(30);

  // Sync local state with fetched config
  useEffect(() => {
    if (config) {
      setPhone(config.alert_phone || "");
      setEnabled(config.is_enabled);
      setMaxConnPercent(config.max_connections_percent);
      setMinCacheHit(config.min_cache_hit_ratio);
      setMaxQueryTime(config.max_query_time_ms);
      setCooldown(config.cooldown_minutes);
    }
  }, [config]);

  const handleSave = () => {
    save({
      is_enabled: enabled,
      alert_phone: phone || null,
      max_connections_percent: maxConnPercent,
      min_cache_hit_ratio: minCacheHit,
      max_query_time_ms: maxQueryTime,
      cooldown_minutes: cooldown,
    });
  };

  const hasChanges = config && (
    phone !== (config.alert_phone || "") ||
    enabled !== config.is_enabled ||
    maxConnPercent !== config.max_connections_percent ||
    minCacheHit !== config.min_cache_hit_ratio ||
    maxQueryTime !== config.max_query_time_ms ||
    cooldown !== config.cooldown_minutes
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Alertas WhatsApp
            </CardTitle>
            <CardDescription>
              Receba alertas quando o sistema ultrapassar limites críticos
            </CardDescription>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {showExplanations && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
            O sistema verifica as métricas a cada 5 minutos via pg_cron. Se algum threshold for ultrapassado
            e o cooldown permitir, envia um alerta via WhatsApp pela instância master. Zero impacto no banco
            — usa as mesmas views pg_stat_* da página de saúde.
          </div>
        )}

        {/* Phone number */}
        <div className="space-y-2">
          <Label htmlFor="alert-phone" className="text-sm font-medium">
            Número WhatsApp para alertas
          </Label>
          <Input
            id="alert-phone"
            placeholder="11999998888"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            maxLength={11}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">Apenas números (DDD + número), sem +55</p>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Conexões máx. (%)</Label>
            <Input
              type="number"
              value={maxConnPercent}
              onChange={(e) => setMaxConnPercent(Number(e.target.value))}
              min={50}
              max={100}
              className="h-9"
            />
            {showExplanations && (
              <p className="text-xs text-muted-foreground">Alerta se conexões &gt; X% do máximo</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cache Hit mín. (%)</Label>
            <Input
              type="number"
              value={minCacheHit}
              onChange={(e) => setMinCacheHit(Number(e.target.value))}
              min={50}
              max={100}
              step={0.5}
              className="h-9"
            />
            {showExplanations && (
              <p className="text-xs text-muted-foreground">Alerta se cache hit cair abaixo</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Query Time máx. (ms)</Label>
            <Input
              type="number"
              value={maxQueryTime}
              onChange={(e) => setMaxQueryTime(Number(e.target.value))}
              min={1000}
              max={30000}
              step={500}
              className="h-9"
            />
            {showExplanations && (
              <p className="text-xs text-muted-foreground">Alerta se o check demorar mais</p>
            )}
          </div>
        </div>

        {/* Cooldown */}
        <div className="space-y-1.5 max-w-xs">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Cooldown entre alertas (minutos)
          </Label>
          <Input
            type="number"
            value={cooldown}
            onChange={(e) => setCooldown(Number(e.target.value))}
            min={5}
            max={1440}
            className="h-9"
          />
        </div>

        {/* Last check status */}
        {config?.last_check_at && (
          <div className="text-xs text-muted-foreground border-t pt-3 flex flex-wrap gap-x-4 gap-y-1">
            <span>Último check: {new Date(config.last_check_at).toLocaleString("pt-BR")}</span>
            <span>Status: <strong>{config.last_check_status || "—"}</strong></span>
            {config.last_alert_at && (
              <span>Último alerta: {new Date(config.last_alert_at).toLocaleString("pt-BR")}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => testAlert()}
            disabled={isTesting || !phone}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1.5" />
            {isTesting ? "Enviando..." : "Enviar Teste"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
