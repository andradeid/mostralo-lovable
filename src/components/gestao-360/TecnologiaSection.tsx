import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Globe, 
  Users, 
  Handshake, 
  Building2, 
  Network,
  Award,
  Clock
} from "lucide-react";

const diferenciais = [
  {
    icone: Shield,
    iconeSecundario: Globe,
    titulo: "Arquitetura de Dados Padrão Internacional",
    descricao: "Segurança e estrutura de dados padrão Suíça/EUA. Seus dados protegidos com criptografia de nível bancário.",
    destaque: "ISO 27001 Ready"
  },
  {
    icone: Users,
    iconeSecundario: Handshake,
    titulo: "Implementação Assistida",
    descricao: "Você não recebe um software, recebe uma consultoria. Acompanhamento dedicado até sua operação rodar 100%.",
    destaque: "Suporte Humano"
  },
  {
    icone: Building2,
    iconeSecundario: Network,
    titulo: "Escalabilidade para Franquias",
    descricao: "Do MEI à rede com múltiplas unidades. Cresça sem trocar de sistema. Multi-loja, multi-CNPJ, multi-região.",
    destaque: "Cresce com Você"
  }
];

export function TecnologiaSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-800 text-slate-300 border-slate-700">
              <Award className="w-3 h-3 mr-1" />
              DIFERENCIAL TÉCNICO
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              A Tecnologia <span className="text-orange-400">Marcos Andrade</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <p className="text-lg">
                30 Anos de Experiência em Sistemas de Alto Desempenho
              </p>
            </div>
          </div>

          {/* Diferenciais Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {diferenciais.map((dif, idx) => (
              <Card
                key={idx}
                className="relative overflow-hidden bg-slate-800/50 border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 group"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-300" />
                
                <div className="relative p-6 md:p-8">
                  {/* Icons */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <dif.icone className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <dif.iconeSecundario className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-3">
                    {dif.titulo}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {dif.descricao}
                  </p>

                  {/* Destaque Badge */}
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    {dif.destaque}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Quote Box */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8 text-center">
            <p className="text-slate-300 text-lg md:text-xl italic mb-4">
              "Não vendemos software. Vendemos{" "}
              <span className="text-orange-400 font-semibold">transformação operacional</span>. 
              A tecnologia é apenas o veículo."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                MA
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Marcos Andrade</p>
                <p className="text-sm text-slate-400">Fundador & CTO, Mostralo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
