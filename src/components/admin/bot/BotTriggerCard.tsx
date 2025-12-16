import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotTriggerCardProps {
  config: BotConfig;
  onUpdate: (updates: Partial<BotConfig>) => void;
  disabled?: boolean;
}

export function BotTriggerCard({ config, onUpdate, disabled }: BotTriggerCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Gatilho de Ativação</CardTitle>
        </div>
        <CardDescription>
          Defina quando o bot deve responder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={config.trigger_type}
          onValueChange={(value) => onUpdate({ trigger_type: value })}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="all" id="trigger-all" />
            <Label htmlFor="trigger-all" className="flex-1 cursor-pointer">
              <span className="font-medium">Todas as Mensagens</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bot responde a qualquer mensagem recebida
              </p>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="keyword" id="trigger-keyword" />
            <Label htmlFor="trigger-keyword" className="flex-1 cursor-pointer">
              <span className="font-medium">Palavras-chave Específicas</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bot responde apenas quando detectar palavras-chave
              </p>
            </Label>
          </div>
        </RadioGroup>

        {config.trigger_type === 'keyword' && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/30">
            <Label htmlFor="trigger-value">Palavras-chave</Label>
            <Input
              id="trigger-value"
              value={config.trigger_value}
              onChange={(e) => onUpdate({ trigger_value: e.target.value })}
              placeholder="oi, olá, cardápio, menu, preços"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Separe múltiplas palavras por vírgula. O bot ativa quando qualquer uma for detectada.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
