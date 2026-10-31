import { AlertTriangle, Droplets, Heart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Trecho único da página de Pet Shops: perfil completo do pet.

interface Pet {
  nome: string;
  raca: string;
  emoji: string;
  ultimaVacina: string;
  alergias: string[];
  racaoPreferida: string;
  diasParaAcabar: number;
  proximoBanho: string;
}

const demoPet: Pet = {
  nome: 'Thor',
  raca: 'Golden Retriever',
  emoji: '🐕',
  ultimaVacina: '15/10/2024',
  alergias: ['Frango', 'Milho'],
  racaoPreferida: 'Golden Formula - 15kg',
  diasParaAcabar: 5,
  proximoBanho: 'Sexta, 10:00'
};

export const PetProfileSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Heart className="w-4 h-4 mr-2" />
          Perfil Completo do Pet
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Conheça cada pet como <span className="text-orange-500">ninguém mais conhece</span>
        </h2>
        <p className="text-zinc-400">
          Cadastro completo com histórico, alergias, vacinas e preferências. Gera confiança total do tutor.
        </p>
      </div>
      
      {/* Pet Profile Card */}
      <div className="max-w-lg mx-auto">
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-4xl">
                {demoPet.emoji}
              </div>
              <div>
                <CardTitle className="text-2xl text-white">{demoPet.nome}</CardTitle>
                <p className="text-zinc-400">{demoPet.raca}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Vacinas em dia
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Próximo banho */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-zinc-300">Próximo Banho</span>
              </div>
              <span className="text-white font-semibold">{demoPet.proximoBanho}</span>
            </div>
            
            {/* Última vacina */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-zinc-300">Última Vacina</span>
              </div>
              <span className="text-white font-semibold">{demoPet.ultimaVacina}</span>
            </div>
            
            {/* Alergias */}
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-semibold">Alergias</span>
              </div>
              <div className="flex gap-2">
                {demoPet.alergias.map((alergia, i) => (
                  <Badge key={i} className="bg-red-500/20 text-red-300 border-red-500/30">
                    {alergia}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Ração preferida com alerta */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-semibold">Ração Preferida</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse">
                  ⚠️ Acaba em {demoPet.diasParaAcabar} dias
                </Badge>
              </div>
              <p className="text-white">{demoPet.racaoPreferida}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);
