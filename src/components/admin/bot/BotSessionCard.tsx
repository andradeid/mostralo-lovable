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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Sessão e Encerramento</CardTitle>
        </div>
        <CardDescription>
          Configure duração da sessão e finalização do atendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expire-minutes">Expiração da Sessão (min)</Label>
            <Input
              id="expire-minutes"
              type="number"
              min={1}
              max={1440}
              value={config.expire_minutes}
              onChange={(e) => onUpdate({ expire_minutes: parseInt(e.target.value) || 20 })}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Inatividade até reiniciar conversa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyword-finish">Palavra de Encerramento</Label>
            <Input
              id="keyword-finish"
              value={config.keyword_finish}
              onChange={(e) => onUpdate({ keyword_finish: e.target.value })}
              placeholder="#SAIR"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Cliente digita para finalizar
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="keep-open">Manter Sessão Aberta</Label>
            <p className="text-xs text-muted-foreground">
              Sessão não expira por inatividade
            </p>
          </div>
          <Switch
            id="keep-open"
            checked={config.keep_open}
            onCheckedChange={(checked) => onUpdate({ keep_open: checked })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unknown-message">Mensagem de Não Entendimento</Label>
          <Textarea
            id="unknown-message"
            value={config.unknown_message}
            onChange={(e) => onUpdate({ unknown_message: e.target.value })}
            placeholder="Desculpe, não entendi..."
            rows={2}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Exibida quando o bot não consegue processar a mensagem
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
