import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Check, 
  AlertTriangle,
  LogIn,
  Settings,
  Pencil,
  Shield,
  Save,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

interface EfiSplitSetupGuideProps {
  onTestAgain?: () => void;
  showTestButton?: boolean;
  defaultOpen?: boolean;
}

export function EfiSplitSetupGuide({ 
  onTestAgain, 
  showTestButton = true,
  defaultOpen = true 
}: EfiSplitSetupGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (step: number) => {
    setCompletedSteps(prev => 
      prev.includes(step) 
        ? prev.filter(s => s !== step)
        : [...prev, step]
    );
  };

  const allStepsCompleted = completedSteps.length === 5;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-amber-600" />
          📋 Como Habilitar Split de Pagamento
        </CardTitle>
        <CardDescription>
          Para receber pagamentos com divisão automática, você precisa habilitar a permissão 
          "Split de pagamento" no painel da EFI. Siga os passos abaixo:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta informativo */}
        <Alert className="bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>O que é Split de Pagamento?</strong>
            <p className="text-sm mt-1">
              É a funcionalidade que permite dividir automaticamente cada pagamento PIX: 
              a maior parte vai direto para sua conta, e a taxa de serviço é descontada automaticamente.
            </p>
          </AlertDescription>
        </Alert>

        {/* Accordion com os passos */}
        <Accordion type="single" collapsible defaultValue={defaultOpen ? "step-1" : undefined} className="space-y-2">
          {/* Passo 1 */}
          <AccordionItem value="step-1" className="border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(1) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {completedSteps.includes(1) ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div className="text-left">
                  <p className="font-medium">Acessar o Painel EFI</p>
                  <p className="text-xs text-muted-foreground">Fazer login no sistema.sejaefi.com.br</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="space-y-3 pl-11">
                <div className="flex items-center gap-2 text-sm">
                  <LogIn className="h-4 w-4 text-muted-foreground" />
                  <span>Acesse o painel web da EFI com seu login e senha</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://sistema.sejaefi.com.br/login" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Painel EFI
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleStep(1)}
                  className={completedSteps.includes(1) ? 'text-green-600' : ''}
                >
                  {completedSteps.includes(1) ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Marcar como feito</>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2 */}
          <AccordionItem value="step-2" className="border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(2) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {completedSteps.includes(2) ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div className="text-left">
                  <p className="font-medium">Ir em "Minhas Aplicações"</p>
                  <p className="text-xs text-muted-foreground">Menu lateral → API → Minhas Aplicações</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="space-y-3 pl-11">
                <div className="flex items-start gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>No menu lateral esquerdo, clique em:</p>
                    <div className="flex items-center gap-1 mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                      <span>API</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>Minhas Aplicações</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleStep(2)}
                  className={completedSteps.includes(2) ? 'text-green-600' : ''}
                >
                  {completedSteps.includes(2) ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Marcar como feito</>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 3 */}
          <AccordionItem value="step-3" className="border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(3) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {completedSteps.includes(3) ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div className="text-left">
                  <p className="font-medium">Editar sua Aplicação</p>
                  <p className="text-xs text-muted-foreground">Clique no ícone de edição da aplicação</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="space-y-3 pl-11">
                <div className="flex items-start gap-2 text-sm">
                  <Pencil className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>Na lista de aplicações, localize a sua aplicação e clique no <strong>ícone de lápis</strong> (editar).</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se não tiver nenhuma aplicação criada, clique em "Nova Aplicação" primeiro.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleStep(3)}
                  className={completedSteps.includes(3) ? 'text-green-600' : ''}
                >
                  {completedSteps.includes(3) ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Marcar como feito</>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 4 - CRÍTICO */}
          <AccordionItem value="step-4" className="border-2 border-amber-400 dark:border-amber-600 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(4) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-amber-500 text-white'
                }`}>
                  {completedSteps.includes(4) ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Habilitar "Split de pagamento"</p>
                    <Badge variant="destructive" className="text-xs">⚠️ IMPORTANTE</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Marque a permissão na lista</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="space-y-3 pl-11">
                <div className="flex items-start gap-2 text-sm">
                  <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p>Na página de edição da aplicação, role até a seção <strong>"Escopos"</strong> ou <strong>"Permissões"</strong>.</p>
                    <div className="mt-2 p-3 bg-white dark:bg-background border border-amber-300 dark:border-amber-700 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        ✅ Marque a opção:
                      </p>
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-100 dark:bg-amber-900/50 rounded font-mono text-sm">
                        <div className="w-4 h-4 border-2 border-amber-600 rounded flex items-center justify-center">
                          <Check className="h-3 w-3 text-amber-600" />
                        </div>
                        <span className="font-semibold">Split de pagamento</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sem essa permissão, a cobrança PIX será criada mas o split não funcionará.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleStep(4)}
                  className={completedSteps.includes(4) ? 'text-green-600' : ''}
                >
                  {completedSteps.includes(4) ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Marcar como feito</>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 5 */}
          <AccordionItem value="step-5" className="border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(5) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {completedSteps.includes(5) ? <Check className="h-4 w-4" /> : '5'}
                </div>
                <div className="text-left">
                  <p className="font-medium">Salvar e Testar</p>
                  <p className="text-xs text-muted-foreground">Clique em Salvar e faça um teste aqui</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="space-y-3 pl-11">
                <div className="flex items-start gap-2 text-sm">
                  <Save className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>Clique no botão <strong>"Salvar"</strong> no painel EFI.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Depois, volte aqui e faça um teste de cobrança PIX para confirmar que o split está funcionando.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleStep(5)}
                  className={completedSteps.includes(5) ? 'text-green-600' : ''}
                >
                  {completedSteps.includes(5) ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Marcar como feito</>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Barra de progresso */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progresso</span>
            <span className="text-sm font-medium">{completedSteps.length}/5 passos</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${(completedSteps.length / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" className="flex-1" asChild>
            <a href="https://sistema.sejaefi.com.br/login" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Painel EFI
            </a>
          </Button>
          {showTestButton && onTestAgain && (
            <Button 
              onClick={onTestAgain} 
              className="flex-1"
              disabled={!allStepsCompleted}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {allStepsCompleted ? 'Já configurei, testar agora' : 'Complete os passos primeiro'}
            </Button>
          )}
        </div>

        {allStepsCompleted && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Ótimo!</strong> Você completou todos os passos. Agora faça um teste de cobrança PIX 
              para confirmar que o split de pagamento está funcionando corretamente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
