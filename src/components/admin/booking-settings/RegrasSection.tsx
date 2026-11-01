// Aba Regras: intervalo entre horários e antecedências.
// JSX movido da BookingSettingsPage sem mudança.
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tip, SectionTitle } from './SettingsFields';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface RegrasSectionProps {
  formData: BookingSettingsForm;
  updateField: UpdateBookingSettingsField;
}

export function RegrasSection({ formData, updateField }: RegrasSectionProps) {
  return (
    <div>
      <SectionTitle title="Regras de Agendamento" description="Defina intervalos, limites e antecedências" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Intervalo entre horários</Label>
            <Tip text="Intervalo entre cada horário disponível. Ex: 30min = 09:00, 09:30, 10:00..." />
          </div>
          <Select value={String(formData.slot_interval_minutes)} onValueChange={(v) => updateField('slot_interval_minutes', Number(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="20">20 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">60 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Antecedência máxima</Label>
            <Tip text="Quantos dias no futuro o cliente pode agendar" />
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={1} max={365} value={formData.max_advance_days} onChange={(e) => updateField('max_advance_days', Number(e.target.value))} className="w-20 h-9" />
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Antecedência mínima</Label>
            <Tip text="Horas mínimas de antecedência para agendar" />
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={72} value={formData.min_advance_hours} onChange={(e) => updateField('min_advance_hours', Number(e.target.value))} className="w-20 h-9" />
            <span className="text-sm text-muted-foreground">horas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
