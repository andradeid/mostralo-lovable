import { usePageSEO } from '@/hooks/useSEO';
import { MainFooter } from '@/components/MainFooter';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { Calendar, DollarSign, Brain, CheckCircle, ArrowRight, Star, Zap, Clock, Users, BarChart3, MessageCircle, Shield, TrendingUp, Target, AlertTriangle, Sparkles, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CentralAgendamentoPage = () => {
  usePageSEO({
    title: 'Central de Agendamento Inteligente - Transforme sua Agenda em Faturamento | Mostralo',
    description: 'Pare de perder dinheiro com agenda vazia. Sistema de agendamento com IA, cobrança PIX automática, reativação de clientes e relatórios inteligentes para barbearias, clínicas e salões.',
    keywords: 'agendamento inteligente, sistema barbearia, agenda clínica, agendamento salão, cobrança PIX automática, reativação clientes',
    image: '/favicon.png'
  });

  const whatsappLink = `https://wa.me/5511999999999?text=${encodeURIComponent('Quero conhecer a Central de Agendamento Inteligente')}`;

  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-sans w-full overflow-x-hidden">

      {/* HERO */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-amber-50/30 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative container px-4 md:px-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Central de Agendamento Inteligente
          </div>
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
            Pare de perder dinheiro com agenda vazia, clientes sumindo e horários desperdiçados.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transforme sua agenda em uma <strong className="text-foreground">máquina de faturamento automático</strong> com inteligência, automação e controle total.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" onClick={scrollToPlans}>
              Começar agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Configuração em menos de 5 minutos • Sem fidelidade</p>
        </div>
      </section>

      {/* QUEBRA DE PADRÃO */}
      <section className="py-12 md:py-20 bg-foreground text-background">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center">
          <div className="space-y-6">
            <p className="text-xl md:text-2xl font-medium opacity-90">
              Quantos clientes você já <strong className="text-primary">perdeu</strong> e nem percebeu?
            </p>
            <p className="text-xl md:text-2xl font-medium opacity-90">
              Quantos horários ficaram <strong className="text-primary">vazios</strong> por falta no dia?
            </p>
            <p className="text-xl md:text-2xl font-medium opacity-90">
              Quantas vezes você ficou <strong className="text-primary">preso no WhatsApp</strong> organizando tudo?
            </p>
          </div>
          <div className="mt-10 pt-8 border-t border-background/20">
            <p className="text-2xl md:text-3xl font-black">
              O problema não é falta de cliente.<br />
              <span className="text-primary">É falta de controle.</span>
            </p>
          </div>
        </div>
      </section>

      {/* APRESENTAÇÃO DA SOLUÇÃO */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Target className="w-4 h-4" />
            A solução completa
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Central de Crescimento Inteligente
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            O sistema que organiza sua agenda, traz clientes de volta automaticamente e <strong className="text-foreground">garante seu faturamento antes mesmo do atendimento acontecer.</strong>
          </p>
        </div>
      </section>

      {/* OS 3 PILARES */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Os 3 Pilares do Crescimento</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Pilar 1 */}
            <Card className="p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Controle Total da Agenda</h3>
              <ul className="space-y-3 text-left text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Agenda completa (dia, semana, mês)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Gestão de profissionais e serviços
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Página de agendamento online 24/7
                </li>
              </ul>
            </Card>

            {/* Pilar 2 */}
            <Card className="p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Faturamento Automatizado</h3>
              <ul className="space-y-3 text-left text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  Cobrança antecipada via PIX
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  Lembretes automáticos por WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  Redução drástica de faltas
                </li>
              </ul>
            </Card>

            {/* Pilar 3 */}
            <Card className="p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Crescimento Inteligente</h3>
              <ul className="space-y-3 text-left text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  Sentinela: reativação automática
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  Relatórios inteligentes com IA
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  Alertas e insights automáticos
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* DIFERENCIAL */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
              Enquanto outros sistemas só organizam...<br />
              <span className="text-primary">este faz você faturar.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Zap, text: 'Reativa clientes automaticamente' },
              { icon: Shield, text: 'Reduz faltas com cobrança antecipada' },
              { icon: MessageCircle, text: 'Automatiza atendimento via WhatsApp' },
              { icon: BarChart3, text: 'Mostra onde você perde dinheiro' },
              { icon: TrendingUp, text: 'Identifica tendências de crescimento' },
              { icon: Users, text: 'Gestão completa de equipe e comissões' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-muted-foreground text-lg">Simples. Direto. Sem complicação.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: PhoneCall,
                title: 'Cliente agenda',
                desc: 'Online pelo link, WhatsApp ou direto no sistema. 24 horas por dia, 7 dias por semana.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Sistema cuida de tudo',
                desc: 'Confirma, cobra via PIX, envia lembrete. Tudo automático, sem você mexer um dedo.',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Clientes voltam sozinhos',
                desc: 'O Sentinela identifica quem sumiu e traz de volta automaticamente. Faturamento contínuo.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black text-primary/20 mb-4">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
              Escolha o plano ideal para o seu negócio
            </h2>
            <p className="text-muted-foreground text-lg">Sem fidelidade. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Profissional */}
            <Card className="p-8 flex flex-col border-2 border-border hover:border-primary/30 transition-all">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Profissional</h3>
                <p className="text-sm text-muted-foreground">Para quem precisa organizar</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-foreground">R$297</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Agenda completa (dia, semana, mês)',
                  'Profissionais e serviços',
                  'Página de agendamento online',
                  'Lembretes automáticos',
                  'WhatsApp integrado',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="lg" className="w-full" onClick={scrollToPlans}>
                Começar agora
              </Button>
            </Card>

            {/* Avançado */}
            <Card className="p-8 flex flex-col border-2 border-border hover:border-primary/30 transition-all">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Avançado</h3>
                <p className="text-sm text-muted-foreground">Para quem quer crescer</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-foreground">R$397</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tudo do plano Profissional',
                  'Central de avaliações',
                  'Relatórios inteligentes com IA',
                  'Cartões digitais por profissional',
                  'Automações avançadas de status',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="lg" className="w-full" onClick={scrollToPlans}>
                Quero evoluir
              </Button>
            </Card>

            {/* Premium - DESTACADO */}
            <Card className="p-8 flex flex-col border-2 border-primary shadow-xl shadow-primary/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  ⭐ Mais escolhido
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-foreground mb-1">Premium</h3>
                <p className="text-sm text-muted-foreground">Para quem quer dominar o mercado</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-primary">R$597</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tudo dos planos anteriores',
                  'Sentinela (reativação automática)',
                  'Cobrança antecipada via PIX',
                  'Análise Comercial completa',
                  'Alertas inteligentes',
                  'Gestão de comissões',
                  'Insights estratégicos com IA',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                Quero crescer meu faturamento
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* ANÁLISE COMERCIAL */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-4">
              <BarChart3 className="w-4 h-4" />
              Módulo exclusivo Premium
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
              Você sabe onde está perdendo dinheiro?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[
              { icon: MessageCircle, text: 'Conversas que não viraram venda' },
              { icon: Clock, text: 'Horários com mais perdas' },
              { icon: Target, text: 'Taxa de conversão real' },
              { icon: Users, text: 'Tempo de resposta da equipe' },
              { icon: TrendingUp, text: 'Tendências de crescimento' },
              { icon: AlertTriangle, text: 'Gargalos de atendimento' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-background/5 border border-background/10">
                <item.icon className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-medium opacity-90">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xl font-bold">
            Decisão baseada em <span className="text-primary">dados</span>, não em achismo.
          </p>
        </div>
      </section>

      {/* QUEBRA DE OBJEÇÃO */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Ainda tem dúvida?
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                question: '"Já uso uma agenda..."',
                answer: 'Então você organiza horários. Mas continua perdendo dinheiro com faltas, clientes que somem e zero controle sobre seu faturamento real. Organizar é o básico. Crescer é outro nível.',
              },
              {
                question: '"Serve para negócio pequeno?"',
                answer: 'Principalmente para pequenos negócios. Quando cada cliente faz diferença no final do mês, perder UM já dói. Imagine perder 5, 10 por semana sem nem saber.',
              },
              {
                question: '"Meu cliente não usa tecnologia..."',
                answer: 'Se ele usa WhatsApp, ele usa o sistema. O agendamento funciona pelo link, pelo WhatsApp ou presencialmente. Zero barreira.',
              },
              {
                question: '"É caro demais..."',
                answer: 'Quanto você perde por mês com faltas? Com clientes que nunca mais voltaram? Com horários vagos? Um único cliente recuperado pelo Sentinela já paga o sistema.',
              },
            ].map((item, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <p className="text-lg font-bold text-foreground mb-2">{item.question}</p>
                <p className="text-muted-foreground">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FECHAMENTO */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-muted-foreground mb-6">
            Se você continuar como está, vai continuar <strong className="text-foreground">perdendo dinheiro sem perceber.</strong>
          </p>
          <p className="text-xl md:text-2xl font-bold text-foreground mb-10">
            Se usar o sistema certo, sua agenda se organiza, seus clientes voltam e seu <span className="text-primary">faturamento cresce.</span>
          </p>
          <Button size="lg" className="text-lg px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl" onClick={scrollToPlans}>
            Começar agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Leva menos de 5 minutos para configurar</p>
        </div>
      </section>

      <MainFooter />
      <WhatsAppLeadButton />
    </div>
  );
};

export default CentralAgendamentoPage;
