import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, Bell, Calendar, Package, RefreshCw, MessageSquare,
  CheckCircle, Clock, Settings, TrendingUp, Lightbulb, 
  AlertTriangle, Zap, ShoppingCart, ArrowRight
} from 'lucide-react';

interface SentinelaGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SentinelaGuide({ open, onOpenChange }: SentinelaGuideProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Target className="w-6 h-6 text-primary" />
            Guia do SENTINELA
          </SheetTitle>
          <SheetDescription>
            Aprenda a configurar lembretes inteligentes de recompra
          </SheetDescription>
        </SheetHeader>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {/* Seção 1: O que é o SENTINELA? */}
          <AccordionItem value="intro" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">O que é o SENTINELA?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                O SENTINELA é um sistema inteligente que envia lembretes automáticos pelo WhatsApp 
                quando os produtos do seu cliente estão prestes a acabar.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                  <CardContent className="p-3 text-center">
                    <RefreshCw className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Mais recorrência</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                  <CardContent className="p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Mais vendas</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                  <CardContent className="p-3 text-center">
                    <Bell className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Automático</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                  <CardContent className="p-3 text-center">
                    <MessageSquare className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-xs font-medium">Via WhatsApp</p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 2: Como funciona? */}
          <AccordionItem value="how-it-works" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold">Como funciona?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                O sistema acompanha cada venda e calcula quando o produto vai acabar:
              </p>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <div>
                    <p className="text-sm font-medium">Cliente compra um produto</p>
                    <p className="text-xs text-muted-foreground">Ex: Whey Protein de 1kg</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <div>
                    <p className="text-sm font-medium">Sistema calcula a data</p>
                    <p className="text-xs text-muted-foreground">Baseado no ciclo de recompra configurado (ex: 30 dias)</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <div>
                    <p className="text-sm font-medium">Agenda o lembrete</p>
                    <p className="text-xs text-muted-foreground">Alguns dias antes de acabar (ex: 3 dias antes)</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Envia mensagem automática</p>
                    <p className="text-xs text-muted-foreground">WhatsApp personalizado para o cliente</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 3: Configurando Regras */}
          <AccordionItem value="rules" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
                  <Settings className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold">Configurando regras</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Você pode criar regras para produtos específicos ou categorias inteiras:
              </p>

              {/* Regra por Produto */}
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Regra por Produto</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ideal para produtos com ciclo de consumo específico.
                  </p>
                  <div className="bg-white dark:bg-background rounded p-2 text-xs">
                    <strong>Exemplo:</strong> Whey Protein 1kg
                    <br />→ Ciclo: 30 dias | Lembrar: 3 dias antes
                  </div>
                </CardContent>
              </Card>

              {/* Regra por Categoria */}
              <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Regra por Categoria</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aplica a mesma regra para todos os produtos da categoria.
                  </p>
                  <div className="bg-white dark:bg-background rounded p-2 text-xs">
                    <strong>Exemplo:</strong> Categoria "Suplementos"
                    <br />→ Ciclo: 30 dias | Lembrar: 5 dias antes
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  <strong>Dica:</strong> Regras por produto têm prioridade sobre regras por categoria!
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 4: Exemplos Práticos */}
          <AccordionItem value="examples" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/30">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-semibold">Exemplos práticos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Veja alguns exemplos de configuração por nicho:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded border bg-muted/30">
                  <p className="text-sm font-medium">🏋️ Whey Protein 1kg</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclo: <strong>30 dias</strong> | Lembrar: <strong>3 dias antes</strong>
                  </p>
                </div>

                <div className="p-3 rounded border bg-muted/30">
                  <p className="text-sm font-medium">👶 Fraldas (pacote grande)</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclo: <strong>15 dias</strong> | Lembrar: <strong>2 dias antes</strong>
                  </p>
                </div>

                <div className="p-3 rounded border bg-muted/30">
                  <p className="text-sm font-medium">🐕 Ração para Pet 15kg</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclo: <strong>30 dias</strong> | Lembrar: <strong>5 dias antes</strong>
                  </p>
                </div>

                <div className="p-3 rounded border bg-muted/30">
                  <p className="text-sm font-medium">☕ Café 500g</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclo: <strong>15 dias</strong> | Lembrar: <strong>3 dias antes</strong>
                  </p>
                </div>

                <div className="p-3 rounded border bg-muted/30">
                  <p className="text-sm font-medium">🧴 Shampoo 500ml</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclo: <strong>60 dias</strong> | Lembrar: <strong>5 dias antes</strong>
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 5: Template de Mensagem */}
          <AccordionItem value="template" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold">Template de mensagem</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Personalize a mensagem que será enviada aos clientes. Use as variáveis disponíveis:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-muted/50 text-center">
                  <code className="text-xs font-mono text-primary">{'{nome}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Nome completo</p>
                </div>
                <div className="p-2 rounded bg-muted/50 text-center">
                  <code className="text-xs font-mono text-primary">{'{primeiro_nome}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Primeiro nome</p>
                </div>
                <div className="p-2 rounded bg-muted/50 text-center">
                  <code className="text-xs font-mono text-primary">{'{produto}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Nome do produto</p>
                </div>
                <div className="p-2 rounded bg-muted/50 text-center">
                  <code className="text-xs font-mono text-primary">{'{loja}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Nome da loja</p>
                </div>
                <div className="col-span-2 p-2 rounded bg-muted/50 text-center">
                  <code className="text-xs font-mono text-primary">{'{link_loja}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Link do catálogo</p>
                </div>
              </div>

              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">Exemplo de template eficaz:</p>
                  <div className="bg-white dark:bg-background rounded p-2 text-xs whitespace-pre-line">
{`Olá {primeiro_nome}! 👋

Lembrete amigável da {loja}!

Seu *{produto}* deve estar acabando, né? 🏃‍♂️

🛒 Aproveite para repor agora:
{link_loja}

Qualquer dúvida, é só chamar! 💬`}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 6: Acompanhando Resultados */}
          <AccordionItem value="results" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-semibold">Acompanhando resultados</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Na aba "Lembretes" você pode acompanhar todos os lembretes e seus status:
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded border">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                    <Clock className="w-3 h-3 mr-1" /> Pendente
                  </Badge>
                  <span className="text-xs">Aguardando data de envio</span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded border">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" /> Enviado
                  </Badge>
                  <span className="text-xs">Mensagem foi enviada</span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded border">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" /> Convertido
                  </Badge>
                  <span className="text-xs">Cliente fez nova compra!</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                A <strong>taxa de conversão</strong> mostra quantos lembretes resultaram em novas vendas.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Seção 7: Dicas e Boas Práticas */}
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
                    <strong>Comece pelos campeões de vendas.</strong> Identifique os produtos 
                    mais vendidos e configure regras para eles primeiro.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                  <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Personalize o template.</strong> Mensagens que parecem 
                    pessoais convertem muito mais do que mensagens genéricas.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Não exagere.</strong> Um lembrete é útil, muitos podem 
                    incomodar. Foque nos produtos de consumo recorrente.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-purple-50 dark:bg-purple-950/20">
                  <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Acompanhe os resultados.</strong> Veja quais regras estão 
                    convertendo mais e otimize os ciclos de recompra.
                  </p>
                </div>

                <div className="flex gap-2 p-2 rounded bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Teste antes de ativar!</strong> Use a função de teste para 
                    verificar se as mensagens estão chegando corretamente.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
