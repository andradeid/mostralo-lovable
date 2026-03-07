import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface MarketData {
  ticketComparison: {
    whatsapp: { ticket: number; orders: number };
    manual: { ticket: number; orders: number };
  };
  volumeByDayOfWeek: { day: string; count: number }[];
  peakHours: { hour: string; messages: number }[];
  topContacts: { name: string; phone: string; messages: number }[];
}

export function MarketIntelligence({ storeId, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-reports-market', {
        body: { store_id: storeId, date_from: `${dateFrom}T00:00:00`, date_to: `${dateTo}T23:59:59` },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar inteligência de mercado:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return null;

  const ticketData = [
    { canal: 'WhatsApp', ticket: data.ticketComparison.whatsapp.ticket, pedidos: data.ticketComparison.whatsapp.orders },
    { canal: 'Manual', ticket: data.ticketComparison.manual.ticket, pedidos: data.ticketComparison.manual.orders },
  ];

  const peakHoursFiltered = data.peakHours.filter(h => h.messages > 0);

  return (
    <div className="space-y-4 mt-4">
      {/* Ticket médio comparativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Ticket Médio: WhatsApp vs Manual</CardTitle>
              <InfoTooltip text="Compara o valor médio por pedido entre os canais. Um ticket maior no WhatsApp indica que a IA está conseguindo apresentar produtos e combos de forma eficiente, incentivando compras maiores." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketData}>
                <defs>
                  <linearGradient id="gradientTicket" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="canal" className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="ticket" name="Ticket Médio" fill="url(#gradientTicket)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-around mt-2 text-xs text-muted-foreground">
              <span>WhatsApp: {data.ticketComparison.whatsapp.orders} pedidos</span>
              <span>Manual: {data.ticketComparison.manual.orders} pedidos</span>
            </div>
          </CardContent>
        </Card>

        {/* Volume por dia da semana */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Volume por Dia da Semana</CardTitle>
              <InfoTooltip text="Quantidade de mensagens recebidas por dia da semana. Identifique os dias mais movimentados para planejar escalas de atendimento e promoções específicas." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.volumeByDayOfWeek}>
                <defs>
                  <linearGradient id="gradientVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" name="Mensagens" fill="url(#gradientVolume)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Horários de pico */}
      {peakHoursFiltered.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Horários de Pico</CardTitle>
              <InfoTooltip text="Distribuição do volume de mensagens por hora do dia. Use para identificar os horários com maior demanda e garantir que a IA ou a equipe estejam preparados para atender nos momentos críticos." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHoursFiltered}>
                <defs>
                  <linearGradient id="gradientPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="messages" name="Mensagens" fill="url(#gradientPeak)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top contatos */}
      {data.topContacts && data.topContacts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Top Contatos</CardTitle>
              <InfoTooltip text="Clientes que mais interagiram pelo WhatsApp no período. São os seus clientes mais engajados — considere ações de fidelização, programas VIP ou ofertas exclusivas para eles." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topContacts.map((contact, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary w-6">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{contact.messages} msgs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
