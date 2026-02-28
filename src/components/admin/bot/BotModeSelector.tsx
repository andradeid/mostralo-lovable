import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Cpu, Zap, Sparkles, AlertCircle, MessageCircle } from "lucide-react";

export type BotModeType = 'chat_completion' | 'assistant' | 'conversational';

interface BotModeSelectorProps {
  mode: BotModeType;
  onModeChange: (mode: BotModeType) => void;
  disabled?: boolean;
  productCount?: number;
}

export function BotModeSelector({ 
  mode, 
  onModeChange, 
  disabled = false,
  productCount = 0,
}: BotModeSelectorProps) {
  const showRecommendation = productCount > 200;

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          Modo do Assistente
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground break-words">
          Escolha o modo de funcionamento do assistente IA
        </p>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        {showRecommendation && (
          <div className="flex items-start gap-2 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Recomendamos o modo Inteligente v2
              </span>
              <p className="text-muted-foreground mt-0.5">
                Você tem {productCount.toLocaleString()} produtos. O modo v2 é mais eficiente para catálogos grandes.
              </p>
            </div>
          </div>
        )}

        <RadioGroup
          value={mode}
          onValueChange={(value) => onModeChange(value as BotModeType)}
          disabled={disabled}
          className="space-y-2 sm:space-y-3"
        >
          {/* Modo Simples */}
          <div className="relative">
            <RadioGroupItem
              value="chat_completion"
              id="mode-simple"
              className="peer sr-only"
            />
            <Label
              htmlFor="mode-simple"
              className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all
                peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                hover:bg-muted/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              <div className="shrink-0 mt-0.5">
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm sm:text-base">Simples</span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    Até 200 produtos
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Catálogo enviado no prompt. Configuração rápida, ideal para lojas pequenas.
                </p>
              </div>
            </Label>
          </div>

          {/* Modo Inteligente v2 */}
          <div className="relative">
            <RadioGroupItem
              value="assistant"
              id="mode-assistant"
              className="peer sr-only"
            />
            <Label
              htmlFor="mode-assistant"
              className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all
                peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                hover:bg-muted/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              <div className="shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm sm:text-base">Inteligente v2</span>
                  <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] sm:text-xs border-0">
                    Catálogos grandes
                  </Badge>
                  {showRecommendation && (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-[10px] sm:text-xs border-0">
                      Recomendado
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Consultas em tempo real ao banco. Estoque atualizado, links dinâmicos, recomendações personalizadas.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Estoque em tempo real</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Links dos produtos</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Recomendações</span>
                </div>
              </div>
            </Label>
          </div>
          {/* Modo Conversacional */}
          <div className="relative">
            <RadioGroupItem
              value="conversational"
              id="mode-conversational"
              className="peer sr-only"
            />
            <Label
              htmlFor="mode-conversational"
              className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all
                peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                hover:bg-muted/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              <div className="shrink-0 mt-0.5">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm sm:text-base">Conversacional</span>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-[10px] sm:text-xs border-0">
                    Atendimento informal
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Conversa natural sem links. Coleta pedido via perguntas. Recebe localização do cliente para calcular entrega.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Sem links</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Fotos dos produtos</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Genéricos</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-muted">✓ Localização GPS</span>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
