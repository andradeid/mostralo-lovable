import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useCountUp } from '@/hooks/useCountUp';
import { 
  DollarSign,
  TrendingDown,
  TrendingUp,
  Check,
  X,
  Sparkles
} from 'lucide-react';

export const SavingsCalculator = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState(10000);
  const [revenueInput, setRevenueInput] = useState('10000');

  const marketplaceFeePercentage = 25;
  const mostraloPlan = 397.90;
  
  const marketplaceFeeMonthly = monthlyRevenue * (marketplaceFeePercentage / 100);
  const marketplaceFeeYearly = marketplaceFeeMonthly * 12;
  const mostraloYearly = mostraloPlan * 12;
  const savingsYearly = marketplaceFeeYearly - mostraloYearly;
  const savingsPercentage = ((savingsYearly / marketplaceFeeYearly) * 100).toFixed(0);

  // Animação dos números
  const animatedSavings = useCountUp(savingsYearly, 2000);

  const handleRevenueChange = (value: number[]) => {
    setMonthlyRevenue(value[0]);
    setRevenueInput(value[0].toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setRevenueInput(value);
    const numValue = parseInt(value) || 0;
    if (numValue <= 100000) {
      setMonthlyRevenue(numValue);
    }
  };

  return (
    <section id="calculadora" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10 w-full overflow-x-hidden">
      <div className="container px-4 md:px-6 max-w-full">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Quanto Você Está Doando ao iFood?
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Descubra Quanto Você Está
              <br />
              <span className="text-red-600 dark:text-red-500">
                Investindo no Negócio DELES
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cada real que você paga em taxas constrói o império deles.
              <br />
              <strong>Veja quanto você poderia investir no SEU restaurante:</strong>
            </p>
          </div>

          <Card className="p-6 md:p-10 bg-gradient-to-br from-card to-card/50 border-2 shadow-2xl">
            <div className="space-y-8">
              {/* Input de Faturamento */}
              <div className="space-y-4">
                <label className="text-lg font-semibold">
                  Quanto você fatura por mês?
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">R$</span>
                  <Input
                    type="text"
                    value={revenueInput}
                    onChange={handleInputChange}
                    className="text-2xl font-bold h-14 text-center"
                    placeholder="10000"
                  />
                </div>
                <Slider
                  value={[monthlyRevenue]}
                  onValueChange={handleRevenueChange}
                  max={100000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>R$ 1.000</span>
                  <span>R$ 100.000</span>
                </div>
              </div>

              {/* Comparação Visual */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* iFood/Rappi */}
                <Card className="p-6 bg-destructive/10 border-destructive/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">iFood / Rappi</h3>
                      <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Taxa por pedido</p>
                      <p className="text-3xl font-bold text-destructive">{marketplaceFeePercentage}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Você paga por mês</p>
                      <p className="text-2xl font-bold text-destructive">
                        R$ {marketplaceFeeMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Você paga por ano</p>
                      <p className="text-2xl font-bold text-destructive">
                        R$ {marketplaceFeeYearly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-destructive/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="text-sm">Clientes são do marketplace</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="text-sm">Zero controle de dados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="text-sm">Você financia concorrentes</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Mostralo */}
                <Card className="p-6 bg-primary/10 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                    RECOMENDADO
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">Mostralo</h3>
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Taxa por pedido</p>
                      <p className="text-3xl font-bold text-primary">0%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Você paga por mês</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {mostraloPlan.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Você paga por ano</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {mostraloYearly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-primary/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">100% dos clientes são seus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Todos os dados para você</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Invista no SEU negócio</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Resultado */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 md:p-8 text-center border-2 border-green-500/30">
                <p className="text-lg mb-2">Com o Mostralo você economiza</p>
                <p className="text-4xl md:text-6xl font-black text-green-600 dark:text-green-400 mb-2">
                  R$ {animatedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">
                  por ano ({savingsPercentage}% de economia)
                </p>
                <p className="text-muted-foreground mb-6">
                  Isso é dinheiro que fica no SEU bolso, não no do marketplace.
                </p>
                <Link to="/signup">
                  <Button size="lg" className="text-lg h-14 px-8 shadow-lg hover:shadow-xl">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Começar a Economizar Agora
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
