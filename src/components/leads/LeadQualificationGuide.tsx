import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Clock, Target, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'lead-qualification-guide-expanded';

export function LeadQualificationGuide() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  return (
    <Card className="mb-4 md:mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 md:p-4 h-auto hover:bg-primary/5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <span className="font-semibold text-sm md:text-lg truncate">Como Qualificar Leads</span>
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs">Guia</Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 md:pb-6 px-3 md:px-6">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Status NOVO */}
              <div className="p-3 md:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500" />
                  <h4 className="font-semibold text-sm md:text-base text-blue-700 dark:text-blue-400">NOVO</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                  Lead acabou de chegar pelo formulário
                </p>
                <ul className="text-xs md:text-sm space-y-0.5 md:space-y-1">
                  <li className="flex items-start gap-1">
                    <Clock className="h-3 w-3 mt-0.5 text-blue-500 shrink-0" />
                    <span>Responda em <strong>até 5 minutos!</strong></span>
                  </li>
                  <li className="flex items-start gap-1">
                    <Target className="h-3 w-3 mt-0.5 text-blue-500 shrink-0" />
                    <span>Verifique se os dados estão completos</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 mt-0.5 text-blue-500 shrink-0" />
                    <span>Mude para "Contactado" após o 1º contato</span>
                  </li>
                </ul>
              </div>

              {/* Status CONTACTADO */}
              <div className="p-3 md:p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                  <h4 className="font-semibold text-sm md:text-base text-yellow-700 dark:text-yellow-400">CONTACTADO</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                  Você já fez o primeiro contato
                </p>
                <ul className="text-xs md:text-sm space-y-0.5 md:space-y-1">
                  <li className="flex items-start gap-1">
                    <Target className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                    <span>Apresentou o Mostralo? Explicou vantagens?</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <BookOpen className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                    <span>Use o <strong>Guia de Prospecção</strong></span>
                  </li>
                  <li className="flex items-start gap-1">
                    <TrendingUp className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                    <span>Mude para "Qualificado" se tem interesse</span>
                  </li>
                </ul>
              </div>

              {/* Status QUALIFICADO */}
              <div className="p-3 md:p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-purple-500" />
                  <h4 className="font-semibold text-sm md:text-base text-purple-700 dark:text-purple-400">QUALIFICADO</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                  Lead demonstrou interesse real de compra
                </p>
                <ul className="text-xs md:text-sm space-y-0.5 md:space-y-1">
                  <li className="flex items-start gap-1">
                    <Target className="h-3 w-3 mt-0.5 text-purple-500 shrink-0" />
                    <span>Quer saber preços? Pediu demo?</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <TrendingUp className="h-3 w-3 mt-0.5 text-purple-500 shrink-0" />
                    <span><strong>FOCO:</strong> Cálculo de economia vs iFood</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 mt-0.5 text-purple-500 shrink-0" />
                    <span>Mude para "Convertido" após fechamento</span>
                  </li>
                </ul>
              </div>

              {/* Status CONVERTIDO */}
              <div className="p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
                  <h4 className="font-semibold text-sm md:text-base text-green-700 dark:text-green-400">CONVERTIDO 🎉</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                  Lead virou cliente!
                </p>
                <ul className="text-xs md:text-sm space-y-0.5 md:space-y-1">
                  <li className="flex items-start gap-1">
                    <Target className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                    <span>Conta criada no sistema</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <TrendingUp className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                    <span>Pagamento confirmado</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                    <span><strong>Comissão calculada automaticamente</strong></span>
                  </li>
                </ul>
              </div>

              {/* Status PERDIDO */}
              <div className="p-3 md:p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <h4 className="font-semibold text-sm md:text-base text-red-700 dark:text-red-400">PERDIDO</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
                  Lead não converteu (por agora)
                </p>
                <ul className="text-xs md:text-sm space-y-0.5 md:space-y-1">
                  <li className="flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 text-red-500 shrink-0" />
                    <span><strong>SEMPRE</strong> registre o motivo nas notas!</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 mt-0.5 text-red-500 shrink-0" />
                    <span>Ex: "Achou caro", "Escolheu concorrente"</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <TrendingUp className="h-3 w-3 mt-0.5 text-red-500 shrink-0" />
                    <span><strong>Follow-up em 30 dias</strong></span>
                  </li>
                </ul>
              </div>

              {/* DICAS DE OURO */}
              <div className="p-3 md:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <span className="text-sm md:text-lg">💡</span>
                  <h4 className="font-semibold text-sm md:text-base text-amber-700 dark:text-amber-400">DICAS DE OURO</h4>
                </div>
                <ul className="text-xs md:text-sm space-y-1 md:space-y-2">
                  <li className="flex items-start gap-1.5 md:gap-2">
                    <span>⏱️</span>
                    <span><strong>Velocidade:</strong> Lead novo = 5 min</span>
                  </li>
                  <li className="flex items-start gap-1.5 md:gap-2">
                    <span>📝</span>
                    <span><strong>Notas:</strong> Registre objeções</span>
                  </li>
                  <li className="flex items-start gap-1.5 md:gap-2">
                    <span>📊</span>
                    <span><strong>Meta:</strong> 20%+ de conversão</span>
                  </li>
                  <li className="flex items-start gap-1.5 md:gap-2">
                    <span>🔄</span>
                    <span><strong>Follow-up:</strong> 3+ dias? Ligue!</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
