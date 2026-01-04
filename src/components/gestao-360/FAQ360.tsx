import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Rocket, Coins, Headphones, MessageCircle, Shield, Quote, ShieldCheck, Lock, Cloud, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface FAQItem {
  pergunta: string;
  resposta: string;
}

interface FAQCategory {
  id: string;
  titulo: string;
  icon: React.ElementType;
  cor: string;
  perguntas: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "implementacao",
    titulo: "Implementação",
    icon: Rocket,
    cor: "text-emerald-400",
    perguntas: [
      {
        pergunta: "Quanto tempo leva para implementar?",
        resposta: "A implementação básica leva de 24h a 72h. Recebemos seu catálogo, configuramos os módulos e você já pode operar. Implementações mais complexas (franquias, múltiplas unidades) levam até 7 dias com acompanhamento dedicado."
      },
      {
        pergunta: "Preciso parar minha operação para migrar?",
        resposta: "Não. Fazemos a migração em paralelo. Você continua operando normalmente enquanto configuramos tudo. A virada é gradual e assistida, sem impacto na sua operação diária."
      },
      {
        pergunta: "Vocês ajudam a cadastrar os produtos?",
        resposta: "Sim! A implementação inclui importação de catálogo. Você pode enviar planilha, PDF ou até fotos do cardápio físico que nossa equipe cadastra tudo. Zero trabalho para você."
      },
      {
        pergunta: "Funciona com meu sistema atual?",
        resposta: "O Mostralo é um ecossistema completo, mas também se integra com sistemas existentes via API. Avaliamos caso a caso durante o diagnóstico gratuito."
      }
    ]
  },
  {
    id: "custos",
    titulo: "Custos e Planos",
    icon: Coins,
    cor: "text-amber-400",
    perguntas: [
      {
        pergunta: "Qual o investimento mensal?",
        resposta: "A partir de R$ 397,90/mês no plano Essencial. Diferente de marketplaces, é um valor fixo sem taxa por pedido. Quanto mais você vende, mais você lucra. O investimento se paga no primeiro mês."
      },
      {
        pergunta: "Tem taxa de setup ou implantação?",
        resposta: "Não. Zero taxa de setup. O investimento mensal já inclui implementação assistida, treinamento completo e suporte contínuo."
      },
      {
        pergunta: "Posso cancelar quando quiser?",
        resposta: "Sim. Sem fidelidade, sem multa. Você fica porque quer, não porque está preso. Nossa retenção é por resultado, não por contrato."
      },
      {
        pergunta: "Como funciona o período de teste?",
        resposta: "7 dias grátis com acesso completo a todos os módulos. Sem cartão de crédito. Se não gostar, apenas não continua. Simples assim."
      },
      {
        pergunta: "Existe desconto para múltiplas unidades?",
        resposta: "Sim! Franquias e redes com múltiplas unidades têm condições especiais e plano Enterprise personalizado. Entre em contato para uma proposta sob medida."
      }
    ]
  },
  {
    id: "suporte",
    titulo: "Suporte Técnico",
    icon: Headphones,
    cor: "text-blue-400",
    perguntas: [
      {
        pergunta: "Como funciona o suporte?",
        resposta: "Suporte técnico via WhatsApp, chat e email. Horário comercial estendido (8h às 22h). Para planos Business+, você tem um gerente de conta dedicado com atendimento prioritário."
      },
      {
        pergunta: "Vocês dão treinamento?",
        resposta: "Sim! Treinamento online ao vivo incluído para você e toda sua equipe. Mais uma biblioteca completa de tutoriais em vídeo disponível 24h. Ninguém fica perdido."
      },
      {
        pergunta: "O sistema é estável?",
        resposta: "Uptime de 99,9%. Infraestrutura em nuvem com redundância. Seu negócio não para. Fazemos atualizações silenciosas que não impactam a operação."
      },
      {
        pergunta: "E se eu precisar de uma funcionalidade específica?",
        resposta: "Nosso roadmap é construído com feedback de clientes. Funcionalidades personalizadas podem ser desenvolvidas para planos Enterprise. Seu feedback molda o produto."
      }
    ]
  },
  {
    id: "seguranca",
    titulo: "Segurança e Performance",
    icon: Shield,
    cor: "text-purple-400",
    perguntas: [
      {
        pergunta: "Onde os meus dados ficam armazenados?",
        resposta: "Os seus dados estão salvos na Cloud Stack de alta disponibilidade (mesma infraestrutura de servidores da AWS/Google utilizada por gigantes como Airbnb e Netflix). Isso garante que a sua loja nunca pare, com uma taxa de disponibilidade de 99,9%."
      },
      {
        pergunta: "O que acontece se a internet da loja cair?",
        resposta: "A nossa arquitetura foi desenhada para a realidade do varejo brasileiro. O sistema possui módulos de contingência que permitem a continuidade de certas operações críticas, sincronizando tudo com a nuvem assim que a conexão é restabelecida."
      },
      {
        pergunta: "Como é garantida a segurança das informações dos meus clientes?",
        resposta: "Seguimos rigorosamente os protocolos da LGPD (Lei Geral de Proteção de Dados) e possuímos arquitetura ISO 27001 Ready. Utilizamos criptografia de ponta a ponta (a mesma do WhatsApp) em todas as transações de pagamento e dados sensíveis."
      },
      {
        pergunta: "O sistema aguenta grandes picos de movimento?",
        resposta: "Sim. Por utilizarmos a tecnologia de microserviços (a mesma do Instagram e Uber), o sistema escala automaticamente. Quanto mais pedidos entram, mais poder de processamento é alocado instantaneamente, garantindo que o seu Totem e o seu KDS não travem."
      },
      {
        pergunta: "Como são feitas as atualizações?",
        resposta: "As atualizações são feitas de forma invisível via nuvem (Over-the-Air), sem necessidade de técnicos no local. A sua loja terá sempre a versão mais recente e segura do ecossistema, sem custos adicionais de manutenção de hardware."
      }
    ]
  }
];

export function FAQ360() {
  const selosRef = useRef<HTMLDivElement>(null);
  const [selosVisible, setSelosVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSelosVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (selosRef.current) {
      observer.observe(selosRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
            TIRE SUAS DÚVIDAS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Tudo que você precisa saber antes de transformar sua operação
          </p>
        </div>

        {/* FAQ por Categoria */}
        <div className="space-y-8">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                {/* Header da Categoria */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-800/80">
                  <Icon className={`w-5 h-5 ${category.cor}`} />
                  <h3 className="font-semibold text-white">{category.titulo}</h3>
                </div>

                {/* Accordion */}
                <Accordion type="single" collapsible className="px-4">
                  {category.perguntas.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${category.id}-${index}`}
                      className="border-slate-700/50"
                    >
                      <AccordionTrigger className="text-left text-white hover:text-orange-400 hover:no-underline py-4">
                        {item.pergunta}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-400 pb-4 leading-relaxed">
                        {item.resposta}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}

          {/* Quote Marcos Andrade - Garantia de Segurança */}
          <div className="mt-8 relative p-6 md:p-8 rounded-2xl bg-slate-800/30 border border-purple-500/20 overflow-hidden">
            {/* Borda gradiente esquerda */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-purple-400 to-purple-600" />
            
            {/* Ícone de aspas */}
            <Quote className="absolute top-4 right-4 w-10 h-10 text-purple-400/20" />
            
            {/* Conteúdo */}
            <div className="relative">
              <p className="text-lg md:text-xl text-slate-200 italic leading-relaxed mb-6">
                "Dono(a), eu não colocaria o meu nome e a minha bagagem internacional num sistema que pudesse te deixar na mão. O que estamos a implementar aqui é tecnologia de escala global. Se os servidores que usamos aguentam o volume do Instagram, eles vão gerir a sua loja com total folga e segurança."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">MA</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Marcos Andrade</p>
                  <p className="text-sm text-slate-400">Fundador • 30 anos em Tecnologia para Varejo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Garantia Marcos Andrade com Selos */}
          <div className="mt-8 p-6 md:p-8 rounded-2xl bg-slate-800/50 border border-purple-500/30">
            {/* Header do Card */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Garantia Marcos Andrade</span>
              </div>
              <p className="text-slate-300 text-lg">
                Seu negócio protegido com certificações de nível enterprise
              </p>
            </div>

            {/* Grid de Selos */}
            <div ref={selosRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {/* Selo LGPD */}
              <div 
                className="group p-5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-center hover:border-purple-500/50 hover:bg-slate-800/70 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all duration-300 ease-out cursor-pointer"
                style={{
                  opacity: selosVisible ? 1 : 0,
                  transform: selosVisible ? (undefined) : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  transitionDelay: '0ms'
                }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/40 group-hover:to-purple-600/40 group-hover:scale-110 transition-all duration-300">
                  <Lock className="w-7 h-7 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                </div>
                <h4 className="font-bold text-white mb-2 group-hover:text-purple-100 transition-colors duration-300">LGPD Compliance</h4>
                <p className="text-sm text-slate-400">Dados dos seus clientes protegidos conforme a lei brasileira</p>
              </div>

              {/* Selo ISO 27001 */}
              <div 
                className="group p-5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-center hover:border-purple-500/50 hover:bg-slate-800/70 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all duration-300 ease-out cursor-pointer"
                style={{
                  opacity: selosVisible ? 1 : 0,
                  transform: selosVisible ? (undefined) : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  transitionDelay: '150ms'
                }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/40 group-hover:to-purple-600/40 group-hover:scale-110 transition-all duration-300">
                  <ShieldCheck className="w-7 h-7 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                </div>
                <h4 className="font-bold text-white mb-2 group-hover:text-purple-100 transition-colors duration-300">ISO 27001 Ready</h4>
                <p className="text-sm text-slate-400">Arquitetura pronta para certificação internacional de segurança</p>
              </div>

              {/* Selo AWS Partner */}
              <div 
                className="group p-5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-center hover:border-purple-500/50 hover:bg-slate-800/70 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all duration-300 ease-out cursor-pointer"
                style={{
                  opacity: selosVisible ? 1 : 0,
                  transform: selosVisible ? (undefined) : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  transitionDelay: '300ms'
                }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/40 group-hover:to-purple-600/40 group-hover:scale-110 transition-all duration-300">
                  <Cloud className="w-7 h-7 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                </div>
                <h4 className="font-bold text-white mb-2 group-hover:text-purple-100 transition-colors duration-300">AWS Partner</h4>
                <p className="text-sm text-slate-400">Infraestrutura de nível global com alta disponibilidade</p>
              </div>
            </div>

            {/* Checklist de Benefícios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-700/30">
              <div className="group flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-green-500/10 hover:scale-105 transition-all duration-200 ease-out cursor-default">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:text-green-300 group-hover:scale-110 transition-all duration-200" />
                <span className="text-xs md:text-sm text-slate-300 group-hover:text-green-200 transition-colors duration-200">Criptografia ponta a ponta</span>
              </div>
              <div className="group flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-green-500/10 hover:scale-105 transition-all duration-200 ease-out cursor-default">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:text-green-300 group-hover:scale-110 transition-all duration-200" />
                <span className="text-xs md:text-sm text-slate-300 group-hover:text-green-200 transition-colors duration-200">Backup automático diário</span>
              </div>
              <div className="group flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-green-500/10 hover:scale-105 transition-all duration-200 ease-out cursor-default">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:text-green-300 group-hover:scale-110 transition-all duration-200" />
                <span className="text-xs md:text-sm text-slate-300 group-hover:text-green-200 transition-colors duration-200">Uptime 99,9%</span>
              </div>
              <div className="group flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-green-500/10 hover:scale-105 transition-all duration-200 ease-out cursor-default">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:text-green-300 group-hover:scale-110 transition-all duration-200" />
                <span className="text-xs md:text-sm text-slate-300 group-hover:text-green-200 transition-colors duration-200">Servidores redundantes</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50">
          <MessageCircle className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Ainda tem dúvidas?
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Fale com a Sofia, nossa IA especialista. Ela responde em segundos e pode agendar uma demonstração personalizada.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 rounded-xl shadow-lg shadow-emerald-500/25"
          >
            <Link to="/diagnostico">
              <MessageCircle className="w-5 h-5 mr-2" />
              Falar com Sofia
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
