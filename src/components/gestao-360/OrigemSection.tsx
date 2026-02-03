import { Badge } from "@/components/ui/badge";
import { 
  UtensilsCrossed, 
  Scissors, 
  Stethoscope, 
  Dumbbell, 
  Pill, 
  PawPrint,
  Building2,
  ArrowRight,
  Zap
} from "lucide-react";

const segmentos = [
  { nome: "Gastronomia", icone: UtensilsCrossed },
  { nome: "Barbearias & Salões", icone: Scissors },
  { nome: "Clínicas & Consultórios", icone: Stethoscope },
  { nome: "Academias & Studios", icone: Dumbbell },
  { nome: "Farmácias & Suplementos", icone: Pill },
  { nome: "Pet Shops & Veterinárias", icone: PawPrint },
  { nome: "Franquias & Redes", icone: Building2 },
];

export function OrigemSection() {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Zap className="w-3 h-3 mr-1" />
              NOSSA ORIGEM
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Nascida no Varejo,
              <br />
              <span className="text-orange-400">Evoluída para Qualquer Negócio</span>
            </h2>
          </div>

          {/* Main Quote Box */}
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-lg" />
            <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 md:p-10 rounded-2xl border border-slate-700/50">
              <div className="flex items-start gap-4">
                <div className="hidden md:block">
                  <UtensilsCrossed className="w-12 h-12 text-orange-400" />
                </div>
                <div>
                  <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-6">
                    "Nascemos no ambiente mais desafiador do varejo: a{" "}
                    <span className="text-orange-400 font-semibold">gastronomia de alta rotatividade</span>. 
                    Lá, aprendemos que cada segundo conta. Cada pedido atrasado é um cliente perdido. 
                    Cada erro de estoque é prejuízo direto."
                  </p>
                  <div className="flex items-center gap-2 text-slate-400">
                    <ArrowRight className="w-5 h-5 text-orange-400" />
                    <p className="text-base md:text-lg">
                      Hoje, essa mesma{" "}
                      <span className="text-white font-semibold">tecnologia de elite</span>{" "}
                      foi expandida para atender qualquer negócio que precise de agilidade, 
                      presença digital e gestão de equipe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Evolution */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-12">
            <div className="flex items-center gap-3 bg-slate-800/50 px-6 py-3 rounded-full border border-slate-700/50">
              <UtensilsCrossed className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">Cardápio Digital</span>
            </div>
            <ArrowRight className="w-6 h-6 text-orange-400 rotate-90 md:rotate-0" />
            <div className="flex items-center gap-3 bg-orange-500/20 px-6 py-3 rounded-full border border-orange-500/30">
              <Zap className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-semibold">Ecossistema Completo</span>
            </div>
          </div>

          {/* Segmentos Grid */}
          <div className="text-center mb-8">
            <p className="text-slate-400 mb-6">
              <span className="text-white font-semibold">50+ segmentos</span> já utilizam a tecnologia Mostralo
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {segmentos.map((seg) => (
                <div
                  key={seg.nome}
                  className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all duration-300"
                >
                  <seg.icone className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">{seg.nome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Message */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              E muitos outros: Óticas, Lojas de Roupas, Escritórios, Coworkings...
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
