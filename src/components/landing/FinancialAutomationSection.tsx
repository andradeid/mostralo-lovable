import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  PiggyBank, 
  Clock, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  CheckCircle,
  Zap,
  Calculator
} from "lucide-react";

export function FinancialAutomationSection() {
  const benefits = [
    {
      icon: Wallet,
      title: "Controle de Lucro Real",
      description: "Saiba exatamente quanto você lucrou hoje, ontem, esta semana ou este mês"
    },
    {
      icon: Clock,
      title: "Economize 5h/semana",
      description: "Pare de gastar horas em planilhas e anotações manuais"
    },
    {
      icon: BarChart3,
      title: "Relatórios Automáticos",
      description: "Gráficos de receita vs despesa prontos para análise"
    },
    {
      icon: Calculator,
      title: "Tome Decisões com Dados",
      description: "Insights financeiros para crescer seu negócio"
    }
  ];

  return (
    <section 
      id="gestao-financeira" 
      className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
    >
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2 bg-emerald-600 hover:bg-emerald-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Novidade: Gestão Financeira Automática
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Sua Gestão Financeira
            <br />
            <span className="text-emerald-600 dark:text-emerald-500">
              Funciona SOZINHA
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enquanto você prepara os pedidos, o sistema registra tudo automaticamente.
            <br />
            <strong>Zero planilha. Zero anotação. Zero erro.</strong>
          </p>
        </div>

        {/* Pain Points */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <span className="text-red-600 text-xl">❌</span>
              <span className="text-sm text-muted-foreground">Ainda usa planilha para anotar vendas?</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <span className="text-red-600 text-xl">❌</span>
              <span className="text-sm text-muted-foreground">Esquece de registrar pagamento de entregadores?</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <span className="text-red-600 text-xl">❌</span>
              <span className="text-sm text-muted-foreground">Não sabe quanto realmente lucrou no mês?</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <span className="text-red-600 text-xl">❌</span>
              <span className="text-sm text-muted-foreground">Perde horas fazendo controle financeiro?</span>
            </div>
          </div>
        </div>

        {/* Automation Flow Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Income Card */}
          <Card className="p-6 border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/40 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-emerald-700 dark:text-emerald-400">📥 RECEITA</h3>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500 mb-3">Automática</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Pedido concluído =</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">+ R$ entrada</p>
              <p className="text-xs mt-3 font-medium">Sem planilha!</p>
            </div>
          </Card>

          {/* Expense Card */}
          <Card className="p-6 border-2 border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-red-700 dark:text-red-400">📤 DESPESA</h3>
            <p className="text-sm font-medium text-red-600 dark:text-red-500 mb-3">Automática</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Entrega feita =</p>
              <p className="font-bold text-red-600 dark:text-red-400 text-lg">- R$ saída</p>
              <p className="text-xs mt-3 font-medium">Sem anotação!</p>
            </div>
          </Card>

          {/* Balance Card */}
          <Card className="p-6 border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 text-center">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-400">📈 SALDO</h3>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-500 mb-3">Em Tempo Real</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Dashboard atualizado</p>
              <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">a cada segundo</p>
              <p className="text-xs mt-3 font-medium">Sempre preciso!</p>
            </div>
          </Card>
        </div>

        {/* Visual Flow */}
        <Card className="p-6 md:p-8 max-w-4xl mx-auto mb-12 bg-card/80 backdrop-blur">
          <h3 className="text-xl font-bold text-center mb-6">🔄 Como Funciona</h3>
          <div className="space-y-4">
            {/* Income Flow */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-sm">Pedido Concluído</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground sm:hidden">↓</span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Sistema Registra</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground sm:hidden">↓</span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white">
                <TrendingUp className="h-5 w-5" />
                <span className="font-bold text-sm">+ Receita</span>
              </div>
            </div>

            {/* Expense Flow */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-sm">Entrega Feita</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground sm:hidden">↓</span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Sistema Registra</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground sm:hidden">↓</span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white">
                <TrendingDown className="h-5 w-5" />
                <span className="font-bold text-sm">- Despesa</span>
              </div>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-6 font-medium">
            "Zero trabalho manual. Zero planilha. Zero erro."
          </p>
        </Card>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all hover:scale-105 bg-card/80 backdrop-blur">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="font-bold mb-2">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <div className="text-center p-4">
            <p className="text-3xl md:text-4xl font-bold text-emerald-600">5h</p>
            <p className="text-sm text-muted-foreground">economizadas/semana</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl md:text-4xl font-bold text-emerald-600">100%</p>
            <p className="text-sm text-muted-foreground">transações automáticas</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl md:text-4xl font-bold text-emerald-600">0</p>
            <p className="text-sm text-muted-foreground">erros de digitação</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl md:text-4xl font-bold text-emerald-600">24/7</p>
            <p className="text-sm text-muted-foreground">registro contínuo</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-lg md:text-xl font-medium mb-6 text-muted-foreground">
            Pare de usar planilhas. Deixe o sistema trabalhar por você.
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg h-14 px-8 shadow-lg hover:shadow-xl bg-emerald-600 hover:bg-emerald-700">
              <Sparkles className="mr-2 h-5 w-5" />
              Experimentar Grátis por 7 Dias
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
