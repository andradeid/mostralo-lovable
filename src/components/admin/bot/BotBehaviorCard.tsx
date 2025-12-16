import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings2 } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotBehaviorCardProps {
  config: BotConfig;
  onUpdate: (updates: Partial<BotConfig>) => void;
  disabled?: boolean;
}

export function BotBehaviorCard({ config, onUpdate, disabled }: BotBehaviorCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Comportamento</CardTitle>
        </div>
        <CardDescription>
          Configure como o bot responde às mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stop-from-me">Pausar ao Responder</Label>
            <p className="text-xs text-muted-foreground">
              Bot pausa quando você responde manualmente
            </p>
          </div>
          <Switch
            id="stop-from-me"
            checked={config.stop_bot_from_me}
            onCheckedChange={(checked) => onUpdate({ stop_bot_from_me: checked })}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="listening-from-me">Ouvir Próprias Mensagens</Label>
            <p className="text-xs text-muted-foreground">
              Bot também processa mensagens enviadas por você
            </p>
          </div>
          <Switch
            id="listening-from-me"
            checked={config.listening_from_me}
            onCheckedChange={(checked) => onUpdate({ listening_from_me: checked })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Delay entre Mensagens</Label>
            <span className="text-sm font-medium">{(config.delay_message / 1000).toFixed(1)}s</span>
          </div>
          <Slider
            value={[config.delay_message]}
            onValueChange={([value]) => onUpdate({ delay_message: value })}
            min={500}
            max={5000}
            step={100}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Tempo de espera antes de responder (simula digitação)
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Tempo de Debounce</Label>
            <span className="text-sm font-medium">{config.debounce_time}s</span>
          </div>
          <Slider
            value={[config.debounce_time]}
            onValueChange={([value]) => onUpdate({ debounce_time: value })}
            min={1}
            max={30}
            step={1}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Aguarda mais mensagens antes de responder (evita respostas fragmentadas)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
