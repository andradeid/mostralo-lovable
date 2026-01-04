import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, UtensilsCrossed, Scissors, Pill, PawPrint, ShoppingBasket, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";

interface Niche {
  id: string;
  name: string;
  icon: React.ElementType;
  problem: string;
  solution: string;
  highlight: string;
  modules: string[];
  cta: string;
  link: string;
  color: string;
}

const niches: Niche[] = [
  {
    id: "restaurantes",
    name: "Restaurantes & Delivery",
    icon: UtensilsCrossed,
    problem: "Pagando 30% de taxa pro iFood?",
    solution: "Delivery próprio com 0% de taxa",
    highlight: "R$ 90.000/ano economizados",
    modules: ["Cardápio Digital", "Delivery", "KDS Cozinha", "WhatsApp Marketing"],
    cta: "Sair do iFood Agora",
    link: "/nicho-hamburguerias",
    color: "orange"
  },
  {
    id: "barbearias",
    name: "Barbearias & Salões",
    icon: Scissors,
    problem: "Agenda no papel ou WhatsApp lotado?",
    solution: "Agendamento online 24h automático",
    highlight: "90% menos no-show",
    modules: ["Agendamentos", "Cartão Digital", "Avaliações", "Comissões"],
    cta: "Ativar Agendamentos Online",
    link: "/nicho-barbearias",
    color: "violet"
  },
  {
    id: "farmacias",
    name: "Farmácias & Drogarias",
    icon: Pill,
    problem: "Clientes esquecendo de comprar?",
    solution: "Lembretes automáticos via WhatsApp",
    highlight: "40% mais vendas recorrentes",
    modules: ["Catálogo Online", "Delivery Express", "Sentinela", "Estoque"],
    cta: "Ver Solução Farmácias",
    link: "/nicho-farmacias",
    color: "green"
  },
  {
    id: "petshops",
    name: "Pet Shops & Clínicas",
    icon: PawPrint,
    problem: "Banho e tosa sem controle?",
    solution: "Agendamentos + Vendas integrados",
    highlight: "+35% ticket médio",
    modules: ["Agendamentos", "Vendas", "Clientes", "Lembretes"],
    cta: "Ver Solução Pet Shop",
    link: "/nicho-pet-shop",
    color: "amber"
  },
  {
    id: "supermercados",
    name: "Supermercados & Mercearias",
    icon: ShoppingBasket,
    problem: "Perdendo vendas pro iFood Market?",
    solution: "App próprio de delivery",
    highlight: "2x mais pedidos recorrentes",
    modules: ["Catálogo", "Delivery", "PDV", "Estoque"],
    cta: "Ver Solução Mercados",
    link: "/nicho-supermercados",
    color: "blue"
  },
  {
    id: "suplementos",
    name: "Lojas de Suplementos",
    icon: Dumbbell,
    problem: "Cliente comprou e sumiu?",
    solution: "Retenção automática por WhatsApp",
    highlight: "60% clientes recuperados",
    modules: ["Catálogo", "Sentinela", "Clientes VIP", "Promoções"],
    cta: "Ver Solução Suplementos",
    link: "/nicho-suplementos",
    color: "rose"
  }
];

const colorVariants: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", badge: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-500", badge: "bg-violet-500/20 text-violet-700 dark:text-violet-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-500", badge: "bg-green-500/20 text-green-700 dark:text-green-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", badge: "bg-amber-500/20 text-amber-700 dark:text-amber-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", badge: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-500", badge: "bg-rose-500/20 text-rose-700 dark:text-rose-400" },
};

export function NichesSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4">
            DESEJO
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Funciona Perfeitamente Para{" "}
            <span className="text-primary">Seu Negócio</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Soluções específicas para cada segmento, com módulos pré-configurados
          </p>
        </div>

        {/* Niches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {niches.map((niche) => {
            const Icon = niche.icon;
            const colors = colorVariants[niche.color];
            
            return (
              <Card key={niche.id} className={`h-full border-2 ${colors.border} hover:shadow-lg transition-shadow`}>
                <CardHeader className={colors.bg}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <CardTitle className="text-lg">{niche.name}</CardTitle>
                  </div>
                  <CardDescription className="text-foreground font-medium">
                    {niche.problem}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Solution */}
                  <p className="text-sm text-muted-foreground">
                    ✓ {niche.solution}
                  </p>
                  
                  {/* Highlight */}
                  <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${colors.badge}`}>
                    {niche.highlight}
                  </div>

                  {/* Modules */}
                  <div className="flex flex-wrap gap-1.5">
                    {niche.modules.map((module) => (
                      <Badge key={module} variant="outline" className="text-xs">
                        {module}
                      </Badge>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button asChild className="w-full mt-4 group" variant="outline">
                    <Link to={niche.link}>
                      {niche.cta}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Não encontrou seu segmento?
          </p>
          <Button asChild variant="link" className="text-primary">
            <Link to="/diagnostico">
              Fazer diagnóstico personalizado →
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
