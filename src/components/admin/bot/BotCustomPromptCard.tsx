import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Lightbulb } from "lucide-react";

interface BotCustomPromptCardProps {
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
  disabled?: boolean;
}

export function BotCustomPromptCard({ 
  instructions, 
  onInstructionsChange, 
  disabled = false 
}: BotCustomPromptCardProps) {
  const examples = [
    "Quando cliente pedir recomendação, sempre sugira: Vitamina C, Omega 3 e Protetor Solar.",
    "Se perguntar sobre antibiótico, informe que precisa de receita médica.",
    "Sempre mencione que temos farmacêutico de plantão.",
    "Ofereça frete grátis para compras acima de R$ 150.",
  ];

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileEdit className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          Instruções Personalizadas
          <Badge variant="secondary" className="text-[10px] sm:text-xs ml-auto">
            Modo v2
          </Badge>
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground break-words">
          Adicione regras específicas para o assistente da sua loja
        </p>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-instructions" className="text-sm font-medium">
            Instruções adicionais
          </Label>
          <Textarea
            id="custom-instructions"
            placeholder="Digite instruções específicas para o assistente..."
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            disabled={disabled}
            className="min-h-[120px] sm:min-h-[150px] text-sm resize-none"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Estas instruções serão adicionadas ao prompt padrão do assistente.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Exemplos de instruções
          </div>
          <div className="space-y-1.5">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  const newInstructions = instructions 
                    ? `${instructions}\n${example}` 
                    : example;
                  onInstructionsChange(newInstructions);
                }}
                disabled={disabled}
                className="w-full text-left p-2 rounded-md bg-muted/50 hover:bg-muted text-[10px] sm:text-xs 
                  text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 
                  disabled:cursor-not-allowed"
              >
                + {example}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
