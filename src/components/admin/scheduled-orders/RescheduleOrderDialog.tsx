import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SchedulePicker } from './SchedulePicker';
import { scheduleRpc, scheduledLabel, type ScheduleSlot } from '@/lib/scheduledOrders';
import { toast } from 'sonner';

export interface RescheduleOrderDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  order: { id: string; store_id: string; delivery_type: string };
  notify?: boolean; onSuccess: (at: string) => void;
}
export function RescheduleOrderDialog({ open, onOpenChange, order, notify = true, onSuccess }: RescheduleOrderDialogProps) {
  const [slot, setSlot] = useState<ScheduleSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const save = async () => {
    if (!slot || saving) return;
    setSaving(true);
    try {
      await scheduleRpc('reschedule_scheduled_order', { p_order_id: order.id, p_new_at: slot.slot_at, p_notify: notify });
      onSuccess(slot.slot_at);
      if (notify) toast.success(`Encomenda remarcada para ${scheduledLabel(slot.slot_at)}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remarcar a encomenda');
      setSlot(null);
      void queryClient.invalidateQueries({ queryKey: ['reschedule-days'] });
      void queryClient.invalidateQueries({ queryKey: ['reschedule-slots'] });
    } finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={(next) => { setSlot(null); onOpenChange(next); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
    <DialogHeader><DialogTitle>Mudar data/horário</DialogTitle></DialogHeader>
    {open && <SchedulePicker storeId={order.store_id} orderId={order.id} deliveryType={order.delivery_type} onSelect={setSlot} />}
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Voltar</Button><Button onClick={save} disabled={!slot || saving}>{saving ? 'Salvando...' : notify ? 'Remarcar e avisar cliente' : 'Salvar horário'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}