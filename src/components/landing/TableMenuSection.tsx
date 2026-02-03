import { QrCode, Smartphone, Clock, Users, Check, ChefHat, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function TableMenuSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-background to-blue-50 dark:from-purple-950/20 dark:via-background dark:to-blue-950/20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
            <QrCode className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">NOVO! Cardápio na Mesa</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cliente Pede Direto do Celular
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            QR Code na mesa → Cliente escaneia → Faz o pedido → Vai direto para cozinha.
            <span className="font-medium text-foreground"> Sem garçom anotando, sem filas, sem erros.</span>
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Visual Demo */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-center mb-6">
                <div className="w-32 h-32 bg-white dark:bg-gray-900 rounded-2xl shadow-lg flex items-center justify-center">
                  <QrCode className="h-20 w-20 text-purple-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Mesa 05</p>
                <p className="text-lg font-semibold text-foreground mb-4">Escaneie para ver o cardápio</p>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                    <span>Sem app</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Instantâneo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-6">
            {[
              {
                icon: Zap,
                title: 'Pedido Instantâneo',
                desc: 'Cliente adiciona itens à comanda digital e envia direto para cozinha em segundos',
                color: 'text-yellow-500'
              },
              {
                icon: Users,
                title: 'Sem Dependência de Garçom',
                desc: 'Reduza tempo de espera. O garçom só precisa aprovar e entregar os pratos',
                color: 'text-blue-500'
              },
              {
                icon: ChefHat,
                title: 'Aprovação Opcional',
                desc: 'Configure se os itens vão direto para cozinha ou precisam de aprovação do atendente',
                color: 'text-green-500'
              },
              {
                icon: Smartphone,
                title: 'Funciona em Qualquer Celular',
                desc: 'Tecnologia PWA - não precisa baixar aplicativo. Funciona no navegador',
                color: 'text-purple-500'
              }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-card shadow-md flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">70%</p>
              <p className="text-sm text-muted-foreground">Redução no tempo de atendimento</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">0</p>
              <p className="text-sm text-muted-foreground">Erros de anotação</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">+25%</p>
              <p className="text-sm text-muted-foreground">Rotatividade de mesas</p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            'Senha de segurança por mesa',
            'Histórico de consumo em tempo real',
            'Divisão de conta automática',
            'Integração com KDS/Cozinha',
            'QR Codes personalizáveis',
            'Modo retirada no balcão',
            'Cardápio com fotos',
            'Funciona offline (PWA)'
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/signup">
            <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
              Ativar Cardápio na Mesa <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            Disponível nos planos Profissional e Empresarial
          </p>
        </div>
      </div>
    </section>
  );
}
