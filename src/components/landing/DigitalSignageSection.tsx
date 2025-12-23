import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Monitor, 
  Tv, 
  ImageIcon, 
  Video, 
  RefreshCcw, 
  Clock,
  Smartphone,
  Crown,
  Megaphone,
  Layers,
  Settings
} from 'lucide-react';

const features = [
  {
    icon: ImageIcon,
    title: 'Imagens HD',
    description: 'Upload de imagens em alta qualidade para exibição profissional'
  },
  {
    icon: Video,
    title: 'Vídeos e Mídia',
    description: 'Suporte a vídeos promocionais e conteúdos dinâmicos'
  },
  {
    icon: Layers,
    title: 'Transições Animadas',
    description: 'Efeitos Fade, Slide e transições suaves entre conteúdos'
  },
  {
    icon: Clock,
    title: 'Relógio Integrado',
    description: 'Exiba data e hora com posição configurável na tela'
  },
  {
    icon: RefreshCcw,
    title: 'Gerenciamento Remoto',
    description: 'Atualize o conteúdo de qualquer lugar, em tempo real'
  },
  {
    icon: Smartphone,
    title: 'Orientação Flexível',
    description: 'Suporte a telas horizontais (landscape) e verticais (portrait)'
  },
  {
    icon: Megaphone,
    title: 'Integração Chamada de Senhas',
    description: 'Combine mídia com sistema de chamadas na mesma tela'
  },
  {
    icon: Settings,
    title: 'URL Pública',
    description: 'Link dedicado para exibir em TVs, tablets e projetores'
  }
];

export function DigitalSignageSection() {
  return (
    <section id="painel-digital" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <Monitor className="w-4 h-4 mr-2" />
            Painel Digital
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Transforme sua TV em uma{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Mídia Inteligente
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Exiba promoções, cardápio e conteúdos dinâmicos na TV do seu estabelecimento.
            Atualize remotamente de qualquer lugar.
          </p>
        </div>

        {/* Grid de Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Visual Mockup */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="overflow-hidden border-2 border-purple-300/50 dark:border-purple-700/50 shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 flex items-center gap-2">
              <Tv className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Painel Digital - Prévia</span>
            </div>
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 relative flex items-center justify-center">
              <div className="absolute top-4 right-4 text-white/80 text-sm font-mono bg-black/40 px-3 py-1 rounded">
                12:45:30
              </div>
              <div className="text-center space-y-4">
                <Monitor className="h-16 w-16 text-purple-400 mx-auto animate-pulse" />
                <div className="text-white text-2xl md:text-3xl font-bold">
                  Sua Promoção Aqui
                </div>
                <p className="text-white/60 text-sm md:text-base max-w-md">
                  Imagens, vídeos e conteúdos rotativos em tela cheia
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Card Premium */}
        <Card className="max-w-3xl mx-auto mt-12 p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-300/50 dark:border-purple-700/50">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Crown className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-600 dark:text-purple-400">Módulo Premium</span>
          </div>
          <p className="text-center text-muted-foreground">
            Transforme sua loja em um ambiente moderno com mídia digital gerenciada pelo próprio sistema.
            Ideal para restaurantes, lanchonetes, clínicas e qualquer estabelecimento com TV.
          </p>
        </Card>
      </div>
    </section>
  );
}
