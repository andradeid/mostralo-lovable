import { Card } from '@/components/ui/card';

const faqItems = [
  {
    question: 'Como vou atrair clientes sem o iFood?',
    answer: 'O iFood não traz clientes de graça. Você paga 25% POR CADA pedido. Com esse dinheiro, você pode investir em marketing próprio (Google Ads, Instagram, Facebook) e ter ROI muito melhor. Além disso, seus clientes ficarão com você, não com o marketplace.'
  },
  {
    question: 'E se eu tiver poucos pedidos no começo?',
    answer: 'Você paga apenas R$ 397,90/mês fixo. Se fizer 10 pedidos ou 1000, o custo é o mesmo. No iFood, com apenas 20 pedidos de R$ 50, você já paga R$ 250 de taxa. No Mostralo, R$ 397,90 fixo independente do volume.'
  },
  {
    question: 'O marketing digital realmente está incluso no preço?',
    answer: 'Sim! Todos os planos incluem gestão completa de redes sociais com 1 perfil, agendamento ilimitado de posts, IA para criar legendas profissionais, relatórios de performance e análise de concorrentes. Isso sozinho vale R$ 800-2.000/mês em agências.'
  },
  {
    question: 'Quantos perfis de redes sociais posso ter?',
    answer: '1 perfil de rede social está incluso em todos os planos com posts ilimitados. Você escolhe: Instagram, Facebook, TikTok, LinkedIn ou Google Meu Negócio. Precisa de mais perfis? Entre em contato com nosso comercial para condições especiais.'
  },
  {
    question: 'Preciso entender de marketing para usar?',
    answer: 'Não! Nossa IA cria legendas profissionais automaticamente, sugere os melhores horários para postar e até analisa o que seus concorrentes estão fazendo. Você só precisa aprovar e agendar. É tão simples quanto usar o Instagram.'
  },
  {
    question: 'Preciso ter conhecimento técnico?',
    answer: 'Zero conhecimento necessário. Sistema intuitivo, suporte 24/7, treinamento incluído. A IA faz o trabalho pesado. Você só precisa cadastrar seus produtos uma vez.'
  },
  {
    question: 'Como funciona a IA no WhatsApp?',
    answer: 'A IA conversa com seus clientes, tira dúvidas, mostra o cardápio, processa pedidos, calcula frete automaticamente. Tudo sozinha. Você só precisa preparar e entregar.'
  },
  {
    question: 'Posso continuar no iFood e usar o Mostralo?',
    answer: 'Sim! Muitos clientes começam usando os dois. Com o tempo, quando veem a economia e o controle que têm com o Mostralo, naturalmente migram 100% dos pedidos.'
  },
  {
    question: 'Qual o prazo de contrato?',
    answer: 'Sem prazo mínimo. Cancele quando quiser. Teste 7 dias grátis e veja a diferença. Sem taxa de setup, sem pegadinhas.'
  }
];

export const FAQSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa saber antes de sair dos marketplaces
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold mb-3">{item.question}</h3>
              <p className="text-muted-foreground">{item.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
