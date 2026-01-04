import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, DollarSign, Users, Quote } from "lucide-react";

interface Stat {
  icon: React.ElementType;
  value: string;
  label: string;
  description: string;
  color: string;
}

const stats: Stat[] = [
  {
    icon: DollarSign,
    value: "R$ 90.000",
    label: "Economizados/ano",
    description: "Deixando de pagar taxa de marketplace",
    color: "text-green-500"
  },
  {
    icon: Clock,
    value: "12h",
    label: "Liberadas/semana",
    description: "Adeus planilhas e sistemas separados",
    color: "text-blue-500"
  },
  {
    icon: TrendingUp,
    value: "+30%",
    label: "Ticket Médio",
    description: "Com totem de autoatendimento",
    color: "text-orange-500"
  },
  {
    icon: Users,
    value: "60%",
    label: "Clientes Recuperados",
    description: "Com marketing automático WhatsApp",
    color: "text-violet-500"
  }
];

interface Testimonial {
  quote: string;
  author: string;
  business: string;
  segment: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Saí do iFood e em 3 meses recuperei 80% dos clientes. Minha margem de lucro dobrou.",
    author: "Carlos Silva",
    business: "Burger House",
    segment: "Hamburgueria"
  },
  {
    quote: "O sistema de agendamentos praticamente eliminou os no-shows. A equipe agora pode focar no atendimento.",
    author: "Marina Santos",
    business: "Studio Hair",
    segment: "Salão de Beleza"
  },
  {
    quote: "Centralizamos tudo: vendas, estoque, delivery. Parece que ganhamos um funcionário extra.",
    author: "Roberto Lima",
    business: "Farma Vida",
    segment: "Farmácia"
  }
];

export function ProofSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4">
            RESULTADOS REAIS
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Números que{" "}
            <span className="text-primary">Falam por Si</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Resultados médios dos negócios que migraram para o Mostralo
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center h-full">
                <CardContent className="pt-6 pb-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className={`text-3xl md:text-4xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="font-semibold text-foreground mt-1">
                    {stat.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.author} className="h-full bg-card border-primary/10">
              <CardContent className="pt-6">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-foreground italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.business} • {testimonial.segment}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
