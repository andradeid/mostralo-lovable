import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Rocket, Coins, Headphones, MessageCircle } from "lucide-react";
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
  }
];

export function FAQ360() {
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
