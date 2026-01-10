import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BotAIStatusCardProps {
  storeId: string;
  openaiCredsId: string | null | undefined;
  updatedAt: string | null | undefined;
  onRefresh?: () => void;
}

export function BotAIStatusCard({ 
  storeId, 
  openaiCredsId, 
  updatedAt,
  onRefresh 
}: BotAIStatusCardProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSyncAI = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-bot-sync', {
        body: { 
          storeId,
          action: 'update'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Assistente atualizado com sucesso!");
        onRefresh?.();
      } else {
        throw new Error(data?.error || 'Erro ao atualizar assistente');
      }
    } catch (error) {
      console.error('Erro ao sincronizar IA:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar assistente");
    } finally {
      setSyncing(false);
    }
  };

  const isConfigured = !!openaiCredsId;

  return (
    <Card className={`border-l-4 ${isConfigured ? 'border-l-green-500' : 'border-l-amber-500'}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2 rounded-full shrink-0 ${
              isConfigured ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <Brain className={`w-5 h-5 ${
                isConfigured ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">Inteligência Artificial</p>
                <Badge 
                  variant={isConfigured ? "default" : "outline"}
                  className={`text-[10px] h-5 ${isConfigured ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  {isConfigured ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativa
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isConfigured 
                  ? "Configurada e funcionando" 
                  : "Aguardando configuração inicial"}
              </p>
            </div>
          </div>
          
          {/* Última atualização */}
          {updatedAt && (
            <div className="text-right hidden sm:block shrink-0">
              <p className="text-[10px] text-muted-foreground">Atualização</p>
              <p className="text-xs font-medium">
                {formatDistanceToNow(new Date(updatedAt), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          )}
        </div>
        
        {/* Botão amigável para sincronizar */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSyncAI}
          disabled={syncing}
          className="mt-3 w-full"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Assistente
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
