import { Link } from "react-router-dom";
import { 
  Pizza, 
  Beef, 
  IceCream, 
  Coffee, 
  Truck, 
  Pill, 
  ShoppingBasket,
  Dog,
  Scissors,
  Sparkles,
  Dumbbell,
  Building2,
  Croissant,
  Apple,
  Package,
  Trophy
} from "lucide-react";

interface Niche {
  name: string;
  icon: React.ElementType;
  href: string;
  category: "food" | "varejo" | "servicos";
}

const niches: Niche[] = [
  // Food
  { name: "Pizzarias", icon: Pizza, href: "/nicho-pizzarias", category: "food" },
  { name: "Hamburguerias", icon: Beef, href: "/nicho-hamburguerias", category: "food" },
  { name: "Açaiterias", icon: IceCream, href: "/nicho-acaiterias", category: "food" },
  { name: "Sorveterias", icon: IceCream, href: "/nicho-sorveterias", category: "food" },
  { name: "Padarias", icon: Croissant, href: "/nicho-padarias", category: "food" },
  { name: "Pastelarias", icon: Coffee, href: "/nicho-pastelarias", category: "food" },
  { name: "Churrasquinhos", icon: Beef, href: "/nicho-churrasquinhos", category: "food" },
  { name: "Food Trucks", icon: Truck, href: "/nicho-foodtruck", category: "food" },
  // Varejo
  { name: "Farmácias", icon: Pill, href: "/nicho-farmacias", category: "varejo" },
  { name: "Supermercados", icon: ShoppingBasket, href: "/nicho-supermercados", category: "varejo" },
  { name: "Pet Shops", icon: Dog, href: "/nicho-pet-shop", category: "varejo" },
  { name: "Distribuidoras", icon: Package, href: "/nicho-distribuidoras", category: "varejo" },
  { name: "Suplementos", icon: Apple, href: "/nicho-suplementos", category: "varejo" },
  // Serviços
  { name: "Barbearias", icon: Scissors, href: "/nicho-barbearias", category: "servicos" },
  { name: "Nail Designers", icon: Sparkles, href: "/nicho-nail-designers", category: "servicos" },
  { name: "Arenas Esportivas", icon: Trophy, href: "/nicho-arenas", category: "servicos" },
];

const categoryLabels = {
  food: "Food & Bebidas",
  varejo: "Varejo",
  servicos: "Serviços",
};

const categoryColors = {
  food: "from-orange-500/20 to-red-500/20",
  varejo: "from-blue-500/20 to-cyan-500/20",
  servicos: "from-purple-500/20 to-pink-500/20",
};

export const AboutNiches = () => {
  const categories = ["food", "varejo", "servicos"] as const;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            16+ Nichos
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
            Nichos que Atendemos
          </h2>
          <p className="text-muted-foreground">
            Soluções personalizadas para cada tipo de negócio
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {categories.map((category) => {
            const categoryNiches = niches.filter((n) => n.category === category);
            
            return (
              <div key={category}>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${categoryColors[category]}`} />
                  {categoryLabels[category]}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {categoryNiches.map((niche) => {
                    const Icon = niche.icon;
                    return (
                      <Link
                        key={niche.name}
                        to={niche.href}
                        className="bg-card border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:shadow-md transition-all group"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[category]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground text-center">
                          {niche.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
