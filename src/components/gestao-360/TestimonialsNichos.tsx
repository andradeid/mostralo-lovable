import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Utensils, 
  Scissors, 
  Stethoscope, 
  ShoppingBag, 
  Building2,
  Star,
  Quote,
  TrendingUp,
  Users,
  Zap,
  Target
} from "lucide-react";

interface Testimonial {
  id: string;
  nicho: string;
  nichoIcon: React.ElementType;
  nome: string;
  negocio: string;
  cidade: string;
  quote: string;
  resultado: string;
  pilar: "atração" | "conversão" | "operação" | "talentos";
  pilarLabel: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: "gastronomia",
    nicho: "Gastronomia",
    nichoIcon: Utensils,
    nome: "Ricardo Mendes",
    negocio: "Cantina do Ricky",
    cidade: "São Paulo, SP",
    quote: "Saímos do caos operacional. Antes eram 15 erros de pedido por dia, agora são menos de 2. A cozinha finalmente respira e o cliente recebe o que pediu.",
    resultado: "-70% erros de pedido",
    pilar: "operação",
    pilarLabel: "Eficiência Operacional",
    rating: 5
  },
  {
    id: "barbearia",
    nicho: "Barbearia & Salão",
    nichoIcon: Scissors,
    nome: "Fernanda Costa",
    negocio: "Studio F Hair",
    cidade: "Curitiba, PR",
    quote: "O cartão digital revolucionou meu salão. Clientes agendam sozinhos pelo WhatsApp, 24h por dia. Minha recepcionista agora foca em atendimento, não em telefone.",
    resultado: "+40% agendamentos online",
    pilar: "conversão",
    pilarLabel: "Conversão Autônoma",
    rating: 5
  },
  {
    id: "clinica",
    nicho: "Clínica & Consultório",
    nichoIcon: Stethoscope,
    nome: "Dra. Juliana Reis",
    negocio: "Nutri Vida Clínica",
    cidade: "Belo Horizonte, MG",
    quote: "A IA no WhatsApp qualifica pacientes enquanto eu atendo. Quando chego no consultório, já sei quem precisa de qual protocolo. Triplicamos as consultas sem aumentar equipe.",
    resultado: "3x mais consultas",
    pilar: "atração",
    pilarLabel: "Atração Preditiva",
    rating: 5
  },
  {
    id: "loja",
    nicho: "Loja & Suplementos",
    nichoIcon: ShoppingBag,
    nome: "Marcos Oliveira",
    negocio: "Power Suplementos",
    cidade: "Rio de Janeiro, RJ",
    quote: "O Google Shopping integrado mudou o jogo. Meus produtos aparecem para quem está buscando ativamente. O tráfego que chega já vem pronto para comprar.",
    resultado: "+55% tráfego qualificado",
    pilar: "atração",
    pilarLabel: "Atração Preditiva",
    rating: 5
  },
  {
    id: "franquia",
    nicho: "Franquia",
    nichoIcon: Building2,
    nome: "Eduardo Santos",
    negocio: "Rede Sabor & Arte",
    cidade: "8 unidades - Brasil",
    quote: "Finalmente tenho visão unificada das 8 unidades. Sei em tempo real qual loja está performando, qual precisa de atenção. Tomada de decisão virou ciência, não achismo.",
    resultado: "Visão unificada de 8 unidades",
    pilar: "talentos",
    pilarLabel: "Gestão de Talentos",
    rating: 5
  }
];

const pilarColors = {
  atração: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  conversão: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  operação: "from-green-500/20 to-green-600/10 border-green-500/30",
  talentos: "from-blue-500/20 to-blue-600/10 border-blue-500/30"
};

const pilarBadgeColors = {
  atração: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  conversão: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  operação: "bg-green-500/20 text-green-300 border-green-500/30",
  talentos: "bg-blue-500/20 text-blue-300 border-blue-500/30"
};

const pilarIcons = {
  atração: Target,
  conversão: Zap,
  operação: TrendingUp,
  talentos: Users
};

const nichos = [
  { id: "todos", label: "Todos", icon: Star },
  { id: "gastronomia", label: "Gastronomia", icon: Utensils },
  { id: "barbearia", label: "Barbearia & Salão", icon: Scissors },
  { id: "clinica", label: "Clínica", icon: Stethoscope },
  { id: "loja", label: "Loja", icon: ShoppingBag },
  { id: "franquia", label: "Franquia", icon: Building2 }
];

export function TestimonialsNichos() {
  const [activeNicho, setActiveNicho] = useState("todos");

  const filteredTestimonials = activeNicho === "todos" 
    ? testimonials 
    : testimonials.filter(t => t.id === activeNicho);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
            RESULTADOS REAIS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O Que Dizem Nossos Clientes
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Histórias reais de negócios que transformaram sua operação com o Ecossistema Mostralo
          </p>
        </div>

        {/* Filtro por Nicho */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {nichos.map((nicho) => {
            const Icon = nicho.icon;
            const isActive = activeNicho === nicho.id;
            return (
              <button
                key={nicho.id}
                onClick={() => setActiveNicho(nicho.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {nicho.label}
              </button>
            );
          })}
        </div>

        {/* Grid de Depoimentos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => {
            const NichoIcon = testimonial.nichoIcon;
            const PilarIcon = pilarIcons[testimonial.pilar];
            
            return (
              <Card 
                key={testimonial.id}
                className={`bg-gradient-to-br ${pilarColors[testimonial.pilar]} border backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}
              >
                <CardContent className="p-6">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <NichoIcon className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{testimonial.nome}</p>
                        <p className="text-xs text-slate-400">{testimonial.negocio}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Resultado Destaque */}
                  <div className="mb-4 p-3 rounded-lg bg-slate-900/50">
                    <p className="text-2xl font-bold text-white">{testimonial.resultado}</p>
                    <p className="text-xs text-slate-400">{testimonial.cidade}</p>
                  </div>

                  {/* Quote */}
                  <div className="relative mb-4">
                    <Quote className="absolute -top-2 -left-1 w-6 h-6 text-slate-600 opacity-50" />
                    <p className="text-slate-300 text-sm italic pl-5 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                  </div>

                  {/* Badge do Pilar */}
                  <Badge className={`${pilarBadgeColors[testimonial.pilar]} border text-xs`}>
                    <PilarIcon className="w-3 h-3 mr-1" />
                    {testimonial.pilarLabel}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA sutil */}
        <div className="text-center mt-10">
          <p className="text-slate-500 text-sm">
            Mais de <span className="text-orange-400 font-semibold">500+ negócios</span> já transformaram sua operação
          </p>
        </div>
      </div>
    </section>
  );
}
