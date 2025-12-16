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
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <CardTitle className="text-base sm:text-lg">Comportamento</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm break-words hyphens-auto">
          Configure como o bot responde às mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor="stop-from-me" className="text-sm">Pausar ao Responder</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Bot pausa quando você responde manualmente
            </p>
          </div>
          <Switch
            id="stop-from-me"
            checked={config.stop_bot_from_me}
            onCheckedChange={(checked) => onUpdate({ stop_bot_from_me: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor="listening-from-me" className="text-sm">Ouvir Próprias Mensagens</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Bot também processa mensagens enviadas por você
            </p>
          </div>
          <Switch
            id="listening-from-me"
            checked={config.listening_from_me}
            onCheckedChange={(checked) => onUpdate({ listening_from_me: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm min-w-0">Delay entre Mensagens</Label>
            <span className="text-xs sm:text-sm font-medium shrink-0">{(config.delay_message / 1000).toFixed(1)}s</span>
          </div>
          <Slider
            value={[config.delay_message]}
            onValueChange={([value]) => onUpdate({ delay_message: value })}
            min={500}
            max={5000}
            step={100}
            disabled={disabled}
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
            Tempo de espera antes de responder (simula digitação)
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm min-w-0">Tempo de Debounce</Label>
            <span className="text-xs sm:text-sm font-medium shrink-0">{config.debounce_time}s</span>
          </div>
          <Slider
            value={[config.debounce_time]}
            onValueChange={([value]) => onUpdate({ debounce_time: value })}
            min={1}
            max={30}
            step={1}
            disabled={disabled}
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
            Aguarda mais mensagens antes de responder
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
