// Agendamento.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, Calendar, CalendarClock } from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignScheduleCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { form, setForm } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Quando enviar?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={form.schedule_type}
            onValueChange={(v) => setForm(prev => ({ ...prev, schedule_type: v as 'now' | 'scheduled' }))}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="now" id="now" />
              <label htmlFor="now" className="text-sm font-medium cursor-pointer">
                Enviar agora
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <label htmlFor="scheduled" className="text-sm font-medium cursor-pointer">
                Agendar para depois
              </label>
            </div>
          </RadioGroup>

          {form.schedule_type === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Data
                </Label>
                <Input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Hora
                </Label>
                <Input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>
          )}

          {form.schedule_type === 'scheduled' && form.scheduled_date && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                📅 A campanha será iniciada automaticamente em{' '}
                <strong className="text-foreground">
                  {new Date(form.scheduled_date + 'T' + form.scheduled_time).toLocaleDateString('pt-BR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric' 
                  })} às {form.scheduled_time}
                </strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
