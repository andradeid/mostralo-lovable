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
      <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Gatilho de Ativação</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Defina quando o bot deve responder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        <RadioGroup
          value={config.trigger_type}
          onValueChange={(value) => onUpdate({ trigger_type: value })}
          disabled={disabled}
          className="space-y-2"
        >
          <div className="flex items-start space-x-2 p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="all" id="trigger-all" className="mt-0.5" />
            <Label htmlFor="trigger-all" className="flex-1 cursor-pointer">
              <span className="font-medium text-sm">Todas as Mensagens</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Bot responde a qualquer mensagem recebida
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-2 p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="keyword" id="trigger-keyword" className="mt-0.5" />
            <Label htmlFor="trigger-keyword" className="flex-1 cursor-pointer">
              <span className="font-medium text-sm">Palavras-chave Específicas</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Bot responde apenas quando detectar palavras-chave
              </p>
            </Label>
          </div>
        </RadioGroup>

        {config.trigger_type === 'keyword' && (
          <div className="space-y-2 pl-3 sm:pl-4 border-l-2 border-primary/30">
            <Label htmlFor="trigger-value" className="text-sm">Palavras-chave</Label>
            <Input
              id="trigger-value"
              value={config.trigger_value}
              onChange={(e) => onUpdate({ trigger_value: e.target.value })}
              placeholder="oi, olá, cardápio, menu, preços"
              disabled={disabled}
              className="text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Separe múltiplas palavras por vírgula
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
