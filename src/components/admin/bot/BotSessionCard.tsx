import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotSessionCardProps {
  config: BotConfig;
  onUpdate: (updates: Partial<BotConfig>) => void;
  disabled?: boolean;
}

export function BotSessionCard({ config, onUpdate, disabled }: BotSessionCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <CardTitle className="text-base sm:text-lg">Sessão e Encerramento</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm break-words hyphens-auto">
          Configure duração da sessão e finalização
        </CardDescription>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="expire-minutes" className="text-sm">Expiração (min)</Label>
            <Input
              id="expire-minutes"
              type="number"
              min={1}
              max={1440}
              value={config.expire_minutes}
              onChange={(e) => onUpdate({ expire_minutes: parseInt(e.target.value) || 20 })}
              disabled={disabled}
              className="text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Inatividade até reiniciar
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="keyword-finish" className="text-sm">Palavra de Encerramento</Label>
            <Input
              id="keyword-finish"
              value={config.keyword_finish}
              onChange={(e) => onUpdate({ keyword_finish: e.target.value })}
              placeholder="#SAIR"
              disabled={disabled}
              className="text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Cliente digita para finalizar
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor="keep-open" className="text-sm">Manter Sessão Aberta</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Sessão não expira por inatividade
            </p>
          </div>
          <Switch
            id="keep-open"
            checked={config.keep_open}
            onCheckedChange={(checked) => onUpdate({ keep_open: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="unknown-message" className="text-sm">Mensagem de Não Entendimento</Label>
          <Textarea
            id="unknown-message"
            value={config.unknown_message}
            onChange={(e) => onUpdate({ unknown_message: e.target.value })}
            placeholder="Desculpe, não entendi..."
            rows={2}
            disabled={disabled}
            className="text-sm"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
            Exibida quando o bot não consegue processar
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
