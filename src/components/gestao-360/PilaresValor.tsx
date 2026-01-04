import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Target, 
  Bot, 
  MessageSquare, 
  Settings, 
  Cog,
  Users,
  Star,
  Check,
  ArrowRight
} from "lucide-react";

interface Pilar {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  cor: string;
  corBg: string;
  corBorder: string;
  icone: React.ReactNode;
  features: string[];
  resultado: string;
}

const pilares: Pilar[] = [
  {
    id: "atracao",
    numero: 1,
    titulo: "Atração Preditiva",
    subtitulo: "A Máquina de Clientes",
    cor: "text-orange-400",
    corBg: "bg-orange-500/10",
    corBorder: "border-orange-500/30",
    icone: <Globe className="w-8 h-8" />,
    features: [
      "Integração automática com Google Shopping Local",
      "Vitrine digital sempre atualizada com o estoque físico",
      "SEO otimizado para buscas locais"
    ],
    resultado: "Sua loja é encontrada por quem quer comprar AGORA"
  },
  {
    id: "conversao",
    numero: 2,
    titulo: "Conversão Autônoma",
    subtitulo: "O Vendedor que Não Dorme",
    cor: "text-blue-400",
    corBg: "bg-blue-500/10",
    corBorder: "border-blue-500/30",
    icone: <Bot className="w-8 h-8" />,
    features: [
      "Agente de IA no WhatsApp para atendimento 24h",
      "Totens de Autoatendimento (+25% ticket médio)",
      "Cardápio digital inteligente com upsell automático"
    ],
    resultado: "Vendas acontecendo mesmo quando você dorme"
  },
  {
    id: "eficiencia",
    numero: 3,
    titulo: "Eficiência Operacional",
    subtitulo: "O Fim do Caos",
    cor: "text-green-400",
    corBg: "bg-green-500/10",
    corBorder: "border-green-500/30",
    icone: <Cog className="w-8 h-8" />,
    features: [
      "KDS (Monitor de Produção) para zerar erros",
      "Gestão de estoque integrada em tempo real",
      "Financeiro e fluxo de caixa automatizados"
    ],
    resultado: "Operação fluindo sem ruído"
  },
  {
    id: "talentos",
    numero: 4,
    titulo: "Gestão de Talentos",
    subtitulo: "Performance Humana",
    cor: "text-purple-400",
    corBg: "bg-purple-500/10",
    corBorder: "border-purple-500/30",
    icone: <Users className="w-8 h-8" />,
    features: [
      "Cartões Digitais individuais para profissionais",
      "Agendamento Online com gestão de escalas",
      "Ranking de Avaliações e Performance individual"
    ],
    resultado: "Sua equipe performando no máximo potencial"
  }
];

export function PilaresValor() {
  const [pilarAtivo, setPilarAtivo] = useState<string | null>(null);

  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-800 text-slate-300 border-slate-700">
            OS 4 PILARES
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            A Gestão <span className="text-orange-400">Imbatível</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Cada pilar resolve uma dor específica. Juntos, formam o ecossistema 
            mais completo para negócios locais.
          </p>
        </div>

        {/* Grid 2x2 */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {pilares.map((pilar) => (
            <Card
              key={pilar.id}
              className={`relative overflow-hidden bg-slate-800/50 border-2 transition-all duration-300 cursor-pointer
                ${pilarAtivo === pilar.id ? `${pilar.corBorder} shadow-lg` : 'border-slate-700/50 hover:border-slate-600'}
              `}
              onMouseEnter={() => setPilarAtivo(pilar.id)}
              onMouseLeave={() => setPilarAtivo(null)}
            >
              {/* Background glow */}
              <div className={`absolute inset-0 ${pilar.corBg} opacity-0 transition-opacity duration-300 ${pilarAtivo === pilar.id ? 'opacity-100' : ''}`} />
              
              <div className="relative p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${pilar.corBg} ${pilar.cor}`}>
                      {pilar.icone}
                    </div>
                    <div>
                      <Badge className={`${pilar.corBg} ${pilar.cor} border-0 text-xs mb-1`}>
                        PILAR {pilar.numero}
                      </Badge>
                      <h3 className="text-xl md:text-2xl font-bold text-white">
                        {pilar.titulo}
                      </h3>
                      <p className="text-sm text-slate-400">{pilar.subtitulo}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {pilar.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <Check className={`w-5 h-5 ${pilar.cor} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Resultado */}
                <div className={`p-4 rounded-lg ${pilar.corBg} border ${pilar.corBorder}`}>
                  <div className="flex items-center gap-2">
                    <ArrowRight className={`w-4 h-4 ${pilar.cor}`} />
                    <p className={`text-sm font-semibold ${pilar.cor}`}>
                      {pilar.resultado}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Central Message */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-lg">
            Todos os pilares <span className="text-orange-400 font-semibold">conversam entre si</span>.
            <br />
            O cliente que você atrai hoje vira dado de performance amanhã.
          </p>
        </div>
      </div>
    </section>
  );
}
