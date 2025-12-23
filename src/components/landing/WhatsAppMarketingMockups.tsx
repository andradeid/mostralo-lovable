import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Check, CheckCheck, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  delay: number;
}

interface MockupProps {
  title: string;
  messages: Message[];
  isVisible: boolean;
  delay?: number;
}

const PhoneMockup = ({ title, messages, isVisible, delay = 0 }: MockupProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, typing]);

  useEffect(() => {
    if (!isVisible) {
      setVisibleMessages([]);
      setTyping(false);
      setIsFadingOut(false);
      return;
    }

    let timeouts: NodeJS.Timeout[] = [];
    let loopTimeout: NodeJS.Timeout;
    let startTimeout: NodeJS.Timeout;

    const runAnimation = () => {
      setIsFadingOut(false);
      setVisibleMessages([]);
      setTyping(false);

      messages.forEach((msg, index) => {
        if (msg.isBot && index > 0) {
          timeouts.push(
            setTimeout(() => setTyping(true), msg.delay - 2400)
          );
        }

        timeouts.push(
          setTimeout(() => {
            setTyping(false);
            setVisibleMessages(prev => [...prev, msg.id]);
          }, msg.delay)
        );
      });

      const lastMessageDelay = Math.max(...messages.map(m => m.delay));
      
      timeouts.push(
        setTimeout(() => {
          setIsFadingOut(true);
        }, lastMessageDelay + 9000)
      );

      loopTimeout = setTimeout(() => {
        runAnimation();
      }, lastMessageDelay + 12000);
    };

    startTimeout = setTimeout(runAnimation, delay);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(loopTimeout);
      clearTimeout(startTimeout);
    };
  }, [isVisible, messages, delay]);

  return (
    <div className="relative mx-auto w-[280px] md:w-[320px]">
      {/* Phone Frame */}
      <div className="relative bg-foreground/90 rounded-[2.5rem] p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/90 rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="bg-[#e5ddd5] dark:bg-[#0b141a] rounded-[2rem] overflow-hidden h-[400px] md:h-[480px]">
          {/* WhatsApp Header */}
          <div className="bg-[#075e54] dark:bg-[#202c33] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-white/70">online</p>
            </div>
          </div>

          {/* Chat Area */}
          <div 
            ref={chatContainerRef}
            className="p-3 space-y-2 h-[calc(100%-80px)] overflow-y-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm transition-all duration-500",
                  msg.isBot
                    ? "bg-white dark:bg-[#202c33] text-foreground ml-0 mr-auto rounded-tl-none"
                    : "bg-[#dcf8c6] dark:bg-[#005c4b] text-foreground ml-auto mr-0 rounded-tr-none",
                  visibleMessages.includes(msg.id)
                    ? isFadingOut 
                      ? "opacity-0 translate-y-0"
                      : "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!msg.isBot && (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {typing && (
              <div className={cn(
                "max-w-[85%] bg-white dark:bg-[#202c33] rounded-lg px-4 py-3 rounded-tl-none transition-opacity duration-300",
                isFadingOut ? "opacity-0" : "opacity-100"
              )}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface WhatsAppMarketingMockupsProps {
  isVisible: boolean;
}

export const WhatsAppMarketingMockups = ({ isVisible }: WhatsAppMarketingMockupsProps) => {
  const recoveryMessages: Message[] = [
    { id: 1, text: "Oi! Já faz um tempo que não te vejo por aqui 😊", isBot: true, delay: 1500 },
    { id: 2, text: "Sentimos sua falta! Faz 15 dias que você não pede com a gente.", isBot: true, delay: 4500 },
    { id: 3, text: "Que tal 15% OFF pra matar a saudade?\n\nUse: VOLTEI15 🍕", isBot: true, delay: 8400 },
    { id: 4, text: "Opa! Vou pedir sim, obrigado! 😋", isBot: false, delay: 13500 },
  ];

  const campaignMessages: Message[] = [
    { id: 1, text: "🎉 HAPPY HOUR ESPECIAL!", isBot: true, delay: 1500 },
    { id: 2, text: "Hoje das 18h às 20h:\n\n• Todas as pizzas 25% OFF\n• Refrigerante grátis\n\nSó até hoje! ⏰", isBot: true, delay: 5400 },
    { id: 3, text: "Uau! Vou aproveitar agora mesmo!", isBot: false, delay: 10500 },
    { id: 4, text: "Perfeito! Aqui está o cardápio 👇\nrestaurante.com.br/cardapio", isBot: true, delay: 14400 },
  ];

  const statusMessages: Message[] = [
    { id: 1, text: "✅ Pedido #4521 confirmado!", isBot: true, delay: 1500 },
    { id: 2, text: "👨‍🍳 Seu pedido está sendo preparado com carinho!", isBot: true, delay: 6000 },
    { id: 3, text: "🛵 Saiu para entrega!\n\nEntregador: Carlos\nPrevisão: 25 minutos", isBot: true, delay: 10500 },
    { id: 4, text: "Obrigado! Aguardando ansioso 😋", isBot: false, delay: 15000 },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
      <div className="text-center relative">
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30 animate-pulse">
          <Shield className="w-3 h-3 mr-1" />
          SENTINELA
        </Badge>
        <PhoneMockup
          title="SENTINELA Automático"
          messages={recoveryMessages}
          isVisible={isVisible}
          delay={0}
        />
        <p className="mt-4 text-sm font-medium text-orange-500">
          🛡️ Recuperação automática de clientes
        </p>
      </div>

      <div className="text-center">
        <PhoneMockup
          title="Campanha Promocional"
          messages={campaignMessages}
          isVisible={isVisible}
          delay={9000}
        />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          📢 Promoção em massa
        </p>
      </div>

      <div className="text-center">
        <PhoneMockup
          title="Status Automático"
          messages={statusMessages}
          isVisible={isVisible}
          delay={18000}
        />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          📦 Atualização em tempo real
        </p>
      </div>
    </div>
  );
};
