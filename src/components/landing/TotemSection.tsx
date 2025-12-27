import { 
  Tablet, 
  CreditCard, 
  Hash, 
  Palette, 
  Clock, 
  ShoppingCart, 
  Monitor, 
  Moon,
  Users,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  { 
    icon: Tablet, 
    title: 'Autoatendimento', 
    description: 'Cliente faz pedido sozinho, sem fila',
    color: 'text-cyan-500'
  },
  { 
    icon: CreditCard, 
    title: 'Pagamento PIX', 
    description: 'QR Code integrado com confirmação automática',
    color: 'text-green-500'
  },
  { 
    icon: Hash, 
    title: 'Senha Automática', 
    description: 'Sistema gera senha e exibe na chamada',
    color: 'text-blue-500'
  },
  { 
    icon: Palette, 
    title: 'Personalizável', 
    description: 'Cores, logo e layout da sua marca',
    color: 'text-purple-500'
  },
  { 
    icon: Clock, 
    title: 'Timer Inteligente', 
    description: 'Reset automático após inatividade',
    color: 'text-orange-500'
  },
  { 
    icon: ShoppingCart, 
    title: 'Adicionais', 
    description: 'Cliente escolhe complementos direto',
    color: 'text-pink-500'
  },
  { 
    icon: Monitor, 
    title: 'Horizontal/Vertical', 
    description: 'Funciona em tablet ou totem vertical',
    color: 'text-indigo-500'
  },
  { 
    icon: Moon, 
    title: 'Modo Escuro', 
    description: 'Interface clara ou escura, você escolhe',
    color: 'text-slate-500'
  }
];

const benefits = [
  { icon: Users, text: 'Reduza filas de atendimento' },
  { icon: TrendingUp, text: 'Aumente o ticket médio em até 30%' },
  { icon: CheckCircle2, text: 'Libere equipe para produção' },
];

export function TotemSection() {
  return (
    <section id="totem" className="py-20 bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-4">
            <Tablet className="w-4 h-4 mr-2" />
            Totem de Autoatendimento
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Seu Cliente Faz o Pedido{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Sozinho
            </span>
          </h2>
          <p className="text-lg md:text-xl text-cyan-100/80 max-w-3xl mx-auto">
            Reduza filas, aumente o ticket médio e libere sua equipe. O cliente escolhe, 
            paga e recebe a senha — tudo sem precisar de atendente.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Mockup */}
          <div className="relative">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                {/* Totem Mockup */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 shadow-2xl">
                  {/* Screen Header */}
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-xl p-4 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Tablet className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg">Bem-vindo!</h3>
                    <p className="text-cyan-100 text-sm">Toque para fazer seu pedido</p>
                  </div>
                  
                  {/* Screen Body */}
                  <div className="bg-slate-950 p-4 space-y-3">
                    {/* Product cards mockup */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-3 bg-slate-600 rounded w-24 mb-1" />
                          <div className="h-2 bg-slate-700 rounded w-16" />
                        </div>
                        <div className="text-cyan-400 font-bold text-sm">R$ 19,90</div>
                      </div>
                    ))}
                    
                    {/* Footer */}
                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 bg-cyan-500 rounded-lg py-3 text-center text-white font-semibold text-sm">
                        Ver Carrinho
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Totem base */}
                <div className="flex justify-center mt-4">
                  <div className="w-8 h-12 bg-slate-700 rounded-b-lg" />
                </div>
              </CardContent>
            </Card>
            
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              PIX Integrado ✓
            </div>
          </div>

          {/* Right - Features */}
          <div className="space-y-8">
            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-medium text-lg">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <feature.icon className={`w-6 h-6 ${feature.color} mb-2`} />
                  <h4 className="text-white font-semibold text-sm mb-1">{feature.title}</h4>
                  <p className="text-cyan-100/60 text-xs">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Premium module note */}
            <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30">
              <CardContent className="p-4">
                <p className="text-cyan-100 text-sm">
                  <span className="font-semibold text-white">Módulo Premium:</span>{' '}
                  Funciona em qualquer tablet Android, iOS ou Windows. 
                  Configure em minutos e comece a usar imediatamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
