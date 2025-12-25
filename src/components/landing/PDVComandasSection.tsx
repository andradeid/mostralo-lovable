import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardList,
  Smartphone,
  TableProperties,
  Store,
  Image,
  CheckCircle,
  BarChart3,
  Wifi,
  Wallet,
  ArrowRight,
  X,
  Check
} from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'App do Garçom',
    description: 'Celular vira terminal de pedidos. Sem investir em equipamento caro.',
    color: 'text-blue-600'
  },
  {
    icon: TableProperties,
    title: 'Comandas por Mesa',
    description: 'Controle cada mesa individualmente com status em tempo real.',
    color: 'text-purple-600'
  },
  {
    icon: Store,
    title: 'Vendas no Balcão',
    description: 'PDV rápido para clientes que não sentam. Agilidade no atendimento.',
    color: 'text-green-600'
  },
  {
    icon: Image,
    title: 'Produtos com Foto',
    description: 'Garçom vê foto do prato para não errar o pedido nunca mais.',
    color: 'text-amber-600'
  },
  {
    icon: CheckCircle,
    title: 'Confirmação Segura',
    description: 'Modal de confirmação antes de enviar. Zero erros, zero retrabalho.',
    color: 'text-emerald-600'
  },
  {
    icon: BarChart3,
    title: 'Relatórios Integrados',
    description: 'Veja vendas presenciais + delivery no mesmo painel unificado.',
    color: 'text-indigo-600'
  },
  {
    icon: Wifi,
    title: 'Funciona Offline',
    description: 'PWA que funciona mesmo sem internet. Nunca perca uma venda.',
    color: 'text-rose-600'
  },
  {
    icon: Wallet,
    title: 'Fechamento Fácil',
    description: 'Aceita PIX, cartão, dinheiro e divide a conta automaticamente.',
    color: 'text-orange-600'
  }
];

const waiterFlow = [
  { step: '1', text: 'Garçom abre mesa no celular' },
  { step: '2', text: 'Adiciona itens com foto e quantidade' },
  { step: '3', text: 'Confirma antes de enviar (modal de segurança)' },
  { step: '4', text: 'Cozinha recebe o pedido automaticamente' },
  { step: '5', text: 'Fecha a conta com método de pagamento' }
];

const paperProblems = [
  'Letra ilegível, pedidos perdidos, retrabalho',
  'Sem histórico, impossível analisar vendas',
  'Garçom precisa ir até a cozinha avisar'
];

const mostraloSolutions = [
  'Pedidos enviados direto para cozinha',
  'Relatórios automáticos de vendas presenciais',
  'Histórico completo de cada mesa e cliente'
];

export const PDVComandasSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2 bg-orange-600">
            <ClipboardList className="w-4 h-4 mr-2" />
            PDV e Comandas
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ainda Usando Papel para Anotar Pedidos?
          </h2>
          <p className="text-xl md:text-2xl text-orange-600 font-semibold mb-4">
            Seu Garçom Merece Mais.
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Sistema completo de vendas presenciais: PDV touchscreen, comandas digitais por mesa e app exclusivo para garçons. 
            Tudo integrado com cozinha e financeiro.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-orange-100 dark:border-orange-900/30 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Fluxo do Garçom */}
          <Card className="bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-900/50 shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold">Fluxo do Garçom</h3>
              </div>
              <div className="space-y-4">
                {waiterFlow.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-muted-foreground">{item.text}</span>
                      {index < waiterFlow.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-orange-400 hidden md:block" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por que substituir o papel */}
          <Card className="bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-900/50 shadow-xl">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-bold mb-6">Por que substituir o papel?</h3>
              
              <div className="space-y-6">
                {/* Problemas do papel */}
                <div>
                  <p className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                    <X className="w-4 h-4" /> Problemas do Papel
                  </p>
                  <div className="space-y-2">
                    {paperProblems.map((problem, index) => (
                      <div key={index} className="flex items-center gap-3 text-muted-foreground">
                        <X className="w-4 h-4 text-destructive flex-shrink-0" />
                        <span className="text-sm">{problem}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Soluções Mostralo */}
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Com o Mostralo
                  </p>
                  <div className="space-y-2">
                    {mostraloSolutions.map((solution, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{solution}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-2">
            🔥 <span className="font-bold text-orange-600">Novo!</span> O mesmo sistema que você usa para delivery, agora para vendas presenciais
          </p>
          <p className="text-sm text-muted-foreground">
            Relatórios unificados: veja delivery + balcão + mesas em um só lugar
          </p>
        </div>
      </div>
    </section>
  );
};
