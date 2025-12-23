import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles,
  Clock,
  Smartphone,
  Bot,
  BarChart3,
  Target,
  Zap,
  Gift,
  CheckCircle
} from 'lucide-react';

export const MarketingDigitalSection = () => {
  return (
    <section id="marketing-digital" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Marketing Digital Completo
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Gestão de Redes Sociais
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              Inclusa em Todos os Planos
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo em um único lugar para crescer o <strong>SEU</strong> negócio, não o do iFood.
          </p>
        </div>

        {/* Grid de Features de Marketing */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Agendamento Ilimitado de Posts</h3>
            <p className="text-muted-foreground">
              Programe seus posts com antecedência. Nunca mais se preocupe em postar todo dia.
            </p>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <Smartphone className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Todas as Redes Sociais</h3>
            <p className="text-muted-foreground">
              Instagram, Facebook, TikTok, LinkedIn, Google Meu Negócio. Tudo em um painel só.
            </p>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">IA para Criar Legendas Profissionais</h3>
            <p className="text-muted-foreground">
              Nossa IA escreve legendas envolventes que convertem. Você só aprova e agenda.
            </p>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <BarChart3 className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Relatórios de Performance</h3>
            <p className="text-muted-foreground">
              Veja o que está funcionando. Alcance, engajamento, cliques. Dados reais.
            </p>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <Target className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Análise de Concorrentes</h3>
            <p className="text-muted-foreground">
              Veja o que seus concorrentes estão fazendo e fique sempre um passo à frente.
            </p>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <Zap className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Integração com Facebook/Google Ads</h3>
            <p className="text-muted-foreground">
              Conecte suas campanhas pagas e gerencie tudo em um único painel.
            </p>
          </Card>
        </div>

        {/* Card de Destaque: INCLUSO EM TODOS OS PLANOS */}
        <Card className="p-8 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 shadow-xl max-w-3xl mx-auto">
          <div className="text-center space-y-4">
            <Badge className="bg-green-600 text-white text-lg px-6 py-2">
              <Gift className="w-5 h-5 mr-2" />
              INCLUSO EM TODOS OS PLANOS
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold">
              Marketing Digital Completo
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">1 Perfil de Rede Social</p>
                  <p className="text-sm text-muted-foreground">Escolha Instagram, Facebook, TikTok, etc.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Posts Ilimitados</p>
                  <p className="text-sm text-muted-foreground">Agende quantos quiser, sem limite</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              💡 Precisa de mais perfis? Fale com nosso comercial para condições especiais.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
