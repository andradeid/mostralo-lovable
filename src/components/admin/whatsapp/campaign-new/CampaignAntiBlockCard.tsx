// Anti-bloqueio.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, X } from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignAntiBlockCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { form, setForm, formatTime } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configurações Anti-Bloqueio
          </CardTitle>
          <CardDescription>
            Pausas estratégicas para evitar detecção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pause_enabled"
              checked={form.pause_enabled}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, pause_enabled: !!checked }))}
            />
            <label
              htmlFor="pause_enabled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ativar pausas por lote
            </label>
          </div>

          {form.pause_enabled && (
            <>
              <div className="space-y-2">
                <Label>Pausar a cada X mensagens</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[form.pause_after_messages]}
                    onValueChange={([v]) => setForm(prev => ({ ...prev, pause_after_messages: v }))}
                    min={5}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-24 text-right">{form.pause_after_messages} msgs</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duração da pausa</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[form.pause_duration_seconds]}
                    onValueChange={([v]) => setForm(prev => ({ ...prev, pause_duration_seconds: v }))}
                    min={30}
                    max={300}
                    step={10}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">{formatTime(form.pause_duration_seconds)}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  📌 A cada <strong>{form.pause_after_messages} envios</strong>, o sistema pausará por <strong>{formatTime(form.pause_duration_seconds)}</strong>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
