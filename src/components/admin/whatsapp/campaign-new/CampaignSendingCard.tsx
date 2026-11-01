// Configuração de envio.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Timer } from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignSendingCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { form, setForm, formatTime } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Configuração de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Intervalo entre mensagens</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[form.message_interval_seconds]}
                onValueChange={([v]) => setForm(prev => ({ ...prev, message_interval_seconds: v }))}
                min={10}
                max={300}
                step={5}
                className="flex-1"
              />
              <span className="w-20 text-right font-medium">{formatTime(form.message_interval_seconds)}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Envios entre {formatTime(Math.floor(form.message_interval_seconds * 0.75))} e {formatTime(form.message_interval_seconds)} (humanizado)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Limite diário de envios</Label>
            <Input
              type="number"
              min="1"
              max="500"
              value={form.daily_limit}
              onChange={(e) => setForm(prev => ({ ...prev, daily_limit: parseInt(e.target.value) || 100 }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora início</Label>
              <Select
                value={String(form.start_hour)}
                onValueChange={(v) => setForm(prev => ({ ...prev, start_hour: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hora fim</Label>
              <Select
                value={String(form.end_hour)}
                onValueChange={(v) => setForm(prev => ({ ...prev, end_hour: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
