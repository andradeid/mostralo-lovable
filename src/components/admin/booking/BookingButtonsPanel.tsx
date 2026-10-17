import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { normalizePhone } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookingMessagePreview } from './BookingMessagePreview';
import type { BookingSettings } from '@/hooks/useBooking';

export interface BookingButtonsPanelProps {
  storeId: string | null | undefined;
  settings: Pick<BookingSettings, 'use_interactive_buttons' | 'interactive_test_phones' | 'confirmation_message_template' | 'reminder_message_template' | 'reschedule_message_template'>;
  onChange: <K extends keyof BookingButtonsPanelProps['settings']>(key: K, value: BookingButtonsPanelProps['settings'][K]) => void;
}
export function BookingButtonsPanel({ storeId, settings, onChange }: BookingButtonsPanelProps) {
  const [preview, setPreview] = useState<'confirmation' | 'reminder' | 'reschedule'>('confirmation');
  const [testBooking, setTestBooking] = useState('');
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState('');
  const { data: testBookings = [] } = useQuery({
    queryKey: ['booking-button-tests', storeId, settings.interactive_test_phones], enabled: !!storeId && !!settings.interactive_test_phones.trim(),
    queryFn: async () => {
      if (!storeId) return [];
      const phones = settings.interactive_test_phones.split(',').map(normalizePhone).filter(phone => phone.length === 11);
      const variants = phones.flatMap(phone => [phone, `55${phone}`, phone.slice(0, 2) + phone.slice(3)]);
      const { data, error } = await supabase.from('bookings').select('id,customer_name,customer_phone,booking_date,start_time')
        .eq('store_id', storeId).in('customer_phone', variants).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
  });
  const sendTest = async (kind: 'confirmation' | 'reminder') => {
    if (!testBooking) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('booking-confirmation', { body: { booking_id: testBooking, test_notification: kind } });
      if (error) { setTestResult(error instanceof FunctionsHttpError ? await error.context.text() : error.message); return; }
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) { setTestResult(error instanceof Error ? error.message : 'Falha no teste'); }
    finally { setSending(false); }
  };
  const { data: store } = useQuery({
    queryKey: ['booking-buttons-preview-store', storeId], enabled: !!storeId, staleTime: 60000,
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase.from('stores').select('address,logo_url,name').eq('id', storeId).single();
      if (error) throw error;
      return data;
    },
  });
  const template = preview === 'reminder' ? settings.reminder_message_template
    : `${preview === 'reschedule' ? `${settings.reschedule_message_template}\n\n` : ''}${settings.confirmation_message_template}`;
  const buttons = settings.use_interactive_buttons || !!settings.interactive_test_phones.trim();
  return <section className="space-y-4 border-t pt-4">
    <h3 className="font-medium">Mensagens com botões</h3>
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="booking-buttons-enabled">Mensagens com botões (inclui assinatura Mostralo)</Label>
      <Switch id="booking-buttons-enabled" checked={settings.use_interactive_buttons} onCheckedChange={value => onChange('use_interactive_buttons', value)} />
    </div>
    <p className="text-xs text-muted-foreground">Os clientes recebem botões para remarcar/cancelar e ver o caminho, no lugar do link. Mensagens com botões levam a assinatura 'Agendado pelo Mostralo' no rodapé.</p>
    <div className="space-y-2">
      <Label htmlFor="booking-buttons-phones">Telefones de teste</Label>
      <Input id="booking-buttons-phones" value={settings.interactive_test_phones} placeholder="5561994009368, 5511999999999"
        onChange={event => onChange('interactive_test_phones', event.target.value)} />
      <p className="text-xs text-muted-foreground">Com números nesta lista, só eles recebem botões, mesmo com a opção desligada. Para liberar para todos, apague a lista e ligue a opção.</p>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Tipo de prévia">
      {(['confirmation', 'reminder', 'reschedule'] as const).map(kind => <Button key={kind} type="button" size="sm"
        variant={preview === kind ? 'secondary' : 'ghost'} onClick={() => setPreview(kind)}>
        {{ confirmation: 'Confirmação', reminder: 'Lembrete', reschedule: 'Reagendamento' }[kind]}</Button>)}
    </div>
    <BookingMessagePreview template={template} buttons={buttons} reminder={preview === 'reminder'} store={store} />
    {settings.interactive_test_phones.trim() && <div className="space-y-3">
      <Label>Agendamento para teste</Label>
      <Select value={testBooking} onValueChange={setTestBooking}><SelectTrigger><SelectValue placeholder="Selecione o agendamento" /></SelectTrigger>
        <SelectContent>{testBookings.map(booking => <SelectItem key={booking.id} value={booking.id}>{booking.customer_name} · {booking.booking_date} · {booking.start_time.slice(0, 5)}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2"><Button type="button" disabled={!testBooking || sending} onClick={() => sendTest('confirmation')}>Testar confirmação</Button>
        <Button type="button" variant="outline" disabled={!testBooking || sending} onClick={() => sendTest('reminder')}>Testar lembrete</Button></div>
      {testResult && <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border bg-muted p-3 text-xs">{testResult}</pre>}
    </div>}
  </section>;
}