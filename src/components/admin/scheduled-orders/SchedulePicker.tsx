import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { scheduleRpc, type ScheduleDay, type ScheduleSlot } from '@/lib/scheduledOrders';

export interface SchedulePickerProps {
  storeId: string; orderId: string; deliveryType: string;
  onSelect: (slot: ScheduleSlot | null) => void;
}
export function SchedulePicker({ storeId, orderId, deliveryType, onSelect }: SchedulePickerProps) {
  const [month, setMonth] = useState(new Date());
  const [date, setDate] = useState<Date>();
  const [selectedAt, setSelectedAt] = useState<string>();
  const type = deliveryType === 'pickup' ? 'pickup' : 'delivery';
  const days = useQuery({
    queryKey: ['reschedule-days', storeId, orderId, format(month, 'yyyy-MM'), type],
    queryFn: () => scheduleRpc<ScheduleDay[]>('get_scheduled_days', { p_store_id: storeId, p_from: format(startOfMonth(month), 'yyyy-MM-dd'), p_to: format(endOfMonth(month), 'yyyy-MM-dd'), p_delivery_type: type }),
    staleTime: 0,
  });
  const slots = useQuery({
    queryKey: ['reschedule-slots', storeId, orderId, date && format(date, 'yyyy-MM-dd'), type],
    queryFn: () => scheduleRpc<ScheduleSlot[]>('get_scheduled_slots', { p_store_id: storeId, p_date: date && format(date, 'yyyy-MM-dd'), p_delivery_type: type, p_exclude_order_id: orderId }),
    enabled: !!date,
    staleTime: 0,
  });
  return <div className="space-y-3">
    <Calendar mode="single" locale={ptBR} month={month} onMonthChange={setMonth} selected={date}
      onSelect={(next) => { setDate(next); setSelectedAt(undefined); onSelect(null); }}
      disabled={(day) => days.isFetching || !!days.error || !days.data?.some((item) => item.day === format(day, 'yyyy-MM-dd') && item.is_open && item.slots_available > 0)}
      className="mx-auto w-fit" />
    {(days.isFetching || slots.isFetching) && <p role="status" className="text-sm text-muted-foreground">Carregando horários disponíveis...</p>}
    {(days.error || slots.error) && <div role="alert" className="text-sm text-destructive">{days.error?.message || slots.error?.message}<Button variant="ghost" onClick={() => { void days.refetch(); void slots.refetch(); }}>Tentar novamente</Button></div>}
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
      {!slots.isFetching && slots.data?.map((slot) => <Button key={slot.slot_at} variant={selectedAt === slot.slot_at ? 'default' : 'outline'} disabled={!slot.available}
        onClick={() => { setSelectedAt(slot.slot_at); onSelect(slot); }}>{slot.slot_time}{!slot.available && ' · Esgotado'}</Button>)}
    </div>
    {date && !slots.isFetching && slots.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum horário disponível neste dia.</p>}
  </div>;
}