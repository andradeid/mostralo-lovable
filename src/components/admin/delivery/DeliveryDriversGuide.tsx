import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bike, Users, Link, Plus, DollarSign, Percent, Shield, 
  Bell, CheckCircle, Clock, Settings, Edit, UserMinus,
  MessageSquare, TrendingUp, Lightbulb, AlertTriangle
} from 'lucide-react';

interface DeliveryDriversGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryDriversGuide({ open, onOpenChange }: DeliveryDriversGuideProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Bike className="w-6 h-6 text-primary" />
            Guia de Entregadores
          </SheetTitle>
          <SheetDescription>
            Aprenda a gerenciar sua equipe de entrega de forma eficiente
          </SheetDescription>
        </SheetHeader>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {/* Seção 1: Introdução */}
          <AccordionItem value="intro" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">O que é o sistema de entregadores?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                O sistema permite que você tenha sua própria equipe de entrega, sem depender de aplicativos externos.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Controle total</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                  <CardContent className="p-3 text-center">
                    <DollarSign className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Sem taxas extras</p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 2: Como Adicionar Entregadores */}
          <AccordionItem value="add-drivers" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold">Como adicionar entregadores</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Existem 3 formas de adicionar entregadores à sua equipe:
              </p>

              {/* Método 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Método 1</Badge>
                  <span className="font-medium text-sm">Cadastro Direto</span>
                </div>
                <p className="text-xs text-muted-foreground pl-4">
                  Clique em <strong>"Novo Entregador"</strong> e preencha os dados. 
                  Você define o email e senha inicial do entregador.
                </p>
              </div>

              {/* Método 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Método 2</Badge>
                  <span className="font-medium text-sm">Link de Convite</span>
                </div>
                <p className="text-xs text-muted-foreground pl-4">
                  Clique em <strong>"Gerar Link de Convite"</strong> e compartilhe. 
                  Entregadores se cadastram sozinhos pelo link.
                </p>
              </div>

              {/* Método 3 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Método 3</Badge>
                  <span className="font-medium text-sm">Convite Personalizado</span>
                </div>
                <p className="text-xs text-muted-foreground pl-4">
                  Use o link de convite com proposta de pagamento. 
                  O entregador pode aceitar ou fazer uma contra-proposta.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 3: Configurando Pagamentos */}
          <AccordionItem value="payments" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold">Configurando pagamentos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Você pode pagar seus entregadores de duas formas:
              </p>

              {/* Taxa Fixa */}
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Taxa Fixa</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pague sempre o mesmo valor por entrega.
                  </p>
                  <div className="bg-white dark:bg-background rounded p-2 text-xs">
                    <strong>Exemplo:</strong> Taxa fixa de R$ 5,00
                    <br />→ Entrega de R$ 8,00 = Entregador ganha R$ 5,00
                    <br />→ Entrega de R$ 12,00 = Entregador ganha R$ 5,00
                  </div>
                </CardContent>
              </Card>

              {/* Comissão */}
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-sm">Comissão</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pague uma porcentagem da taxa de entrega.
                  </p>
                  <div className="bg-white dark:bg-background rounded p-2 text-xs">
                    <strong>Exemplo:</strong> Comissão de 80%
                    <br />→ Entrega de R$ 8,00 = Entregador ganha R$ 6,40
                    <br />→ Entrega de R$ 12,00 = Entregador ganha R$ 9,60
                  </div>
                </CardContent>
              </Card>

              {/* Mínimo Garantido */}
              <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Mínimo Garantido (opcional)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Garanta um valor mínimo mesmo em entregas baratas.
                  </p>
                  <div className="bg-white dark:bg-background rounded p-2 text-xs">
                    <strong>Exemplo:</strong> 80% com mínimo de R$ 7,00
                    <br />→ Entrega de R$ 6,00 (80% = R$ 4,80) = Ganha R$ 7,00
                    <br />→ Entrega de R$ 10,00 (80% = R$ 8,00) = Ganha R$ 8,00
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 4: Sistema de Convites */}
          <AccordionItem value="invites" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                  <Link className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold">Convites e negociação</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Quando você envia um convite com proposta de pagamento:
              </p>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <div>
                    <p className="text-sm font-medium">Você envia o convite</p>
                    <p className="text-xs text-muted-foreground">Com sua proposta de pagamento</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <div>
                    <p className="text-sm font-medium">Entregador recebe</p>
                    <p className="text-xs text-muted-foreground">Pode aceitar, recusar ou fazer contra-proposta</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <div>
                    <p className="text-sm font-medium">Se houver contra-proposta</p>
                    <p className="text-xs text-muted-foreground">Você verá um alerta para revisar</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Acordo fechado!</p>
                    <p className="text-xs text-muted-foreground">Entregador é vinculado automaticamente</p>
                  </div>
                </div>
              </div>

              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <Bell className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  Fique atento ao badge de <strong>"contra-propostas"</strong> no topo da página!
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 5: Gestão Financeira */}
          <AccordionItem value="financial" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-semibold">Gestão financeira</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Acompanhe os ganhos e pagamentos de cada entregador:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded border">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Ganhos Totais</p>
                    <p className="text-xs text-muted-foreground">Soma de tudo que o entregador já ganhou</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded border">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium">A Receber</p>
                    <p className="text-xs text-muted-foreground">Valor que você ainda precisa pagar</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Clique em <strong>"Ver Detalhes Financeiros"</strong> para ver o histórico completo 
                e marcar pagamentos como realizados.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 6: Gerenciamento Diário */}
          <AccordionItem value="daily" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                  <Settings className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-semibold">Gerenciamento do dia a dia</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Status Online/Offline</p>
                    <p className="text-xs text-muted-foreground">
                      Mostra se o entregador está com o app aberto e disponível
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Edit className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Editar Dados</p>
                    <p className="text-xs text-muted-foreground">
                      Altere nome, telefone ou outros dados do entregador
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserMinus className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Desvincular</p>
                    <p className="text-xs text-muted-foreground">
                      Remove o entregador da sua equipe (não apaga a conta dele)
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 7: Dicas */}
          <AccordionItem value="tips" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950/30">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold">Dicas e boas práticas</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <div className="space-y-3">
                <div className="flex gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Configure o pagamento</strong> assim que adicionar um entregador. 
                    Sem configuração, o sistema não calcula os ganhos.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                  <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Use o link de convite</strong> para atrair novos entregadores. 
                    Divulgue nas redes sociais ou grupos de WhatsApp.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Pague regularmente</strong> para manter seus entregadores motivados. 
                    Use o financeiro para marcar os pagamentos feitos.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-purple-50 dark:bg-purple-950/20">
                  <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Acompanhe as estatísticas</strong> para identificar seus melhores 
                    entregadores e recompensá-los.
                  </p>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Sempre tenha pelo menos 2-3 entregadores cadastrados para garantir cobertura!
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
