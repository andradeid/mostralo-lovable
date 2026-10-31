import { useState } from 'react';
import { Beer, CreditCard, ShoppingCart, Trophy, Users, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Trecho único da página de Arenas: comanda do grupo.

export const ArenaGroupOrder = () => {
  const [orderItems, setOrderItems] = useState([
    { id: 1, nome: 'Cerveja Heineken', quantidade: 4, preco: 14.00, categoria: 'bebida' },
    { id: 2, nome: 'Água Mineral 500ml', quantidade: 2, preco: 5.00, categoria: 'bebida' },
    { id: 3, nome: 'Porção de Fritas', quantidade: 1, preco: 35.00, categoria: 'snack' },
    { id: 4, nome: 'Aluguel de Raquete', quantidade: 2, preco: 25.00, categoria: 'aluguel' }
  ]);

  const total = orderItems.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
  const perPerson = total / 4; // Dividido por 4 pessoas

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'bebida': return Beer;
      case 'snack': return UtensilsCrossed;
      case 'aluguel': return Trophy;
      default: return ShoppingCart;
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'bebida': return 'text-amber-400';
      case 'snack': return 'text-orange-400';
      case 'aluguel': return 'text-lime-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/30 mb-4">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comandas Integradas
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Controle cada <span className="text-lime-400">centavo</span> consumido pelo grupo
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Comanda única por turma, divisão automática e fechamento sem stress.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/20 to-lime-500/20 p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Turma do Beach 🎾</h3>
                    <p className="text-zinc-400 text-sm">Beach Tennis 1 • 16:00 às 17:00</p>
                  </div>
                </div>
                <Badge className="bg-lime-500/20 text-lime-400">4 pessoas</Badge>
              </div>
            </div>

            {/* Items */}
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                {orderItems.map((item) => {
                  const Icon = getCategoryIcon(item.categoria);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center ${getCategoryColor(item.categoria)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.nome}</p>
                          <p className="text-zinc-500 text-sm">R$ {item.preco.toFixed(2)} cada</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1">
                          <button className="text-zinc-400 hover:text-white">-</button>
                          <span className="text-white font-medium w-6 text-center">{item.quantidade}</span>
                          <button className="text-zinc-400 hover:text-white">+</button>
                        </div>
                        <p className="text-lime-400 font-bold w-20 text-right">
                          R$ {(item.quantidade * item.preco).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item */}
              <button className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-lime-400 hover:border-lime-500/50 transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Adicionar Item
              </button>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-lime-400">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-400 bg-orange-500/10 rounded-lg px-4 py-2">
                  <span>Por pessoa (÷4)</span>
                  <span className="font-bold">R$ {perPerson.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button className="flex-1 bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white">
                  <CreditCard className="mr-2 w-4 h-4" />
                  Fechar Conta
                </Button>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <Users className="mr-2 w-4 h-4" />
                  Dividir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
