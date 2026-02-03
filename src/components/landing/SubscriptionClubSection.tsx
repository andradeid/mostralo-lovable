import { CreditCard, Users, Calendar, TrendingUp, Check, Scissors, Sparkles, Heart, Dumbbell, Music, Dog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: CreditCard,
    title: "Planos Personalizados",
    description: "Crie planos como 'Corte Ilimitado', 'Plano VIP' ou 'Assinatura Mensal' com os serviços que você escolher"
  },
  {
    icon: Users,
    title: "Gestão de Assinantes",
    description: "Dashboard completo com status, vencimentos, histórico de uso e controle de renovações"
  },
  {
    icon: Calendar,
    title: "Integração com Agenda",
    description: "Sistema reconhece automaticamente o assinante e marca serviços como 'Incluso no Plano'"
  },
  {
    icon: TrendingUp,
    title: "Receita Recorrente",
    description: "Saiba quanto vai faturar antes do mês começar. Clientes fiéis, fluxo de caixa previsível"
  }
];

const functionalities = [
  "Limite flexível: ilimitado ou X usos por mês",
  "Ciclos: mensal, trimestral, semestral ou anual",
  "Registro automático de uso ao agendar",
  "PIX automático com QR Code integrado",
  "Histórico completo de pagamentos",
  "Renovação automática opcional",
  "Status em tempo real (ativo, pausado, cancelado)"
];

const niches = [
  { icon: Scissors, name: "Barbearias" },
  { icon: Sparkles, name: "Salões" },
  { icon: Dog, name: "Pet Shops" },
  { icon: Dumbbell, name: "Academias" },
  { icon: Heart, name: "Clínicas" },
  { icon: Music, name: "Estúdios" }
];

export function SubscriptionClubSection() {
  return (
    <section className="py-20 md:py-28 bg-transparent relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs with animation */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-violet-400/5 rounded-full blur-2xl animate-pulse [animation-delay:2s]" />
        
        {/* Subtle floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-violet-400/30 rounded-full animate-bounce [animation-duration:3s]" />
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-bounce [animation-delay:0.5s] [animation-duration:4s]" />
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-violet-300/25 rounded-full animate-bounce [animation-delay:1s] [animation-duration:3.5s]" />
        <div className="absolute top-1/3 right-10 w-1 h-1 bg-purple-300/50 rounded-full animate-ping [animation-duration:2s]" />
        <div className="absolute bottom-20 right-1/3 w-1.5 h-1.5 bg-violet-400/35 rounded-full animate-ping [animation-delay:1.5s] [animation-duration:2.5s]" />
        
        {/* Gradient lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-violet-500/10 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 text-violet-400 text-sm font-semibold border border-violet-500/30">
            <CreditCard className="w-4 h-4" />
            NOVO! FUNCIONALIDADE PREMIUM
          </span>
        </div>

        {/* Título */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Clube de Assinaturas:{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Receita Recorrente Garantida
            </span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400">
            Transforme clientes ocasionais em assinantes fiéis com planos mensais personalizados
          </p>
        </div>

        {/* Grid de Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="bg-zinc-900/50 border-violet-500/20 p-6 hover:border-violet-400/50 transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Duas Colunas: Funcionalidades + Nichos */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Lista de Funcionalidades */}
          <Card className="bg-zinc-900/50 border-violet-500/20 p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Check className="w-5 h-5 text-violet-400" />
              Tudo o que você precisa
            </h3>
            <ul className="space-y-4">
              {functionalities.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Nichos Ideais */}
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30 p-8">
            <h3 className="text-xl font-semibold text-white mb-6">
              Perfeito para negócios com serviços recorrentes
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {niches.map((niche, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900/50 border border-violet-500/20 hover:border-violet-400/50 transition-colors"
                >
                  <niche.icon className="w-8 h-8 text-violet-400" />
                  <span className="text-sm text-zinc-300">{niche.name}</span>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 text-sm text-center">
              E qualquer outro negócio que queira fidelizar clientes com assinaturas
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/cadastro">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Quero Fidelizar Meus Clientes
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm mt-4">
            Funcionalidade disponível em todos os planos Mostralo
          </p>
        </div>
      </div>
    </section>
  );
}
