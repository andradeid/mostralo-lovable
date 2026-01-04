import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero360() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating orbs representing the 4 pillars */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute bottom-1/4 right-1/3 w-52 h-52 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        {/* Data flow lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,200 Q400,100 800,300 T1600,200" stroke="url(#flow1)" strokeWidth="2" fill="none" className="animate-pulse" />
          <path d="M0,400 Q300,300 600,500 T1200,400" stroke="url(#flow1)" strokeWidth="2" fill="none" className="animate-pulse delay-500" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2 text-sm font-medium">
          <Brain className="w-4 h-4 mr-2" />
          INTELIGÊNCIA OPERACIONAL ALL-IN-ONE
        </Badge>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
          Pare de Apenas{" "}
          <span className="text-slate-400 line-through decoration-orange-500">Registrar Vendas</span>
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Comece a Gerir Lucro
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto mb-8 leading-relaxed">
          A única plataforma que une{" "}
          <span className="text-orange-400 font-semibold">Atração</span>,{" "}
          <span className="text-blue-400 font-semibold">Venda</span>,{" "}
          <span className="text-green-400 font-semibold">Operação</span> e{" "}
          <span className="text-purple-400 font-semibold">Gestão de Pessoas</span>{" "}
          em um único ecossistema.
          <br />
          <span className="text-slate-400">Do pequeno comércio à rede de franquias.</span>
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <TrendingUp className="w-5 h-5" />
              <span className="text-3xl font-bold">+47%</span>
            </div>
            <p className="text-sm text-slate-400">Aumento médio no lucro</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-3xl font-bold">-8h</span>
            </div>
            <p className="text-sm text-slate-400">Redução semanal em gestão</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-orange-500/25"
          >
            <Link to="/signup">
              Quero Gerir Lucro
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg rounded-xl"
          >
            <Link to="/diagnostico">
              Diagnóstico Grátis
            </Link>
          </Button>
        </div>

        {/* Pitch de Elevador */}
        <div className="mt-16 max-w-3xl mx-auto p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <p className="text-slate-300 italic text-sm md:text-base leading-relaxed">
            "Diferente de sistemas de caixa (PDV) tradicionais que apenas registram o passado, 
            a Mostralo utiliza <span className="text-orange-400 font-semibold">Inteligência Artificial</span> para 
            projetar o futuro do seu lucro, automatizando desde a vitrine no Google até a performance 
            individual da sua equipe."
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-orange-500 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
