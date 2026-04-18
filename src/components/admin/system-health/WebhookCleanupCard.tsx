import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, CheckCircle2, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const WebhookCleanupCard = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCleanup = async () => {
    if (!confirm("Confirma limpeza de webhook_logs com mais de 14 dias?")) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("cleanup_old_webhook_logs", {
        retention_days: 14,
      });
      
      if (error) throw error;
      
      setLastResult(data);
      toast.success(`${data.deleted_count} registros removidos • ${formatBytes(data.freed_bytes)} liberados`);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trash2 className="h-5 w-5 text-orange-500" />
          Limpeza de Webhook Logs
        </CardTitle>
        <CardDescription>
          Remove registros antigos da tabela webhook_logs (retenção: 14 dias)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Cron automático ativo:</strong> roda todos os dias às 3h da manhã (UTC) / 0h Brasil.
            Use o botão abaixo só se quiser forçar limpeza imediata.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleCleanup} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Limpando...</>
          ) : (
            <><Trash2 className="h-4 w-4 mr-2" /> Executar Limpeza Agora</>
          )}
        </Button>

        {lastResult && (
          <div className="border rounded-lg p-3 bg-green-500/10 border-green-500/30 space-y-1 text-sm">
            <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Última execução
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Removidos:</span> <strong>{lastResult.deleted_count}</strong></div>
              <div><span className="text-muted-foreground">Liberados:</span> <strong>{formatBytes(lastResult.freed_bytes)}</strong></div>
              <div><span className="text-muted-foreground">Antes:</span> {formatBytes(lastResult.size_before_bytes)}</div>
              <div><span className="text-muted-foreground">Depois:</span> {formatBytes(lastResult.size_after_bytes)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
