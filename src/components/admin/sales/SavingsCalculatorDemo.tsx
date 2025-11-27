import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { calculateEconomyDemo } from '@/utils/salesPromptGenerator';

export function SavingsCalculatorDemo() {
  const [revenue, setRevenue] = useState(10000);

  const savings = calculateEconomyDemo(revenue);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧮 Simulador de Economia</CardTitle>
        <CardDescription>
          Teste a calculadora que será usada no prompt de vendas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Faturamento Mensal</label>
            <span className="text-lg font-bold text-primary">{formatCurrency(revenue)}</span>
          </div>
          <Slider
            value={[revenue]}
            onValueChange={(value) => setRevenue(value[0])}
            min={1000}
            max={50000}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>R$ 1.000</span>
            <span>R$ 50.000</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
              Taxa iFood (25%)
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(savings.ifoodFee)}/mês
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
              Mostralo (Fixo)
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(savings.mostraloFee)}/mês
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Economia Total</div>
            <div className="text-4xl font-bold text-primary">
              {formatCurrency(savings.monthlySavings)}
            </div>
            <div className="text-sm text-muted-foreground">por mês</div>
            
            <div className="pt-4 border-t border-primary/20 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Por ano</div>
                  <div className="font-bold">{formatCurrency(savings.annualSavings)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Por dia</div>
                  <div className="font-bold">{formatCurrency(savings.dailySavings)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          💡 Essa calculadora está integrada no prompt para uso com clientes
        </div>
      </CardContent>
    </Card>
  );
}
