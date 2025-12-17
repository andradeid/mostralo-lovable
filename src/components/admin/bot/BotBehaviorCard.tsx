import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, HelpCircle, Timer, Clock } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotBehaviorCardProps {
  config: BotConfig;
  onUpdate: (updates: Partial<BotConfig>) => void;
  disabled?: boolean;
}

export function BotBehaviorCard({ config, onUpdate, disabled }: BotBehaviorCardProps) {
  // Formatar tempo de reativação para exibição
  const formatReactivateTime = (minutes: number) => {
    if (minutes === 0) return 'Manual';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

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

        {/* Campo de Reativação Automática - só aparece se stop_bot_from_me estiver ativo */}
        {config.stop_bot_from_me && (
          <div className="space-y-2 sm:space-y-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-primary shrink-0" />
                <Label className="text-sm min-w-0">Reativar Bot Após</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <p className="font-semibold mb-1">⏰ Reativação Automática</p>
                      <p className="text-xs leading-relaxed">
                        Após você responder manualmente, o bot ficará <strong>pausado permanentemente</strong> para aquele cliente.
                        <br /><br />
                        Defina o tempo para reativação automática ou deixe em <strong>0 (Manual)</strong> para reativar apenas pelo painel.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs sm:text-sm font-medium shrink-0 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatReactivateTime(config.auto_reactivate_minutes || 0)}
              </span>
            </div>
            <Slider
              value={[config.auto_reactivate_minutes || 0]}
              onValueChange={([value]) => onUpdate({ auto_reactivate_minutes: value })}
              min={0}
              max={120}
              step={5}
              disabled={disabled}
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              0 = Reativação manual apenas | 5-120 = Minutos até reativar automaticamente
            </p>
          </div>
        )}

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
            <div className="flex items-center gap-1.5">
              <Label className="text-sm min-w-0">Delay entre Mensagens</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-semibold mb-1">⏱️ Delay de Resposta</p>
                    <p className="text-xs leading-relaxed">
                      Tempo que o bot aguarda antes de enviar a resposta. 
                      Um delay maior (3-4s) permite que o WhatsApp <strong>gere preview de links</strong> corretamente.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
            <div className="flex items-center gap-1.5">
              <Label className="text-sm min-w-0">Tempo de Debounce</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-semibold mb-1">⏳ Debounce</p>
                    <p className="text-xs leading-relaxed">
                      Se o cliente enviar <strong>várias mensagens seguidas</strong>, o bot aguarda 
                      esse tempo para responder tudo de uma vez, evitando respostas fragmentadas.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor="split-messages" className="text-sm">Dividir Mensagens</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Divide respostas longas em múltiplas mensagens
            </p>
          </div>
          <Switch
            id="split-messages"
            checked={config.split_messages}
            onCheckedChange={(checked) => onUpdate({ split_messages: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm min-w-0">Tempo por Caractere</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-semibold mb-1">⌨️ Simulação de Digitação</p>
                    <p className="text-xs leading-relaxed">
                      Adiciona um delay proporcional ao tamanho da mensagem, 
                      simulando digitação humana mais <strong>realista</strong>. Use 0 para desativar.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xs sm:text-sm font-medium shrink-0">{config.time_per_char}ms</span>
          </div>
          <Slider
            value={[config.time_per_char]}
            onValueChange={([value]) => onUpdate({ time_per_char: value })}
            min={0}
            max={100}
            step={5}
            disabled={disabled}
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
            Simula digitação mais realista (0 = desativado)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
