import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check,
  X,
  Sparkles,
  Menu,
  Package,
  Truck,
  Palette,
  BarChart3,
  MessageCircle,
  Printer,
  Clock,
  Tag,
  Target,
  Zap,
  Wallet,
  Users,
  Image as ImageIcon,
  Utensils,
  Code,
  QrCode
} from 'lucide-react';

interface PlanModule {
  module_id: string;
  modules: {
    name: string;
    icon: string | null;
    key: string | null;
  };
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  status: string;
  is_popular?: boolean;
  features: any;
  promotion_active?: boolean;
  discount_price?: number | null;
  discount_percentage?: number | null;
  promotion_start_date?: string | null;
  promotion_end_date?: string | null;
  promotion_label?: string | null;
  plan_modules?: PlanModule[];
}

export const PlansSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allModules, setAllModules] = useState<{ id: string; name: string; icon: string | null }[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('status', 'active')
          .order('price', { ascending: true });

        if (plansError) {
          console.error('Erro ao buscar planos:', plansError);
          return;
        }

        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, name, icon')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (modulesError) {
          console.error('Erro ao buscar módulos:', modulesError);
        } else {
          setAllModules(modulesData || []);
        }

        const { data: planModulesData, error: planModulesError } = await supabase
          .from('plan_modules')
          .select(`
            plan_id,
            module_id,
            modules!inner(name, icon, key)
          `);

        if (planModulesError) {
          console.error('Erro ao buscar módulos dos planos:', planModulesError);
        }

        const plansWithModules = (plansData || []).map(plan => {
          const planModules = (planModulesData || [])
            .filter(pm => pm.plan_id === plan.id)
            .map(pm => ({
              module_id: pm.module_id,
              modules: pm.modules as { name: string; icon: string | null; key: string | null }
            }));
          
          return {
            ...plan,
            plan_modules: planModules
          };
        });

        setPlans(plansWithModules);
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
      }
    };

    fetchPlans();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return Check;
    
    const iconMap: Record<string, any> = {
      'Menu': Menu,
      'ShoppingCart': Package,
      'Truck': Truck,
      'Palette': Palette,
      'BarChart': BarChart3,
      'MessageCircle': MessageCircle,
      'Printer': Printer,
      'Calendar': Clock,
      'Tag': Tag,
      'Megaphone': Target,
      'ExternalLink': Zap,
      'Wallet': Wallet,
      'Users': Users,
      'Image': ImageIcon,
      'Utensils': Utensils,
      'Code': Code,
      'QrCode': QrCode
    };
    
    return iconMap[iconName] || Check;
  };

  return (
    <section id="plans" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Planos Simples e Transparentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sem pegadinhas. Sem taxas escondidas. Apenas um valor fixo mensal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const featuresArray = Object.keys(plan.features || {});
            const isPremium = plan.name?.toLowerCase().includes('premium');
            
            return (
              <Card 
                key={plan.id} 
                className={`p-6 text-center relative w-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                  isPremium 
                    ? 'border-2 border-amber-400 shadow-2xl shadow-amber-200/30 scale-[1.02]' 
                    : plan.is_popular 
                      ? 'border-primary shadow-2xl scale-[1.02]' 
                      : 'shadow-lg'
                }`}
              >
                {isPremium && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold">
                    👑 Premium
                  </Badge>
                )}
                {plan.is_popular && !isPremium && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                    ⭐ Mais Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description || 'Plano ideal para seu negócio'}</CardDescription>
                  
                  <div className="mt-3">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Marketing Digital Incluso
                    </Badge>
                  </div>
                  
                  {plan.promotion_active && plan.discount_price && plan.discount_percentage ? (
                    <div className="mt-4 space-y-2">
                      <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                        {plan.discount_percentage}% OFF
                      </Badge>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl text-muted-foreground line-through">
                          {formatPrice(plan.price)}
                        </span>
                        <div className="text-4xl font-bold text-primary">
                          {formatPrice(plan.discount_price)}
                        </div>
                      </div>
                      <p className="text-sm text-green-600 font-semibold">
                        Economize {formatPrice(plan.price - plan.discount_price)}
                      </p>
                      <p className="text-muted-foreground text-sm">/mês</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-primary">{formatPrice(plan.price)}</div>
                      <p className="text-muted-foreground">/mês</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {allModules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                        Módulos
                      </p>
                      <ul className="space-y-1.5 text-left">
                        {[...allModules]
                          .sort((a, b) => {
                            const aIncluded = plan.plan_modules?.some(pm => pm.module_id === a.id);
                            const bIncluded = plan.plan_modules?.some(pm => pm.module_id === b.id);
                            if (aIncluded && !bIncluded) return -1;
                            if (!aIncluded && bIncluded) return 1;
                            return a.name.localeCompare(b.name);
                          })
                          .map((module) => {
                          const isIncluded = plan.plan_modules?.some(
                            pm => pm.module_id === module.id
                          );
                          
                          return (
                            <li 
                              key={module.id} 
                              className={`flex items-center space-x-2 ${!isIncluded ? 'opacity-50' : ''}`}
                            >
                              {isIncluded ? (
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${!isIncluded ? 'line-through text-muted-foreground/60' : ''}`}>
                                {module.name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {featuresArray.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                        Extras
                      </p>
                      <ul className="space-y-1.5 text-left">
                        {featuresArray.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link to="/signup" className="block">
                    <Button 
                      className="w-full mt-4" 
                      variant={isPremium ? 'default' : plan.is_popular ? 'default' : 'outline'}
                    >
                      {isPremium ? '👑 Escolher Premium' : 'Começar Agora'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
