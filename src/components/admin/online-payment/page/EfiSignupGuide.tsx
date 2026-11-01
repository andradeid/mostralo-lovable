// Antes de vincular a conta EFI: benefícios, taxa e PASSO 1 (criar a conta EFI).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Zap, Info, Percent, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';

interface Props {
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
}

export function EfiSignupGuide({ guideOpen, setGuideOpen }: Props) {
  return (
    <>
      {/* Card de benefícios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Benefícios do PIX Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Recebimento instantâneo na sua conta EFI
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Confirmação automática de pagamentos
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Maior conversão de vendas
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Menos inadimplência e cancelamentos
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Taxa */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
        <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <div className="space-y-1">
            <p className="font-semibold">Taxa por transação: 8,19%</p>
            <p className="text-xs">7% Mostralo + 1,19% processamento EFI</p>
            <p className="text-xs">Só nos pagamentos pelo Pix Online do Mostralo. Pix manual, dinheiro e cartão na entrega continuam sem taxa.</p>
            <p className="text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" /> Recebimento instantâneo na sua conta
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Guia passo a passo */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  📱 PASSO 1: Criar sua Conta EFI (gratuita)
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium">Baixe o app "Efí" no seu celular</p>
                    <p className="text-sm text-muted-foreground">Disponível na Play Store (Android) e App Store (iPhone)</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://play.google.com/store/apps/details?id=br.com.gerencianet.app" target="_blank" rel="noopener">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Play Store
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://apps.apple.com/br/app/efi-banco-digital/id1443363678" target="_blank" rel="noopener">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          App Store
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium">Crie sua conta com CPF ou CNPJ</p>
                    <p className="text-sm text-muted-foreground">A criação é gratuita e leva poucos minutos. Basta seguir as instruções do app.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium">Encontre o número da sua conta</p>
                    <p className="text-sm text-muted-foreground">
                      No app Efí, vá em <strong>Menu → Minha Conta</strong>. O número da conta aparece no topo.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  A conta EFI é 100% gratuita para criar e manter. Você só paga a taxa de 8,19% quando receber um pagamento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}
