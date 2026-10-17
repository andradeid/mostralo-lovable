import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import type { BookingSettings } from '@/hooks/useBooking';

export interface BookingButtonsPanelProps {
  storeId: string | null | undefined;
  settings: Pick<BookingSettings, 'use_interactive_buttons' | 'show_mostralo_footer' | 'interactive_test_phones' | 'confirmation_message_template' | 'reminder_message_template' | 'reschedule_message_template'>;
  onChange: <K extends keyof BookingButtonsPanelProps['settings']>(key: K, value: BookingButtonsPanelProps['settings'][K]) => void;
}
export function BookingButtonsPanel({ storeId, settings, onChange }: BookingButtonsPanelProps) {
  const [preview, setPreview] = useState<'confirmation' | 'reminder' | 'reschedule'>('confirmation');
  const { data: canHide = false, isLoading } = useQuery({
    queryKey: ['booking-footer-entitlement', storeId], enabled: !!storeId, staleTime: 60000,
    queryFn: async () => {
      if (!storeId) return false;
      const { data, error } = await supabase.rpc('can_hide_booking_footer', { p_store_id: storeId });
      if (error) throw error;
      return data === true;
    },
  });
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
  const values: Record<string, string> = { cliente: 'João Silva', profissional: 'Jeferson Dias', servico: 'Corte e barba',
    data: 'sexta, 23/10', horario: '9h30', valor: 'R$ 65', link: 'https://mostralo.com.br/meu-agendamento/exemplo', localizacao: store?.address || '' };
  const text = template.replace(/🔗\s*\*?Gerencie seu agendamento(?:\s*\(remarcar\/cancelar\))?\s*:?\*?\s*\{link\}/gi, '')
    .replace(/\{(cliente|profissional|servico|data|horario|valor|link|localizacao)\}/gi, (match, key: string) => values[key.toLowerCase()] ?? match)
    .replace(/\n{3,}/g, '\n\n').trim();
  return <section className="space-y-4 border-t pt-4">
    <h3 className="font-medium">Mensagens com botões</h3>
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="booking-buttons-enabled">Usar botões no WhatsApp</Label>
      <Switch id="booking-buttons-enabled" checked={settings.use_interactive_buttons} onCheckedChange={value => onChange('use_interactive_buttons', value)} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="booking-buttons-phones">Telefones de teste</Label>
      <Input id="booking-buttons-phones" value={settings.interactive_test_phones} placeholder="5561994009368, 5511999999999"
        onChange={event => onChange('interactive_test_phones', event.target.value)} />
      <p className="text-xs text-muted-foreground">Com números nesta lista, somente eles recebem botões. Os demais clientes mantêm a mensagem atual.</p>
    </div>
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="booking-buttons-footer">Exibir rodapé Mostralo</Label>
      <Switch id="booking-buttons-footer" disabled={!canHide || isLoading} checked={!canHide || settings.show_mostralo_footer}
        onCheckedChange={value => onChange('show_mostralo_footer', value)} />
    </div>
    {!canHide && <p className="text-xs text-muted-foreground">O rodapé é obrigatório em cortesia e Fundador; outros planos precisam da permissão de marca própria.</p>}
    <div className="flex flex-wrap gap-2" aria-label="Tipo de prévia">
      {(['confirmation', 'reminder', 'reschedule'] as const).map(kind => <Button key={kind} type="button" size="sm"
        variant={preview === kind ? 'secondary' : 'ghost'} onClick={() => setPreview(kind)}>
        {{ confirmation: 'Confirmação', reminder: 'Lembrete', reschedule: 'Reagendamento' }[kind]}</Button>)}
    </div>
    <div className="max-w-sm overflow-hidden rounded-lg border bg-card">
      {store?.logo_url && <img src={store.logo_url} alt={`Logo ${store.name}`} className="h-36 w-full object-contain bg-muted" />}
      <p className="whitespace-pre-wrap break-words p-4 text-sm">{text}</p>
      {(!canHide || settings.show_mostralo_footer) && <p className="px-4 pb-3 text-xs text-muted-foreground">Agendado pelo Mostralo · mostralo.com.br</p>}
      <div className="flex items-center justify-center gap-2 border-t p-3 text-sm text-primary"><Calendar className="h-4 w-4" />{preview === 'reminder' ? 'Ver meu agendamento' : 'Remarcar ou cancelar'}</div>
      {store?.address && <div className="flex items-center justify-center gap-2 border-t p-3 text-sm text-primary"><MapPin className="h-4 w-4" />Como chegar</div>}
    </div>
  </section>;
}