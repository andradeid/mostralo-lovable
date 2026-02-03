import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "O desconto é válido por quanto tempo?",
    answer: "O desconto promocional é válido para os primeiros 3 meses de assinatura. Após esse período, o plano volta ao valor normal. Você pode cancelar a qualquer momento sem multa."
  },
  {
    question: "Vocês cobram taxa sobre as vendas como o iFood?",
    answer: "Não! Diferente de marketplaces como iFood que cobram até 27% de comissão, o Mostralo cobra apenas uma mensalidade fixa. Todas as suas vendas ficam 100% com você, sem taxas por pedido."
  },
  {
    question: "Em quanto tempo meu sistema fica pronto?",
    answer: "Seu sistema fica pronto em até 48 horas após a contratação. Nossa equipe configura tudo para você: cardápio digital, integração com WhatsApp, delivery e mais. É só começar a vender!"
  },
  {
    question: "Posso trocar de plano depois?",
    answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Se fizer upgrade durante o período promocional, você mantém o desconto proporcional nos meses restantes."
  },
  {
    question: "O que está incluso no suporte?",
    answer: "Oferecemos suporte humanizado 7 dias por semana via WhatsApp. Nossa equipe ajuda com dúvidas, configurações e até estratégias para vender mais. Não é chatbot, é gente de verdade!"
  },
  {
    question: "Preciso de equipamentos especiais?",
    answer: "Não! Você pode usar qualquer celular, tablet ou computador que já possui. Para o KDS (monitor de cozinha) e Totem de autoatendimento, oferecemos compatibilidade com equipamentos comuns do mercado."
  }
];

export function FAQSection() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900/30" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            <HelpCircle className="w-3 h-3 mr-1" />
            TIRE SUAS DÚVIDAS
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            Perguntas{" "}
            <span className="text-orange-500">Frequentes</span>
          </h2>
          <p className="text-zinc-400">
            Respostas para as dúvidas mais comuns sobre nossa oferta especial
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-6 data-[state=open]:border-orange-500/50 transition-colors"
            >
              <AccordionTrigger className="text-left text-white hover:text-orange-400 hover:no-underline py-5">
                <span className="text-base font-medium">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 pb-5 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
