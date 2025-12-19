import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, MessageSquare, Users, HelpCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryBotType } from "@/hooks/useMasterWhatsAppConfig";

interface PrimaryBotSelectorProps {
  value: PrimaryBotType;
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

export function PrimaryBotSelector({ value }: PrimaryBotSelectorProps) {
  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base sm:text-lg">Bot Ativo Atualmente</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          O bot ativo é definido automaticamente pela <strong>última sincronização</strong>.
          Para trocar, sincronize outro bot nas abas abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {botOptions.map((option) => {
            const isSelected = value === option.value;
            const Icon = option.icon;
            
            return (
              <div
                key={option.value}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-muted bg-muted/30 opacity-50"
                )}
              >
                {isSelected && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </Badge>
                )}
                <Icon className={cn("w-8 h-8 mb-2", isSelected ? option.color : "text-muted-foreground")} />
                <span className={cn("font-medium text-sm", !isSelected && "text-muted-foreground")}>{option.label}</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {option.description}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
