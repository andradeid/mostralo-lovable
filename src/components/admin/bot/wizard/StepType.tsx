import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssistantType, TYPE_PRESETS } from "./types";
import { Shield, ShoppingCart, Headphones, Settings } from "lucide-react";

interface StepTypeProps {
  value: AssistantType;
  onChange: (type: AssistantType) => void;
}

const typeIcons: Record<AssistantType, React.ReactNode> = {
  triage: <Shield className="h-6 w-6 text-teal-500" />,
  sales: <ShoppingCart className="h-6 w-6 text-green-500" />,
  support: <Headphones className="h-6 w-6 text-blue-500" />,
  custom: <Settings className="h-6 w-6 text-purple-500" />,
};

const typeLabels: Record<AssistantType, string> = {
  triage: 'Triagem / Recepção',
  sales: 'Vendas',
  support: 'Suporte',
  custom: 'Personalizado',
};

const typeBadges: Record<AssistantType, { label: string; className: string }> = {
  triage: { label: 'Não vende', className: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-0' },
  sales: { label: 'Fecha pedido', className: 'bg-green-500/20 text-green-700 dark:text-green-300 border-0' },
  support: { label: 'Pós-venda', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-0' },
  custom: { label: 'Total controle', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-0' },
};

export function StepType({ value, onChange }: StepTypeProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm sm:text-base font-semibold">Qual o objetivo do assistente?</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Isso define as regras padrão e ferramentas habilitadas
        </p>
      </div>

      <div className="grid gap-2 sm:gap-3">
        {(Object.keys(TYPE_PRESETS) as AssistantType[]).map((type) => {
          const preset = TYPE_PRESETS[type];
          const isSelected = value === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="shrink-0 mt-0.5">{typeIcons[type]}</div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm sm:text-base">{typeLabels[type]}</span>
                  <Badge className={`text-[10px] sm:text-xs ${typeBadges[type].className}`}>
                    {typeBadges[type].label}
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  {preset.description}
                </p>
              </div>
              {isSelected && (
                <div className="shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
