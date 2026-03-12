import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface PixChargesAnalysisProps {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface PixCharge {
  timestamp: string;
  metadata: any;
  sender_name: string | null;
  remote_jid: string;
}

interface AttendantStat {
  name: string;
  count: number;
  total: number;
}

export function PixChargesAnalysis({ storeId, dateFrom, dateTo }: PixChargesAnalysisProps) {
  const [charges, setCharges] = useState<PixCharge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchCharges();
  }, [storeId, dateFrom, dateTo]);

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_chat_messages')
        .select('timestamp, metadata, sender_name, remote_jid')
        .eq('store_id', storeId!)
        .eq('message_type', 'payment_request')
        .eq('direction', 'out')
        .gte('timestamp', `${dateFrom}T00:00:00`)
        .lte('timestamp', `${dateTo}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setCharges(data || []);
    } catch (err) {
      console.error('Erro ao buscar cobranças PIX:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calcular métricas
  const totalAmount = charges.reduce((sum, c) => {
    const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata;
    return sum + (Number(meta?.amount) || 0);
  }, 0);
  const avgAmount = charges.length > 0 ? totalAmount / charges.length : 0;

  // Ranking de atendentes
  const attendantMap: Record<string, AttendantStat> = {};
  charges.forEach(c => {
    const name = c.sender_name || 'Desconhecido';
    if (!attendantMap[name]) attendantMap[name] = { name, count: 0, total: 0 };
    attendantMap[name].count++;
    const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata;
    attendantMap[name].total += Number(meta?.amount) || 0;
  });
  const attendantRanking = Object.values(attendantMap).sort((a, b) => b.total - a.total);

  // Clientes únicos
  const uniqueClients = new Set(charges.map(c => c.remote_jid)).size;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Cobranças Enviadas</span>
            </div>
            <p className="text-2xl font-bold">{charges.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ticket Médio</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(avgAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Clientes Únicos</span>
            </div>
            <p className="text-2xl font-bold">{uniqueClients}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ranking de atendentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Cobradores
              <InfoTooltip text="Ranking de atendentes que mais enviaram cobranças PIX no período." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendantRanking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma cobrança no período</p>
            ) : (
              <div className="space-y-3">
                {attendantRanking.map((att, idx) => (
                  <div key={att.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}º</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">{att.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(att.total)}</p>
                      <p className="text-[10px] text-muted-foreground">{att.count} cobranças</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas cobranças */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Últimas Cobranças
              <InfoTooltip text="Histórico das cobranças PIX mais recentes enviadas pelo chat." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma cobrança no período</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {charges.slice(0, 20).map((charge, idx) => {
                  const meta = typeof charge.metadata === 'string' ? JSON.parse(charge.metadata) : charge.metadata;
                  const amount = Number(meta?.amount) || 0;
                  const itemName = meta?.item_name || '';
                  const phone = charge.remote_jid?.replace('@s.whatsapp.net', '') || '';
                  return (
                    <div key={idx} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(amount)}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                          {itemName || phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">{formatDate(charge.timestamp)}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{charge.sender_name || '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
