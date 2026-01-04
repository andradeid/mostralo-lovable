import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  Rocket, 
  Search, 
  Play,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const opcoes = [
  {
    icone: Rocket,
    titulo: "Iniciar Gestão Inteligente",
    descricao: "Comece agora e tenha sua operação rodando em até 7 dias",
    cta: "Começar Agora",
    link: "/signup",
    destaque: true
  },
  {
    icone: Search,
    titulo: "Diagnóstico de Oportunidades",
    descricao: "Descubra quanto você está perdendo com sistemas fragmentados",
    cta: "Fazer Diagnóstico",
    link: "/diagnostico",
    destaque: false
  },
  {
    icone: Play,
    titulo: "Ver na Prática",
    descricao: "Acesse uma demonstração real do sistema funcionando",
    cta: "Ver Demonstração",
    link: "/users-demo",
    destaque: false
  }
];

const beneficios = [
  "Implementação assistida inclusa",
  "Migração de dados gratuita",
  "Suporte humano ilimitado",
  "Sem fidelidade contratual"
];

export function CTA360Section() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Pronto Para{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                Gerir Lucro
              </span>
              <br />
              em Vez de Apenas Registrar Vendas?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Escolha como quer dar o próximo passo. Estamos prontos para te ajudar.
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {opcoes.map((opcao, idx) => (
              <Card
                key={idx}
                className={`relative overflow-hidden transition-all duration-300 group
                  ${opcao.destaque 
                    ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/30 hover:border-orange-500/50' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }
                `}
              >
                {opcao.destaque && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      RECOMENDADO
                    </div>
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <div className={`p-3 rounded-xl w-fit mb-4 ${opcao.destaque ? 'bg-orange-500/20' : 'bg-slate-700/50'}`}>
                    <opcao.icone className={`w-6 h-6 ${opcao.destaque ? 'text-orange-400' : 'text-slate-400'}`} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {opcao.titulo}
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    {opcao.descricao}
                  </p>

                  <Button
                    asChild
                    className={`w-full ${opcao.destaque 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    <Link to={opcao.link}>
                      {opcao.cta}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {beneficios.map((beneficio, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm">{beneficio}</span>
              </div>
            ))}
          </div>

          {/* Final Message */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Dúvidas? Fale diretamente com nossa equipe pelo WhatsApp.
              <br />
              Respondemos em menos de 5 minutos durante horário comercial.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
