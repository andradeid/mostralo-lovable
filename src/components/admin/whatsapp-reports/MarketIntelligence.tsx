import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
          <CardHeader><CardTitle className="text-base">Ticket Médio: WhatsApp vs Manual</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="canal" className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="ticket" name="Ticket Médio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
          <CardHeader><CardTitle className="text-base">Volume por Dia da Semana</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.volumeByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" name="Mensagens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Horários de pico */}
      {peakHoursFiltered.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Horários de Pico</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHoursFiltered}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="messages" name="Mensagens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top contatos */}
      {data.topContacts && data.topContacts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top Contatos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topContacts.map((contact, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-6">#{i + 1}</span>
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
