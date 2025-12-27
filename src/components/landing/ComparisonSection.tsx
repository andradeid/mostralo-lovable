import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  Store,
  Sparkles,
  Wallet,
  Monitor,
  Megaphone,
  Shield,
  ClipboardList,
  QrCode,
  Tablet
} from 'lucide-react';

export const ComparisonSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2">
            <Target className="w-4 h-4 mr-2" />
            Comparativo Real
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Mostralo vs Concorrentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Por que pagar R$ 800-2.000/mês em agência de marketing quando você pode ter TUDO INCLUSO?
          </p>
        </div>

        {/* Tabela Comparativa */}
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <div className="min-w-[800px] bg-white dark:bg-slate-950 rounded-xl border shadow-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 bg-muted/50">
              <div className="p-4 font-semibold border-r">Recurso</div>
              <div className="p-4 text-center font-semibold border-r">Anota AI</div>
              <div className="p-4 text-center font-semibold border-r">Goomer</div>
              <div className="p-4 text-center font-semibold border-r">Cardápio Web</div>
              <div className="p-4 text-center font-semibold bg-primary/10">
                <div className="flex items-center justify-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <span className="text-primary">MOSTRALO</span>
                </div>
              </div>
            </div>

            {/* Preço */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r">Preço inicial</div>
              <div className="p-4 text-center border-r">R$ 399+</div>
              <div className="p-4 text-center border-r">R$ 299+</div>
              <div className="p-4 text-center border-r">R$ 397+</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 font-bold text-green-600">
                R$ 397,90
              </div>
            </div>

            {/* Taxa por pedido */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r">Taxa por pedido</div>
              <div className="p-4 text-center border-r">Sim</div>
              <div className="p-4 text-center border-r">Sim</div>
              <div className="p-4 text-center border-r">Não</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 font-bold text-green-600">
                0%
              </div>
            </div>

            {/* Marketing Digital */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Marketing Digital
              </div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-green-600">✅ INCLUSO</Badge>
              </div>
            </div>

            {/* IA WhatsApp */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r">IA WhatsApp 24/7</div>
              <div className="p-4 text-center border-r text-green-600">✅</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 text-green-600 font-bold">
                ✅
              </div>
            </div>

            {/* App Entregadores */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r">App para Entregadores</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 text-green-600 font-bold">
                ✅
              </div>
            </div>

            {/* Agendamento Posts */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r">Agendamento de Posts</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-green-600">Ilimitado</Badge>
              </div>
            </div>

            {/* Análise Concorrentes */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r">Análise de Concorrentes</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 text-green-600 font-bold">
                ✅
              </div>
            </div>

            {/* Gestão Financeira Automática */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Gestão Financeira Automática
              </div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-emerald-600">✅ INCLUSO</Badge>
              </div>
            </div>

            {/* Painel Digital (TV) */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-600" />
                Painel Digital (TV)
              </div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-purple-600">✅ PREMIUM</Badge>
              </div>
            </div>

            {/* Chamada de Senhas + IA */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                Chamada de Senhas + IA
              </div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-amber-600">✅ ElevenLabs</Badge>
              </div>
            </div>

            {/* SENTINELA - Recompra */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                SENTINELA - Recompra
              </div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-orange-500">✅ PREMIUM</Badge>
              </div>
            </div>

            {/* PDV e Comandas (App Garçom) */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-orange-600" />
                App Garçom / Comanda Digital
              </div>
              <div className="p-4 text-center border-r text-green-600">✅</div>
              <div className="p-4 text-center border-r text-green-600">✅</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-orange-600">✅ INCLUSO</Badge>
              </div>
            </div>

            {/* Pedidos na Mesa (QR Code) */}
            <div className="grid grid-cols-5 border-t">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                Pedidos na Mesa (QR Code)
              </div>
              <div className="p-4 text-center border-r text-green-600">✅</div>
              <div className="p-4 text-center border-r text-green-600">✅</div>
              <div className="p-4 text-center border-r text-green-600">✅</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-blue-600">✅ INCLUSO</Badge>
              </div>
            </div>

            {/* Totem de Autoatendimento */}
            <div className="grid grid-cols-5 border-t bg-muted/20">
              <div className="p-4 font-medium border-r flex items-center gap-2">
                <Tablet className="w-4 h-4 text-indigo-600" />
                Totem de Autoatendimento
              </div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center border-r text-amber-600">💰 Pago</div>
              <div className="p-4 text-center border-r text-destructive">❌</div>
              <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                <Badge className="bg-indigo-600">✅ INCLUSO</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-xl font-bold mb-6 text-primary">
            🚀 Único no Brasil: Delivery + App Garçom + Mesa QR + Totem + Marketing + Financeiro + Painel Digital
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg h-14 px-8 shadow-lg hover:shadow-xl">
              <Sparkles className="mr-2 h-5 w-5" />
              Experimentar Grátis por 7 Dias
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
