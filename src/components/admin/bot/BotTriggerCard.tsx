import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, HelpCircle } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotTriggerCardProps {
  config: BotConfig;
  onUpdate: (updates: Partial<BotConfig>) => void;
  disabled?: boolean;
}

export function BotTriggerCard({ config, onUpdate, disabled }: BotTriggerCardProps) {
  return (
    <Card className="border-amber-500/30">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
          </div>
          <CardTitle className="text-base sm:text-lg">Gatilho de Ativação</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-amber-500 transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-semibold text-amber-500 flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5" />
                  Filtro de Ativação
                </p>
                <p className="text-xs leading-relaxed">
                  Define <strong>QUANDO</strong> o bot responde. Funciona como um filtro: 
                  se configurado para "Palavras-chave", o bot <strong>ignora</strong> mensagens 
                  que não contenham essas palavras.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs sm:text-sm break-words hyphens-auto">
          Define quando o bot deve responder (filtro)
        </CardDescription>
      </CardHeader>
      <CardContent className="!p-3 !pt-3 sm:!p-6 sm:!pt-4 space-y-3 sm:space-y-4">
        <RadioGroup
          value={config.trigger_type}
          onValueChange={(value) => onUpdate({ trigger_type: value })}
          disabled={disabled}
          className="space-y-2"
        >
          <div className="flex items-start space-x-2 p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
            <RadioGroupItem value="all" id="trigger-all" className="mt-0.5 shrink-0" />
            <Label htmlFor="trigger-all" className="flex-1 cursor-pointer min-w-0">
              <span className="font-medium text-sm">Todas as Mensagens</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 break-words">
                Bot responde a qualquer mensagem recebida
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-2 p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
            <RadioGroupItem value="keyword" id="trigger-keyword" className="mt-0.5 shrink-0" />
            <Label htmlFor="trigger-keyword" className="flex-1 cursor-pointer min-w-0">
              <span className="font-medium text-sm">Palavras-chave Específicas</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 break-words">
                Bot responde apenas quando detectar palavras-chave
              </p>
            </Label>
          </div>
        </RadioGroup>

        {config.trigger_type === 'keyword' && (
          <div className="space-y-2 pl-3 sm:pl-4 border-l-2 border-amber-500/30">
            <Label htmlFor="trigger-value" className="text-sm">Palavras-chave</Label>
            <Input
              id="trigger-value"
              value={config.trigger_value}
              onChange={(e) => onUpdate({ trigger_value: e.target.value })}
              placeholder="oi, olá, cardápio, menu, preços"
              disabled={disabled}
              className="text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Separe múltiplas palavras por vírgula
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
