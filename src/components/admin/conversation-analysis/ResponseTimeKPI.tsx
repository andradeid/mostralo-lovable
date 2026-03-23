import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Bot, User } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ResponseTimeKPIProps {
  storeId: string | undefined;
  dateFrom: string | null;
}

interface ResponseStats {
  humanAvg: number;
  botAvg: number;
  humanCount: number;
  botCount: number;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function ResponseTimeKPI({ storeId, dateFrom }: ResponseTimeKPIProps) {
  const { data: stats, isLoading } = useQuery<ResponseStats>({
    queryKey: ['response-time-stats', storeId, dateFrom],
    queryFn: async () => {
      if (!storeId) return { humanAvg: 0, botAvg: 0, humanCount: 0, botCount: 0 };

      let query = supabase
        .from('whatsapp_chat_messages')
        .select('direction, is_from_bot, timestamp, remote_jid')
        .eq('store_id', storeId)
        .in('direction', ['in', 'out', 'incoming', 'outgoing'])
        .order('timestamp', { ascending: true });

      if (dateFrom) query = query.gte('timestamp', dateFrom);

      const { data: messages } = await query.limit(10000);
      if (!messages || messages.length < 2) {
        return { humanAvg: 0, botAvg: 0, humanCount: 0, botCount: 0 };
      }

      // Agrupar por contato
      const byContact = new Map<string, typeof messages>();
      messages.forEach(m => {
        const list = byContact.get(m.remote_jid) || [];
        list.push(m);
        byContact.set(m.remote_jid, list);
      });

      let humanTotal = 0, humanCount = 0;
      let botTotal = 0, botCount = 0;

      // Limites: Bot até 5min, Humano até 24h
      const BOT_MAX_SEC = 300;
      const HUMAN_MAX_SEC = 86400;

      byContact.forEach(msgs => {
        let lastIncomingTime: number | null = null;

        for (let i = 0; i < msgs.length; i++) {
          const dir = msgs[i].direction;
          const isIncoming = dir === 'in' || dir === 'incoming';
          const isOutgoing = dir === 'out' || dir === 'outgoing';

          if (isIncoming) {
            // Registra o timestamp da mensagem incoming mais recente
            lastIncomingTime = new Date(msgs[i].timestamp).getTime();
          } else if (isOutgoing && lastIncomingTime !== null) {
            // Primeira resposta após uma mensagem incoming
            const diffSec = (new Date(msgs[i].timestamp).getTime() - lastIncomingTime) / 1000;
            lastIncomingTime = null; // Consome o par, evita contar respostas consecutivas
            if (diffSec <= 0) continue;
            if (msgs[i].is_from_bot) {
              if (diffSec > BOT_MAX_SEC) continue;
              botTotal += diffSec;
              botCount++;
            } else {
              if (diffSec > HUMAN_MAX_SEC) continue;
              humanTotal += diffSec;
              humanCount++;
            }
          }
        }
      });

      return {
        humanAvg: humanCount > 0 ? humanTotal / humanCount : 0,
        botAvg: botCount > 0 ? botTotal / botCount : 0,
        humanCount,
        botCount,
      };
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const humanAvg = stats?.humanAvg || 0;
  const botAvg = stats?.botAvg || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Tempo Médio de Resposta
          <InfoTooltip text="Tempo médio entre a mensagem do cliente e a resposta. Respostas humanas consideram até 24h de intervalo. Respostas da IA consideram até 5 minutos." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <User className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-600">
              {isLoading ? '...' : formatTime(humanAvg)}
            </p>
            <p className="text-[10px] text-muted-foreground">Humano</p>
            <p className="text-[10px] text-muted-foreground">
              ({stats?.humanCount || 0} respostas)
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <Bot className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-600">
              {isLoading ? '...' : formatTime(botAvg)}
            </p>
            <p className="text-[10px] text-muted-foreground">IA</p>
            <p className="text-[10px] text-muted-foreground">
              ({stats?.botCount || 0} respostas)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}