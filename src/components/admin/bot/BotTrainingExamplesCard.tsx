import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, HelpCircle, MessageCircle, Bot } from "lucide-react";

interface BotTrainingExamplesCardProps {
  storeName?: string;
  storeSlug?: string;
  menuLink?: string;
}

export function BotTrainingExamplesCard({ storeName, storeSlug, menuLink }: BotTrainingExamplesCardProps) {
  const userExamples = ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia'];
  
  // Gera o link do cardápio
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin.includes('localhost') || window.location.origin.includes('lovable.app')
      ? 'https://mostralo.com.br'
      : window.location.origin
    : 'https://mostralo.com.br';
  
  const cardapioLink = menuLink || (storeSlug ? `${baseUrl}/loja/${storeSlug}` : `${baseUrl}/loja/sua-loja`);
  
  const assistantExample = `Olá! 👋 Bem-vindo(a) à ${storeName || 'nossa loja'}!

Confira nosso cardápio completo: ${cardapioLink}

Estou aqui para ajudar! 😊`;

  return (
    <Card className="overflow-hidden border-blue-500/30">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3 bg-blue-500/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
          </div>
          <CardTitle className="text-base sm:text-lg">Exemplos de Treinamento</CardTitle>
          <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
            SOMENTE LEITURA
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-blue-500 transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-semibold text-blue-500 flex items-center gap-1.5 mb-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Exemplos de Treinamento
                </p>
                <p className="text-xs leading-relaxed">
                  Estes exemplos ensinam ao bot <strong>COMO</strong> responder. 
                  <strong className="text-blue-500"> Não são filtros</strong> - são modelos de conversa 
                  que o bot usa para aprender o estilo de resposta esperado.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs sm:text-sm break-words hyphens-auto">
          Exemplos usados para ensinar o bot a responder
        </CardDescription>
      </CardHeader>
      <CardContent className="!p-3 !pt-3 sm:!p-6 sm:!pt-4 space-y-4">
        {/* Mensagens do Usuário */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Mensagens do Usuário</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p className="text-xs leading-relaxed">
                    Exemplos de como clientes costumam iniciar conversas. 
                    O bot usa esses exemplos para <strong>reconhecer padrões</strong> de saudação 
                    e responder de forma consistente.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userExamples.map((example, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-muted/50"
              >
                "{example}"
              </Badge>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 Exemplos de como clientes iniciam conversas
          </p>
        </div>

        {/* Divisor */}
        <div className="border-t border-dashed" />

        {/* Mensagens do Assistente */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Mensagem do Assistente</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p className="text-xs leading-relaxed">
                    Modelo de resposta inicial que o bot aprende. 
                    Inclui <strong>saudação personalizada</strong> e <strong>link do cardápio</strong> 
                    para direcionar clientes ao seu menu online.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
              {assistantExample}
            </pre>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 Exemplo de como o bot deve responder saudações
          </p>
        </div>

        {/* Nota explicativa */}
        <div className="p-2.5 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">📚 Como funciona:</strong> Estes exemplos são 
            enviados à IA como "few-shot learning" - o bot aprende o padrão de conversa 
            e reproduz o estilo nas respostas. Não são filtros de ativação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
