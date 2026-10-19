import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OrderScheduleSettings } from '@/lib/orderScheduleSettings';

export interface OrderScheduleFieldsProps {
  value: OrderScheduleSettings;
  onChange: (value: OrderScheduleSettings) => void;
  connected: boolean;
  loading: boolean;
  error?: string;
}

export function OrderScheduleFields({ value, onChange, connected, loading, error }: OrderScheduleFieldsProps) {
  const update = (patch: Partial<OrderScheduleSettings>) => onChange({ ...value, ...patch });
  if (loading) return <p className="text-sm text-muted-foreground">Carregando configurações de encomendas...</p>;
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  return <section className="space-y-4 border-t pt-4">
    <h3 className="font-semibold">Encomendas</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2"><Label htmlFor="prep-lead">Entrar no Kanban quantas horas antes do horário</Label>
        <Select value={String(value.prep_lead_minutes)} onValueChange={v => update({ prep_lead_minutes: Number(v) as OrderScheduleSettings['prep_lead_minutes'] })}>
          <SelectTrigger id="prep-lead"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 6, 8, 12, 24].map(h => <SelectItem key={h} value={String(h * 60)}>{h}h</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label htmlFor="pickup-interval">Intervalo entre horários de retirada</Label>
        <Select value={String(value.pickup_interval_minutes)} onValueChange={v => update({ pickup_interval_minutes: Number(v) as OrderScheduleSettings['pickup_interval_minutes'] })}>
          <SelectTrigger id="pickup-interval"><SelectValue /></SelectTrigger><SelectContent>{[15, 30, 45, 60].map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {(['max_orders_per_day', 'max_orders_per_slot'] as const).map((field) => <div key={field} className="space-y-2">
        <Label htmlFor={field}>{field === 'max_orders_per_day' ? 'Limite de encomendas por dia' : 'Limite por horário'}</Label>
        <Input id={field} type="number" min={1} step={1} value={value[field] ?? ''} placeholder="Sem limite" onChange={e => update({ [field]: e.target.value === '' ? null : Number(e.target.value) })} />
      </div>)}
    </div>
    <h4 className="text-sm font-semibold">WhatsApp</h4>
    <p className="text-sm text-muted-foreground">As notificações só funcionam com o WhatsApp da loja conectado.{!connected && ' O WhatsApp da loja não está conectado.'}</p>
    {([
      ['notify_confirmation', 'Confirmar a encomenda'],
      ['notify_day_before', 'Lembrete na véspera'],
      ['notify_store_summary', 'Resumo das encomendas de amanhã para a loja'],
    ] as const).map(([field, label]) => <div key={field} className="flex items-center justify-between gap-4">
      <Label htmlFor={field}>{label}</Label><Switch id={field} checked={value[field]} onCheckedChange={v => update({ [field]: v })} />
    </div>)}
    {value.notify_day_before && <div className="space-y-2"><Label htmlFor="day-before-hour">Horário do lembrete na véspera</Label>
      <Select value={String(value.day_before_hour)} onValueChange={v => update({ day_before_hour: Number(v) })}>
        <SelectTrigger id="day-before-hour"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 24 }, (_, h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}:00</SelectItem>)}</SelectContent>
      </Select>
    </div>}
    <div className="space-y-2"><Label htmlFor="notify-before">Lembrete antes do horário</Label>
      <Select value={String(value.notify_before_minutes ?? 'off')} onValueChange={v => update({ notify_before_minutes: v === 'off' ? null : Number(v) as 30 | 60 | 120 })}>
        <SelectTrigger id="notify-before"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="off">Desligado</SelectItem><SelectItem value="30">30 min</SelectItem><SelectItem value="60">1h</SelectItem><SelectItem value="120">2h</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </section>;
}