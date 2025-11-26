import { useState, useEffect, useRef } from 'react';
import { Bot, Phone, ArrowLeft, MoreVertical, Camera, Mic, Send } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  typing?: boolean;
}

const conversationScenarios = [
  // Cenário 1: Pedido completo
  [
    { id: 1, text: 'Oi! Gostaria de ver o cardápio 📱', sender: 'user' as const, timestamp: '19:30' },
    { id: 2, text: 'Olá! 😊 Claro! Aqui está nosso cardápio atualizado:', sender: 'bot' as const, timestamp: '19:30' },
    { id: 3, text: '🍕 *PIZZAS TRADICIONAIS*\n• Margherita - R$ 35,00\n• Calabresa - R$ 38,00\n• Portuguesa - R$ 42,00\n\n🍔 *HAMBÚRGUERES*\n• X-Burger - R$ 25,00\n• X-Bacon - R$ 28,00\n\nQual te interessa?', sender: 'bot' as const, timestamp: '19:31' },
    { id: 4, text: 'Quero uma pizza margherita!', sender: 'user' as const, timestamp: '19:32' },
    { id: 5, text: '🍕 Ótima escolha!\n\n*Pizza Margherita - R$ 35,00*\nMolho de tomate, mussarela e manjericão\n\nQuantas pizzas você gostaria?', sender: 'bot' as const, timestamp: '19:32' },
    { id: 6, text: '2 pizzas, por favor', sender: 'user' as const, timestamp: '19:33' },
    { id: 7, text: '✅ Perfeito!\n\n*Seu pedido:*\n• 2x Pizza Margherita\n• Total: R$ 70,00\n\nPreciso do seu endereço para calcular o frete 📍', sender: 'bot' as const, timestamp: '19:33' },
    { id: 8, text: 'Rua das Flores, 123 - Centro', sender: 'user' as const, timestamp: '19:34' },
    { id: 9, text: '📍 Endereço confirmado!\n💰 Frete: R$ 5,00 (2.3km)\n\n*RESUMO DO PEDIDO:*\n• 2x Pizza Margherita: R$ 70,00\n• Frete: R$ 5,00\n• *Total: R$ 75,00*\n\nTempo estimado: 40-50 min\n\nConfirmar pedido? 🛵', sender: 'bot' as const, timestamp: '19:34' },
    { id: 10, text: 'Confirmo! 👍', sender: 'user' as const, timestamp: '19:35' },
    { id: 11, text: '🎉 *Pedido confirmado!*\n\n📋 Número: #2847\n⏰ Tempo: 40-50 min\n💳 Pagamento: Na entrega\n\nVocê receberá atualizações do status automaticamente!\n\nObrigado pela preferência! 😊', sender: 'bot' as const, timestamp: '19:35' },
  ],
  // Cenário 2: Dúvidas sobre horário
  [
    { id: 1, text: 'Olá! Vocês estão abertos?', sender: 'user' as const, timestamp: '20:15' },
    { id: 2, text: 'Oi! 😊 Sim, estamos funcionando!\n\n🕐 *HORÁRIO DE FUNCIONAMENTO:*\n• Segunda a Quinta: 18h às 23h\n• Sexta e Sábado: 18h às 00h\n• Domingo: 18h às 22h\n\nAgora são 20:15, então estamos abertos até 23h hoje! 🍕', sender: 'bot' as const, timestamp: '20:15' },
    { id: 3, text: 'Ótimo! E até que horas vocês fazem delivery?', sender: 'user' as const, timestamp: '20:16' },
    { id: 4, text: '🛵 *DELIVERY:*\n• Funciona em todos os horários que estamos abertos\n• Última entrega sai 30 min antes do fechamento\n• Hoje: última entrega às 22:30\n\nTempo médio de entrega: 30-45 min\nÁrea de entrega: até 5km do restaurante\n\nGostaria de fazer um pedido? 😊', sender: 'bot' as const, timestamp: '20:16' },
    { id: 5, text: 'Sim! Quero ver as pizzas doces', sender: 'user' as const, timestamp: '20:17' },
    { id: 6, text: '🍫 *PIZZAS DOCES*\n• Chocolate c/ Morango - R$ 42,00\n• Brigadeiro - R$ 38,00\n• Romeu e Julieta - R$ 40,00\n• Nutella c/ Banana - R$ 45,00\n\nTodas acompanham canela e açúcar! ✨\n\nQual desperta seu interesse?', sender: 'bot' as const, timestamp: '20:17' },
  ],
  // Cenário 3: Localização e informações
  [
    { id: 1, text: 'Onde vocês ficam?', sender: 'user' as const, timestamp: '19:45' },
    { id: 2, text: '📍 *NOSSA LOCALIZAÇÃO:*\n\nRua da Pizzaria, 456 - Centro\nBairro Vila Nova\nCidade - SP\n\n🚗 *COMO CHEGAR:*\n• Próximo ao Shopping Center\n• Do lado da Farmácia Popular\n• Estacionamento gratuito na rua\n\nQuer que eu envie o link do Google Maps?', sender: 'bot' as const, timestamp: '19:45' },
    { id: 3, text: 'Sim, por favor!', sender: 'user' as const, timestamp: '19:46' },
    { id: 4, text: '📱 Aqui está: maps.google.com/pizzaria456\n\n🅿️ *ESTACIONAMENTO:*\n• Gratuito na rua\n• Vagas para motos na frente\n• Acesso para cadeirantes ♿\n\n📞 Telefone: (11) 9999-9999\n\nPrecisa de mais alguma informação?', sender: 'bot' as const, timestamp: '19:46' },
    { id: 5, text: 'Vocês têm opções vegetarianas?', sender: 'user' as const, timestamp: '19:47' },
    { id: 6, text: '🥬 *OPÇÕES VEGETARIANAS:*\n\n🍕 *PIZZAS:*\n• Margherita (clássica) - R$ 35,00\n• Vegetariana - R$ 42,00\n• Quatro Queijos - R$ 40,00\n• Abobrinha c/ Ricota - R$ 38,00\n\n🥗 *SALADAS:*\n• Caesar Vegetariana - R$ 25,00\n• Caprese - R$ 22,00\n\nTodos os ingredientes são frescos! 🌱', sender: 'bot' as const, timestamp: '19:47' },
    { id: 7, text: 'Perfeito! Quero a pizza vegetariana', sender: 'user' as const, timestamp: '19:48' },
    { id: 8, text: '🌱 Excelente escolha!\n\n*Pizza Vegetariana - R$ 42,00*\nTomate, mussarela, pimentão, cebola, azeitona, abobrinha e orégano\n\nTamanho família (8 pedaços)\n\nQuantas pizzas? E já tem o endereço para entrega? 📍', sender: 'bot' as const, timestamp: '19:48' },
  ]
];

export default function WhatsAppMockup() {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isTyping]);

  useEffect(() => {
    const currentConversation = conversationScenarios[currentScenario];
    
    const interval = setInterval(() => {
      if (currentIndex < currentConversation.length) {
        const nextMessage = currentConversation[currentIndex];
        
        // Show typing indicator for bot messages
        if (nextMessage.sender === 'bot') {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setCurrentMessages(prev => [...prev, nextMessage]);
            setCurrentIndex(prev => prev + 1);
          }, 1500); // Typing duration
        } else {
          setCurrentMessages(prev => [...prev, nextMessage]);
          setCurrentIndex(prev => prev + 1);
        }
      } else {
        // Move to next scenario or reset
        setTimeout(() => {
          setCurrentMessages([]);
          setCurrentIndex(0);
          setCurrentScenario(prev => (prev + 1) % conversationScenarios.length);
        }, 4000);
      }
    }, 2500); // Message interval

    return () => clearInterval(interval);
  }, [currentIndex, currentScenario]);

  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16">
      {/* Phone Frame */}
      <div className="w-80 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl mb-8">
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
          {/* Status Bar */}
          <div className="bg-green-600 h-6 flex items-center justify-between px-4 text-white text-xs">
            <span>9:41</span>
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="w-5 h-3 border border-white rounded-sm">
                <div className="w-full h-full bg-white rounded-sm scale-75"></div>
              </div>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-green-600 p-3 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Restaurante IA</div>
                <div className="text-xs opacity-80">online</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="w-5 h-5" />
              <MoreVertical className="w-5 h-5" />
            </div>
          </div>

          {/* Chat Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 bg-gray-100 p-3 overflow-y-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="space-y-3">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-2 ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    <div className="text-xs whitespace-pre-line">{message.text}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-gray-200 p-2 flex items-center space-x-2">
            <div className="flex-1 bg-white rounded-full px-3 py-2 flex items-center space-x-2">
              <span className="text-gray-400 text-xs">Digite uma mensagem</span>
              <div className="flex space-x-2 ml-auto">
                <Camera className="w-4 h-4 text-gray-400" />
                <Mic className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Cards - Repositioned below phone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-green-600 dark:text-green-500 mb-2">IA Conversacional</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Responde dúvidas sobre produtos, horários e localização</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-green-600 dark:text-green-500 mb-2">Atendimento 24/7</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Informações sempre atualizadas automaticamente</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-center border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-green-600 dark:text-green-500 mb-2">Múltiplos Cenários</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Pedidos, dúvidas, localização e cardápio</div>
        </div>
      </div>
    </div>
  );
}