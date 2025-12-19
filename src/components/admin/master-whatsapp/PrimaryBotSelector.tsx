import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MessageSquare, Users, HelpCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryBotType } from "@/hooks/useMasterWhatsAppConfig";

interface PrimaryBotSelectorProps {
  value: PrimaryBotType;
  onChange: (value: PrimaryBotType) => void;
  disabled?: boolean;
}

const botOptions: { 
  value: PrimaryBotType; 
  label: string; 
  icon: typeof MessageSquare; 
  description: string; 
  color: string;
}[] = [
  { 
    value: 'sales', 
    label: 'Vendas', 
    icon: MessageSquare, 
    description: 'Atende leads interessados na plataforma',
    color: 'text-green-500'
  },
  { 
    value: 'recruitment', 
    label: 'Recrutamento', 
    icon: Users, 
    description: 'Recruta vendedores e afiliados',
    color: 'text-blue-500'
  },
  { 
    value: 'support', 
    label: 'Suporte', 
    icon: HelpCircle, 
    description: 'Responde dúvidas e ajuda clientes',
    color: 'text-purple-500'
  },
];

export function PrimaryBotSelector({ value, onChange, disabled }: PrimaryBotSelectorProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-base sm:text-lg">Bot Principal Ativo</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Limitação da Evolution API: apenas <strong>1 bot</strong> pode estar ativo por instância WhatsApp.
          Selecione qual bot será sincronizado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {botOptions.map((option) => {
            const isSelected = value === option.value;
            const Icon = option.icon;
            
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isSelected 
                    ? "border-primary bg-primary/10 shadow-sm" 
                    : "border-muted bg-background hover:bg-muted/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSelected && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </Badge>
                )}
                <Icon className={cn("w-8 h-8 mb-2", option.color)} />
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
