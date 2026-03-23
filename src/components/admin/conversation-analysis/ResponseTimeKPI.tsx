import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Bot, User } from "lucide-react";

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

      const { data: messages } = await query.limit(5000);
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

      byContact.forEach(msgs => {
        for (let i = 1; i < msgs.length; i++) {
          const prevDir = msgs[i - 1].direction;
          const currDir = msgs[i].direction;
          if ((prevDir === 'in' || prevDir === 'incoming') && (currDir === 'out' || currDir === 'outgoing')) {
            const diffSec = (new Date(msgs[i].timestamp).getTime() - new Date(msgs[i - 1].timestamp).getTime()) / 1000;
            if (diffSec <= 0 || diffSec > 3600) continue; // Ignora > 1h
            if (msgs[i].is_from_bot) {
              botTotal += diffSec;
              botCount++;
            } else {
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
