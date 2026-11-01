import { Bell, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Trecho único da página de Pet Shops: linha do tempo da recorrência de ração + prévia do WhatsApp.

const timelineSteps = [
  {
    day: 'Dia 01',
    icon: ShoppingBag,
    title: 'Compra de Ração',
    description: 'Cliente compra saco de 15kg',
    color: 'from-green-500 to-emerald-500',
    emoji: '📦'
  },
  {
    day: 'Dia 25',
    icon: Bell,
    title: 'Lembrete Automático',
    description: 'Sistema envia mensagem no WhatsApp',
    color: 'from-amber-500 to-yellow-500',
    emoji: '📲'
  },
  {
    day: 'Dia 28',
    icon: Wallet,
    title: 'Nova Venda',
    description: 'Cliente compra novamente',
    color: 'from-orange-500 to-amber-500',
    emoji: '💰'
  }
];

export const PetRecurrenceTimeline = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
          <TrendingUp className="w-4 h-4 mr-2" />
          O Pulo do Gato 🐱
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Vendas de ração no <span className="text-orange-500">piloto automático</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Você define o ciclo da ração e o lembrete sai sozinho no WhatsApp antes de acabar. 
          <strong className="text-white"> Não perca mais venda para o supermercado!</strong>
        </p>
      </div>
      
      {/* Timeline Desktop */}
      <div className="hidden md:block max-w-4xl mx-auto">
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-zinc-800 rounded-full -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-amber-500 to-orange-500 rounded-full -translate-y-1/2 animate-pulse" style={{ width: '100%' }} />
          
          <div className="relative flex justify-between">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center w-1/3">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-4xl shadow-lg mb-4 relative z-10`}>
                  {step.emoji}
                </div>
                <Badge className="mb-2 bg-zinc-800 text-zinc-300 border-zinc-700">
                  {step.day}
                </Badge>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm max-w-[200px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Timeline Mobile */}
      <div className="md:hidden max-w-sm mx-auto">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-amber-500 to-orange-500 rounded-full" />
          
          <div className="space-y-8">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 relative">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 relative z-10`}>
                  {step.emoji}
                </div>
                <div className="pt-2">
                  <Badge className="mb-2 bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
                    {step.day}
                  </Badge>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="text-zinc-400 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* WhatsApp Preview */}
      <div className="max-w-md mx-auto mt-12">
        <Card className="bg-[#1f2c34] border-zinc-700 overflow-hidden">
          <CardHeader className="bg-[#2a3942] border-b border-zinc-700 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-xl">
                🐕
              </div>
              <div>
                <p className="text-white font-semibold">PetShop Amigo Fiel</p>
                <p className="text-green-400 text-xs">online</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="bg-[#005c4b] rounded-lg rounded-tl-none p-3 max-w-[85%]">
              <p className="text-white text-sm">
                Olá! 🐾 A ração do <strong>Thor</strong> está acabando!
              </p>
              <p className="text-white text-sm mt-2">
                📦 <strong>Golden Formula - 15kg</strong>
              </p>
              <p className="text-white text-sm mt-2">
                🛒 Clique aqui para fazer seu pedido e garanta 10% de desconto na entrega!
              </p>
              <p className="text-zinc-300 text-xs mt-2 text-right">14:32 ✓✓</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);
