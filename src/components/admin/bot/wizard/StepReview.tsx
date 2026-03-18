import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WizardData, TYPE_PRESETS, AVAILABLE_TOOLS } from "./types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface StepReviewProps {
  data: WizardData;
  nicheName?: string | null;
}

const personalityLabels = {
  professional: 'Profissional',
  friendly: 'Amigável',
  fun: 'Divertido',
  consultive: 'Consultivo',
};

const emojiLabels = {
  none: 'Sem emojis',
  moderate: 'Moderado',
  abundant: 'Abundante',
};

const typeLabels = {
  triage: 'Triagem / Recepção',
  sales: 'Vendas',
  support: 'Suporte',
  custom: 'Personalizado',
};

const ruleLabels: Record<string, string> = {
  block_prices: '🚫💰 Bloquear preços',
  block_photos: '🚫📷 Bloquear fotos',
  allow_upsell: '📈 Permitir upsell',
  suggest_generic: '💊 Sugerir genérico',
  ask_specification: '❓ Pedir especificação',
  suggest_store_link: '🌐 Sugerir loja virtual',
  send_link_on_greeting: '📨 Enviar link na saudação',
  require_prescription_check: '📋 Verificar receita',
};

export function StepReview({ data }: StepReviewProps) {
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const preset = TYPE_PRESETS[data.assistantType];
  const enabledRules = Object.entries(data.rules).filter(([_, v]) => v);
  const disabledRules = Object.entries(data.rules).filter(([_, v]) => !v);
  const tools = AVAILABLE_TOOLS.filter(t => data.enabledTools.includes(t.id));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-semibold">Revisão Final</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Confirme as configurações antes de criar o assistente
        </p>
      </div>

      {/* Tipo */}
      <Card className="border-primary/30">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{preset.icon}</span>
            <div>
              <span className="font-semibold text-sm">{typeLabels[data.assistantType]}</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{preset.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identidade */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identidade</h4>
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{data.identity.name || 'Assistente Virtual'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Personalidade:</span>
            <span className="font-medium">{personalityLabels[data.identity.personality]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Emojis:</span>
            <span className="font-medium">{emojiLabels[data.identity.emojiLevel]}</span>
          </div>
          {data.identity.greeting && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saudação:</span>
              <span className="font-medium text-right max-w-[60%] truncate">{data.identity.greeting}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ferramentas */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Ferramentas ({tools.length})
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {tools.map(tool => (
            <Badge key={tool.id} variant="secondary" className="text-[10px] sm:text-xs gap-1">
              {tool.icon} {tool.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Regras ativas */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regras</h4>
        <div className="space-y-1">
          {enabledRules.length > 0 ? (
            enabledRules.map(([key]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span>{ruleLabels[key]}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma regra ativa</p>
          )}
        </div>
      </div>

      {/* Info da loja */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Info da Loja</h4>
        <div className="flex flex-wrap gap-1.5">
          {data.storeInfo.includeLocation && <Badge variant="outline" className="text-[10px]">📍 Localização</Badge>}
          {data.storeInfo.includeBusinessHours && <Badge variant="outline" className="text-[10px]">🕐 Horário</Badge>}
          {data.storeInfo.includePaymentMethods && <Badge variant="outline" className="text-[10px]">💳 Pagamento</Badge>}
          {data.storeInfo.includeDeliveryFee && <Badge variant="outline" className="text-[10px]">🚚 Entrega</Badge>}
          {data.storeInfo.includeMinOrder && <Badge variant="outline" className="text-[10px]">💵 Pedido mínimo</Badge>}
        </div>
      </div>

      {data.customInstructions && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instruções Extras</h4>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
            {data.customInstructions}
          </div>
        </div>
      )}
    </div>
  );
}
