import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Lock
} from 'lucide-react';

export const ProblemsSection = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950/30 dark:to-orange-950/30 border-y border-red-200 dark:border-red-800 w-full overflow-x-hidden">
      <div className="container px-4 md:px-6 max-w-full">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            O Que Eles Não Querem Que Você Saiba
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-red-900 dark:text-red-100">
            Cada Real que Você Paga ao iFood
            <br />
            <span className="text-red-600 dark:text-red-400">
              Está Construindo Seu Maior Concorrente
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Base de Clientes Deles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Todo cliente que compra através do marketplace é <strong>fidelizado ao aplicativo</strong>, não ao seu restaurante.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Lucros Deles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Os <strong>25% de taxa</strong> que você paga financiam campanhas de marketing para trazer MAIS restaurantes competindo com você.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Dados Deles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Você não tem acesso aos dados dos clientes. <strong>Eles vendem esses dados</strong> para seus concorrentes fazerem remarketing.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-red-600 dark:bg-red-700 text-white p-6 rounded-lg mt-8 shadow-2xl">
            <p className="text-xl md:text-2xl font-bold mb-2">
              🚨 Quanto mais você vende no marketplace, mais FORTE eles ficam e mais FRACO você fica.
            </p>
            <p className="text-base opacity-90">
              É hora de parar de alimentar o sistema que te explora. Invista no SEU negócio.
            </p>
          </div>
          
        </div>
      </div>
    </section>
  );
};
