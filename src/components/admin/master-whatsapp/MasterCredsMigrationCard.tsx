import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MigrationDetail {
  store: string;
  store_id: string;
  status: 'migrated' | 'not_found' | 'error' | 'already_has';
  creds_id?: string;
  error?: string;
}

interface MigrationResult {
  success: boolean;
  total_bots: number;
  migrated: number;
  not_found: number;
  already_has: number;
  errors: number;
  details: MigrationDetail[];
}

export function MasterCredsMigrationCard() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const runMigration = async (force: boolean = false) => {
    setMigrating(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('migrate-openai-creds', {
        body: { force }
      });

      if (error) throw error;

      setResult(data as MigrationResult);
      
      if (data.migrated > 0) {
        toast.success(`${data.migrated} loja(s) migrada(s) com sucesso!`);
      } else if (data.already_has > 0) {
        toast.info(`${data.already_has} loja(s) já estavam configuradas.`);
      } else {
        toast.warning('Nenhuma loja encontrada para migrar.');
      }
    } catch (error) {
      console.error('Erro na migração:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao executar migração');
    } finally {
      setMigrating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'migrated':
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'already_has':
        return <CheckCircle className="w-3.5 h-3.5 text-blue-500" />;
      case 'not_found':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'migrated':
        return <Badge className="bg-green-500 text-[10px]">Migrado</Badge>;
      case 'already_has':
        return <Badge variant="secondary" className="text-[10px]">Já configurado</Badge>;
      case 'not_found':
        return <Badge variant="outline" className="text-[10px] text-amber-600">Não encontrado</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-[10px]">Erro</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-5 h-5 text-primary" />
          Manutenção de Credenciais
        </CardTitle>
        <CardDescription className="text-xs">
          Sincroniza credenciais OpenAI das lojas com a Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => runMigration(false)} 
            disabled={migrating}
            className="flex-1"
            size="sm"
          >
            {migrating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Migrar Pendentes
              </>
            )}
          </Button>
          <Button 
            onClick={() => runMigration(true)} 
            disabled={migrating}
            variant="outline"
            size="sm"
          >
            Forçar Todas
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold text-primary">{result.total_bots}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <p className="text-lg font-bold text-green-600">{result.migrated}</p>
                <p className="text-[10px] text-muted-foreground">Migrados</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{result.already_has}</p>
                <p className="text-[10px] text-muted-foreground">Já tinha</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <p className="text-lg font-bold text-amber-600">{result.not_found}</p>
                <p className="text-[10px] text-muted-foreground">Não encontrado</p>
              </div>
            </div>

            {/* Detalhes */}
            {result.details && result.details.length > 0 && (
              <div className="border rounded-lg">
                <div className="px-3 py-2 bg-muted/50 border-b">
                  <p className="text-xs font-medium">Detalhes da Migração</p>
                </div>
                <ScrollArea className="h-48">
                  <div className="divide-y">
                    {result.details.map((detail, index) => (
                      <div key={index} className="p-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getStatusIcon(detail.status)}
                          <span className="text-xs truncate">{detail.store}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(detail.status)}
                          {detail.creds_id && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {detail.creds_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
