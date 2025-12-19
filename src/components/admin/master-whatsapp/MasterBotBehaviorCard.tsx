import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, HelpCircle, Timer, Clock } from "lucide-react";
import { BotBehaviorConfig } from "@/hooks/useMasterWhatsAppConfig";

interface MasterBotBehaviorCardProps {
  config: BotBehaviorConfig;
  onUpdate: (updates: Partial<BotBehaviorConfig>) => void;
  disabled?: boolean;
  botType: 'sales' | 'recruitment' | 'support';
}

export function MasterBotBehaviorCard({ config, onUpdate, disabled, botType }: MasterBotBehaviorCardProps) {
  // Formatar tempo de expiração para exibição
  const formatExpireTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const botLabels = {
    sales: 'Vendas',
    recruitment: 'Recrutamento',
    support: 'Suporte'
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <CardTitle className="text-base sm:text-lg">Comportamento do Bot</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm break-words hyphens-auto">
          Configure como o bot de {botLabels[botType]} responde às mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-4 sm:space-y-6">
        {/* Pausar ao Responder */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor={`stop-from-me-${botType}`} className="text-sm">Pausar ao Responder</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Bot pausa quando você responde manualmente
            </p>
          </div>
          <Switch
            id={`stop-from-me-${botType}`}
            checked={config.stop_bot_from_me}
            onCheckedChange={(checked) => onUpdate({ stop_bot_from_me: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        {/* Ouvir Próprias Mensagens */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor={`listening-from-me-${botType}`} className="text-sm">Ouvir Próprias Mensagens</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Bot também processa mensagens enviadas por você
            </p>
          </div>
          <Switch
            id={`listening-from-me-${botType}`}
            checked={config.listening_from_me}
            onCheckedChange={(checked) => onUpdate({ listening_from_me: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        {/* Delay entre Mensagens */}
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

        {/* Tempo de Debounce */}
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

        {/* Dividir Mensagens */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor={`split-messages-${botType}`} className="text-sm">Dividir Mensagens</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Divide respostas longas em múltiplas mensagens
            </p>
          </div>
          <Switch
            id={`split-messages-${botType}`}
            checked={config.split_messages}
            onCheckedChange={(checked) => onUpdate({ split_messages: checked })}
            disabled={disabled}
            className="shrink-0"
          />
        </div>

        {/* Tempo por Caractere */}
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

        {/* Sessão e Encerramento */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium">Sessão e Encerramento</span>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor={`expire-minutes-${botType}`} className="text-sm">Expiração (min)</Label>
              <Input
                id={`expire-minutes-${botType}`}
                type="number"
                min={1}
                max={1440}
                value={config.expire_minutes}
                onChange={(e) => onUpdate({ expire_minutes: parseInt(e.target.value) || 60 })}
                disabled={disabled}
                className="text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                Inatividade até reiniciar ({formatExpireTime(config.expire_minutes)})
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor={`keyword-finish-${botType}`} className="text-sm">Palavra de Encerramento</Label>
              <Input
                id={`keyword-finish-${botType}`}
                value={config.keyword_finish}
                onChange={(e) => onUpdate({ keyword_finish: e.target.value })}
                placeholder="#sair"
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
              <Label htmlFor={`keep-open-${botType}`} className="text-sm">Manter Sessão Aberta</Label>
              <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                Sessão não expira por inatividade
              </p>
            </div>
            <Switch
              id={`keep-open-${botType}`}
              checked={config.keep_open}
              onCheckedChange={(checked) => onUpdate({ keep_open: checked })}
              disabled={disabled}
              className="shrink-0"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={`unknown-message-${botType}`} className="text-sm">Mensagem de Não Entendimento</Label>
            <Textarea
              id={`unknown-message-${botType}`}
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
        </div>
      </CardContent>
    </Card>
  );
}
