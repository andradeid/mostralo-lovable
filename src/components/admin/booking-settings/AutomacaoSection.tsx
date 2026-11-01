// Aba Automação: status automático e opções gerais.
// JSX movido da BookingSettingsPage sem mudança.
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tip, TRow, SectionTitle } from './SettingsFields';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface AutomacaoSectionProps {
  formData: BookingSettingsForm;
  setFormData: React.Dispatch<React.SetStateAction<BookingSettingsForm>>;
  updateField: UpdateBookingSettingsField;
}

export function AutomacaoSection({ formData, setFormData, updateField }: AutomacaoSectionProps) {
  return (
    <div>
      <SectionTitle title="Automação e Opções Gerais" description="Configure comportamentos automáticos do sistema" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-sm font-medium mb-2">Automação de status</p>
          <TRow
            id="auto_status_enabled"
            label="Ativar automação de status"
            tip="No horário marcado o atendimento vira Em atendimento e, depois do fim + os minutos abaixo, Concluído. Funciona mesmo com a agenda fechada (verifica a cada 5 minutos)."
            checked={formData.auto_status_enabled}
            onChange={(checked) => setFormData(prev => ({ ...prev, auto_status_enabled: checked }))}
          />
          {formData.auto_status_enabled && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Label className="text-sm text-muted-foreground">Concluir após</Label>
              <Input type="number" value={formData.auto_complete_minutes} onChange={(e) => setFormData(prev => ({ ...prev, auto_complete_minutes: Number(e.target.value) }))} min={5} max={60} className="w-20 h-9" />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-sm font-medium mb-2">Opções gerais</p>
          <TRow
            id="allow_any_professional"
            label='Permitir "qualquer profissional"'
            tip="Permite que o cliente escolha 'qualquer profissional disponível'"
            checked={formData.allow_any_professional}
            onChange={(checked) => updateField('allow_any_professional', checked)}
          />
          <TRow
            id="show_subscription_plans"
            label="Exibir planos de assinatura"
            tip="Mostra banner na página de agendamento sobre planos do Clube"
            checked={formData.show_subscription_plans}
            onChange={(checked) => updateField('show_subscription_plans', checked)}
          />
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Limite para cancelamento</Label>
              <Tip text="Até quantas horas antes o cliente pode cancelar" />
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={168} value={formData.cancellation_hours_limit} onChange={(e) => updateField('cancellation_hours_limit', Number(e.target.value))} className="w-20 h-9" />
              <span className="text-sm text-muted-foreground">h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
