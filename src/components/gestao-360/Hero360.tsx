import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, TrendingUp, Sparkles, Shield } from "lucide-react";
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
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-wrap justify-center gap-8 mb-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-orange-400">
                <TrendingUp className="w-5 h-5" />
                <span className="text-3xl font-bold">+47%*</span>
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
          <p className="text-xs text-slate-500 italic">*Baseado em implementações do Ecossistema Elite</p>
        </div>

        {/* Infrastructure Enterprise Card */}
        <div className="max-w-4xl mx-auto mb-10 relative group">
          {/* Gradient Border Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition duration-500" />
          
          <div className="relative p-6 md:p-8 bg-slate-800/90 rounded-2xl backdrop-blur-sm border border-slate-700/50">
            {/* Badge */}
            <Badge className="mb-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/40 px-3 py-1.5 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              INFRAESTRUTURA ENTERPRISE
            </Badge>
            
            {/* Main Text */}
            <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-6">
              <span className="text-orange-400 font-semibold">Dono(a)</span>, o Mostralo não é sistema 
              <span className="text-slate-400 italic"> "fundo de quintal"</span>. Nós rodamos sobre a mesma 
              infraestrutura que permite ao <span className="text-orange-400 font-medium">Uber</span> localizar 
              carros ou ao <span className="text-orange-400 font-medium">Instagram</span> processar bilhões de fotos. 
              É por isso que entregamos essa <span className="text-emerald-400 font-medium">velocidade</span> no seu 
              Totem e essa <span className="text-blue-400 font-medium">inteligência</span> no seu Agente de IA. 
              <span className="block mt-2 text-white font-semibold">
                Você terá tecnologia de Vale do Silício dentro da sua loja.
              </span>
            </p>
            
            {/* Provider Logos */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-700/50">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Powered by</span>
              <div className="flex items-center gap-6">
                {/* AWS */}
                <div className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors">
                  <svg className="w-8 h-5" viewBox="0 0 64 39" fill="currentColor">
                    <path d="M18.1 22.9c0 .7.1 1.2.2 1.6.2.4.4.8.6 1.3.1.2.1.3.1.4 0 .2-.1.3-.3.5l-1 .7c-.1.1-.3.1-.4.1-.2 0-.3-.1-.5-.2-.2-.3-.5-.6-.6-.9-.2-.3-.4-.7-.6-1.1-1.6 1.9-3.6 2.8-5.9 2.8-1.7 0-3-.5-4-1.4-1-.9-1.5-2.2-1.5-3.8 0-1.7.6-3 1.8-4.1 1.2-1 2.8-1.5 4.8-1.5.7 0 1.4 0 2.1.1.7.1 1.5.2 2.2.4v-1.4c0-1.5-.3-2.5-1-3.2-.7-.6-1.8-1-3.3-1-.7 0-1.4.1-2.2.3-.7.2-1.5.5-2.2.8-.3.2-.6.2-.7.3-.1 0-.2.1-.3.1-.3 0-.4-.2-.4-.6v-.8c0-.3 0-.5.1-.7.1-.1.2-.3.5-.4.7-.4 1.6-.7 2.5-.9 1-.2 2-.4 3.1-.4 2.4 0 4.1.5 5.2 1.6 1.1 1.1 1.7 2.7 1.7 4.9v6.4zM10.5 25c.7 0 1.3-.1 2-.4.7-.2 1.3-.7 1.8-1.3.3-.4.5-.8.6-1.3.1-.5.2-1.1.2-1.8v-.9c-.5-.1-1.1-.2-1.7-.3-.6-.1-1.2-.1-1.8-.1-1.3 0-2.3.2-2.9.7-.6.5-1 1.2-1 2.1 0 .9.2 1.5.7 2 .5.5 1.2.7 2.1.7v.6zm13.8 2c-.3 0-.5-.1-.7-.2-.1-.1-.3-.4-.4-.7l-4.3-14.1c-.1-.2-.1-.3-.1-.5 0-.3.1-.4.4-.4h1.5c.3 0 .6 0 .7.2.1.1.3.4.3.7l3.1 12.1 2.9-12.1c.1-.3.2-.6.3-.7.2-.1.4-.2.7-.2h1.3c.3 0 .6 0 .7.2.1.1.3.4.3.7l2.9 12.3 3.2-12.3c.1-.3.2-.6.3-.7.2-.1.4-.2.7-.2h1.5c.3 0 .4.1.4.4 0 .1 0 .2-.1.3 0 .1-.1.2-.1.3l-4.4 14.1c-.1.3-.2.6-.4.7-.1.1-.4.2-.7.2h-1.4c-.3 0-.6-.1-.7-.2-.1-.1-.3-.4-.3-.7l-2.8-11.8-2.8 11.8c-.1.3-.2.6-.3.7-.2.1-.4.2-.7.2h-1.4zm22.1.5c-1 0-2-.1-3-.4-.9-.3-1.7-.6-2.1-1-.3-.2-.4-.4-.5-.6 0-.1-.1-.3-.1-.4v-.8c0-.4.1-.6.4-.6.1 0 .2 0 .3.1l.5.2c.6.3 1.3.5 2.1.7.7.2 1.5.2 2.2.2 1.2 0 2.1-.2 2.7-.6.6-.4.9-1 .9-1.8 0-.5-.2-1-.5-1.3-.3-.4-.9-.7-1.8-1l-2.5-.8c-1.3-.4-2.3-1-2.9-1.8-.6-.7-.9-1.6-.9-2.5 0-.7.2-1.4.5-1.9.3-.6.8-1.1 1.3-1.5.6-.4 1.2-.7 1.9-.9.7-.2 1.5-.3 2.3-.3.4 0 .8 0 1.3.1.4.1.8.2 1.2.3.4.1.7.2 1 .4.3.1.5.3.7.4.2.1.3.3.4.5.1.1.1.3.1.6v.7c0 .4-.1.6-.4.6-.1 0-.3-.1-.6-.2-1-.5-2.1-.7-3.3-.7-1.1 0-1.9.2-2.5.5-.5.4-.8.9-.8 1.6 0 .5.2 1 .6 1.3.4.4 1.1.7 2 1l2.5.8c1.3.4 2.2 1 2.8 1.7.6.7.8 1.5.8 2.4 0 .8-.2 1.4-.5 2-.3.6-.8 1.1-1.3 1.5-.6.4-1.2.7-2 .9-.9.3-1.7.4-2.6.4z"/>
                  </svg>
                  <span className="text-xs font-medium hidden sm:inline">AWS</span>
                </div>
                
                <div className="w-px h-4 bg-slate-600" />
                
                {/* Supabase */}
                <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 109 113" fill="currentColor">
                    <path d="M63.7 110.3c-2.5 3.1-7.6 1.4-7.7-2.5l-1.6-51.3h45c4.2 0 6.6 4.7 4.1 8l-39.8 45.8z" fillOpacity="0.5"/>
                    <path d="M63.7 110.3c-2.5 3.1-7.6 1.4-7.7-2.5l-1.6-51.3h45c4.2 0 6.6 4.7 4.1 8l-39.8 45.8z"/>
                    <path d="M45.3 2.7c2.5-3.1 7.6-1.4 7.7 2.5l.8 51.3H9.2c-4.2 0-6.6-4.7-4.1-8l40.2-45.8z"/>
                  </svg>
                  <span className="text-xs font-medium hidden sm:inline">Supabase</span>
                </div>
                
                <div className="w-px h-4 bg-slate-600" />
                
                {/* Cloudflare */}
                <div className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors">
                  <svg className="w-6 h-5" viewBox="0 0 100 40" fill="currentColor">
                    <path d="M75.6 28.8l1.2-4.1c.4-1.3.2-2.5-.5-3.5-.7-.9-1.8-1.5-3-1.6l-37.9-.6c-.2 0-.4-.1-.5-.2-.1-.2-.1-.3 0-.5.1-.2.3-.4.5-.4l38.1-.6c3.5-.2 7.3-3.1 8.5-6.6l1.5-4.4c.1-.2.1-.5.1-.7 0-.5-.4-1-1-1-5.8-.2-11.2 2-15.3 5.7-3.1-5.5-9-9.1-15.7-9.1-9.7 0-17.7 7.6-18.5 17.1-4.1-1.9-9-1.1-12.2 2.5-2.7 3-3.4 7.2-2 10.8.2.4.5.6.9.6h55.1c.4 0 .8-.3.9-.7l-.2.3z"/>
                    <path d="M86.5 16.5c-.3 0-.5 0-.8.1-.2 0-.4.1-.4.4l-.7 2.4c-.4 1.3-.2 2.5.5 3.5.7.9 1.8 1.5 3 1.6l4.4.1c.2 0 .4.1.5.2.1.2.1.3 0 .5-.1.2-.3.4-.5.4l-4.6.1c-3.5.2-7.3 3.1-8.5 6.6l-.4 1.2c-.1.2 0 .4.2.5h17.4c.3 0 .5-.2.6-.5.5-1.7.7-3.5.7-5.3-.1-6.4-5.2-11.6-11.4-11.8z"/>
                  </svg>
                  <span className="text-xs font-medium hidden sm:inline">Cloudflare</span>
                </div>
              </div>
            </div>
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
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25 animate-pulse sm:animate-none"
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
