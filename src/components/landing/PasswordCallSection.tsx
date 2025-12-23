import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Megaphone, 
  Volume2, 
  Mic, 
  Tv,
  Palette,
  Settings,
  History,
  Wifi,
  Crown,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Vozes Naturais IA',
    description: 'Integração ElevenLabs com vozes realistas em português brasileiro'
  },
  {
    icon: Volume2,
    title: '3 Opções de Áudio',
    description: 'Beep simples, Web Speech nativo ou ElevenLabs premium'
  },
  {
    icon: Palette,
    title: '5 Templates Visuais',
    description: 'Modern, Minimalist, Festive, Corporate e Classic'
  },
  {
    icon: Settings,
    title: 'Textos Personalizáveis',
    description: 'Configure saudações e mensagens com variáveis {tipo}, {numero}'
  },
  {
    icon: History,
    title: 'Histórico em Tempo Real',
    description: 'Veja as últimas chamadas na lateral da tela'
  },
  {
    icon: Wifi,
    title: 'Atualização Instantânea',
    description: 'WebSocket para chamadas em tempo real sem recarregar'
  },
  {
    icon: Tv,
    title: 'Integração Painel Digital',
    description: 'Combine chamadas com mídia na mesma tela TV'
  },
  {
    icon: Sparkles,
    title: 'URL Pública',
    description: 'Link dedicado para exibir em TV, tablet ou projetor'
  }
];

const elevenLabsVoices = [
  { name: 'Daniel', type: 'Masculina clara', flag: '🇧🇷' },
  { name: 'Lily', type: 'Feminina suave', flag: '🇧🇷' },
  { name: 'Roger', type: 'Masculina profunda', flag: '🇧🇷' },
  { name: 'Sarah', type: 'Feminina profissional', flag: '🇧🇷' }
];

const voiceFeatures = [
  'Modelo multilingual v2',
  'Fallback automático para Web Speech',
  'Rate limit inteligente',
  'Suporte a API própria'
];

export function PasswordCallSection() {
  return (
    <section id="chamada-senhas" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white">
            <Megaphone className="w-4 h-4 mr-2" />
            Chamada de Senhas
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Chamada de Senhas com{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
              Voz Natural
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema profissional de chamada de senhas com integração <strong>ElevenLabs</strong>{' '}
            para vozes naturais em português brasileiro.
          </p>
        </div>

        {/* Grid de Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 border-amber-200/50 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Card Destaque ElevenLabs */}
        <Card className="max-w-4xl mx-auto mt-12 overflow-hidden border-2 border-amber-300/50 dark:border-amber-700/50 shadow-xl">
          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-4">
            <div className="flex items-center justify-center gap-3 text-white">
              <Mic className="h-7 w-7" />
              <span className="text-xl md:text-2xl font-bold">Integração ElevenLabs</span>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Vozes Recomendadas */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <span className="text-2xl">🎙️</span>
                  Vozes Recomendadas PT-BR
                </h4>
                <div className="space-y-3">
                  {elevenLabsVoices.map((voice, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                    >
                      <span className="text-xl">{voice.flag}</span>
                      <div>
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">- {voice.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recursos de Voz */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <span className="text-2xl">⚡</span>
                  Recursos de Voz
                </h4>
                <div className="space-y-3">
                  {voiceFeatures.map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="mt-8 p-4 bg-slate-900 rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-amber-400 text-sm uppercase tracking-wider">Prévia da Chamada</p>
                <p className="text-white text-3xl md:text-4xl font-bold animate-pulse">
                  🔊 "Senha 042, por favor!"
                </p>
                <p className="text-white/60 text-sm">Voz natural gerada por IA</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Premium */}
        <Card className="max-w-3xl mx-auto mt-8 p-6 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-300/50 dark:border-amber-700/50">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Crown className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">Módulo Premium</span>
          </div>
          <p className="text-center text-muted-foreground">
            Perfeito para fast-foods, padarias, laboratórios, clínicas e qualquer estabelecimento 
            que trabalhe com atendimento por senha. Voz profissional que impressiona os clientes.
          </p>
        </Card>
      </div>
    </section>
  );
}
