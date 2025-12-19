import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Send, Check, CheckCheck, Loader2 } from 'lucide-react';

interface LeadChatFormProps {
  onComplete: (whatsappNumber: string, message: string) => void;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

type Step = 'name' | 'email' | 'phone' | 'company' | 'city' | 'ifood' | 'complete';

const STORAGE_KEY = 'mostralo_lead_form_progress';
const EXPIRATION_HOURS = 24;

interface SavedProgress {
  step: Step;
  data: {
    name: string;
    email: string;
    phone: string;
    company_name: string;
    city: string;
    uses_ifood: boolean;
  };
  msgs: Message[];
  timestamp: number;
}

const saveProgress = (data: Omit<SavedProgress, 'timestamp'>) => {
  try {
    const item: SavedProgress = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
  } catch (e) {
    console.error('Erro ao salvar progresso:', e);
  }
};

const loadProgress = (): SavedProgress | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed: SavedProgress = JSON.parse(saved);
    const now = Date.now();
    const expirationMs = EXPIRATION_HOURS * 60 * 60 * 1000;
    
    if (now - parsed.timestamp > expirationMs) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch (e) {
    console.error('Erro ao carregar progresso:', e);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const clearProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao limpar progresso:', e);
  }
};

const STEPS_CONFIG: Record<Step, { question: string; placeholder?: string; inputType?: string }> = {
  name: {
    question: '👋 Olá! Que bom que você quer conhecer o Mostralo!\n\nComo posso te chamar?',
    placeholder: 'Digite seu nome...',
    inputType: 'text'
  },
  email: {
    question: 'Prazer, {name}! 😊\n\nQual o seu melhor e-mail para contato?',
    placeholder: 'seu@email.com',
    inputType: 'email'
  },
  phone: {
    question: 'Perfeito!\n\nQual o WhatsApp para conversarmos?',
    placeholder: '(00) 00000-0000',
    inputType: 'tel'
  },
  company: {
    question: 'Ótimo! 🎉\n\nQual o nome da sua empresa ou loja?',
    placeholder: 'Nome da empresa...',
    inputType: 'text'
  },
  city: {
    question: 'Legal!\n\nEm qual cidade vocês ficam?',
    placeholder: 'Nome da cidade...',
    inputType: 'text'
  },
  ifood: {
    question: 'Só mais uma pergunta:\n\nVocês já usam iFood ou similar?',
    placeholder: '',
    inputType: 'buttons'
  },
  complete: {
    question: 'Maravilha, {name}! 🎉\n\nAgora vou te conectar com um consultor para tirar todas as suas dúvidas!',
    placeholder: '',
    inputType: 'final'
  }
};

export function LeadChatForm({ onComplete, onClose }: LeadChatFormProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    city: '',
    uses_ifood: false
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.replace('{name}', leadData.name || ''),
      isBot: true,
      time: getCurrentTime()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      time: getCurrentTime(),
      status: 'read'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Inicializar: carregar progresso ou mostrar primeira mensagem
  useEffect(() => {
    const saved = loadProgress();
    
    if (saved && saved.step !== 'complete') {
      setCurrentStep(saved.step);
      setLeadData(saved.data);
      setMessages(saved.msgs);
    } else {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        addBotMessage(STEPS_CONFIG.name.question);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Salvar progresso automaticamente
  useEffect(() => {
    if (messages.length > 0 && currentStep !== 'complete') {
      saveProgress({
        step: currentStep,
        data: leadData,
        msgs: messages
      });
    }
  }, [currentStep, leadData, messages]);

  // Auto-scroll usando scrollIntoView
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus no input
  useEffect(() => {
    if (!isTyping && inputRef.current && STEPS_CONFIG[currentStep].inputType !== 'buttons' && STEPS_CONFIG[currentStep].inputType !== 'final') {
      inputRef.current.focus();
    }
  }, [isTyping, currentStep]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (currentStep === 'phone') {
      value = formatPhone(value);
    }
    setInputValue(value);
  };

  const validateInput = (): boolean => {
    switch (currentStep) {
      case 'name':
        return inputValue.trim().length >= 2;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
      case 'phone':
        return inputValue.replace(/\D/g, '').length >= 10;
      case 'company':
        return inputValue.trim().length >= 2;
      case 'city':
        return inputValue.trim().length >= 2;
      default:
        return true;
    }
  };

  const getNextStep = (current: Step): Step => {
    const steps: Step[] = ['name', 'email', 'phone', 'company', 'city', 'ifood', 'complete'];
    const currentIndex = steps.indexOf(current);
    return steps[currentIndex + 1] || 'complete';
  };

  const handleSubmit = async () => {
    if (!validateInput() || isTyping || isValidatingPhone) return;

    const currentInput = inputValue;
    
    // Adicionar mensagem do usuário
    addUserMessage(currentInput);
    setInputValue('');

    // Atualizar dados do lead
    const updatedData = { ...leadData };
    switch (currentStep) {
      case 'name':
        updatedData.name = currentInput.trim();
        break;
      case 'email':
        updatedData.email = currentInput.trim().toLowerCase();
        break;
      case 'phone':
        updatedData.phone = currentInput.replace(/\D/g, '');
        break;
      case 'company':
        updatedData.company_name = currentInput.trim();
        break;
      case 'city':
        updatedData.city = currentInput.trim();
        break;
    }
    setLeadData(updatedData);

    // Validação especial para telefone - verificar no WhatsApp
    if (currentStep === 'phone') {
      setIsTyping(true);
      
      // Mostrar mensagem de verificação
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage('⏳ Aguarde, estou verificando seu WhatsApp...');
        setIsValidatingPhone(true);
      }, 500);

      // Chamar edge function para validar
      try {
        const phoneToValidate = updatedData.phone;
        console.log('[LeadChatForm] Validando telefone:', phoneToValidate);
        
        const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
          body: { 
            phone: phoneToValidate,
            leadName: updatedData.name,
            sendWelcome: true
          }
        });

        console.log('[LeadChatForm] Resposta validação:', data, error);

        if (error || !data?.valid) {
          // Número inválido - pedir novamente
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage('❌ Não encontrei esse número no WhatsApp. Pode verificar e digitar novamente?');
            setIsValidatingPhone(false);
            // Voltar o dado para vazio para permitir nova tentativa
            setLeadData(prev => ({ ...prev, phone: '' }));
          }, 600);
          return;
        }

        // Número válido - continuar
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const welcomeMsg = data?.welcomeSent 
            ? '✅ WhatsApp verificado! Acabei de te mandar uma mensagem lá 😉'
            : '✅ WhatsApp verificado!';
          addBotMessage(welcomeMsg);
          
          // Avançar para próximo passo
          setTimeout(() => {
            const nextStep = getNextStep(currentStep);
            setCurrentStep(nextStep);
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              addBotMessage(STEPS_CONFIG[nextStep].question.replace('{name}', updatedData.name));
              setIsValidatingPhone(false);
            }, 600);
          }, 800);
        }, 500);
        
        return;
      } catch (err) {
        console.error('[LeadChatForm] Erro ao validar telefone:', err);
        // Em caso de erro, continuar sem validação
        setIsValidatingPhone(false);
      }
    }

    // Próximo passo (para outros campos)
    const nextStep = getNextStep(currentStep);
    setCurrentStep(nextStep);

    // Simular digitação do bot
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(STEPS_CONFIG[nextStep].question.replace('{name}', updatedData.name));
    }, 800);
  };

  const handleIfoodResponse = async (usesIfood: boolean) => {
    // Prevenir cliques duplos
    if (isSubmitting || currentStep !== 'ifood') return;
    
    addUserMessage(usesIfood ? 'Sim, uso iFood' : 'Não uso iFood');
    
    const finalData = { ...leadData, uses_ifood: usesIfood };
    setLeadData(finalData);
    setCurrentStep('complete');

    setIsTyping(true);
    
    // Salvar lead no banco
    setIsSubmitting(true);
    try {
      const referralCode = localStorage.getItem('mostralo_referral_code');
      const urlParams = new URLSearchParams(window.location.search);
      
      // Buscar salesperson_id se tiver referral_code
      let salespersonId = null;
      if (referralCode) {
        const { data: salesperson } = await supabase
          .from('salespeople')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        salespersonId = salesperson?.id;
      }

      await supabase.from('leads').insert({
        name: finalData.name,
        email: finalData.email,
        phone: finalData.phone,
        company_name: finalData.company_name,
        city: finalData.city,
        uses_ifood: finalData.uses_ifood,
        referral_code: referralCode,
        salesperson_id: salespersonId,
        source: 'website',
        landing_page: window.location.pathname,
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
        user_agent: navigator.userAgent
      });
      
      // Enviar notificação master de novo lead
      try {
        await supabase.functions.invoke('send-master-notification', {
          body: {
            type: 'new_lead',
            data: {
              name: finalData.name,
              email: finalData.email,
              phone: finalData.phone,
              company_name: finalData.company_name,
              city: finalData.city,
              uses_ifood: finalData.uses_ifood,
              source: 'website'
            }
          }
        });
      } catch (notifyError) {
        console.error('Erro ao enviar notificação:', notifyError);
      }
      
      // Limpar progresso salvo após envio bem-sucedido
      clearProgress();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setIsSubmitting(false);
    }

    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(STEPS_CONFIG.complete.question.replace('{name}', finalData.name));
    }, 1000);
  };

  const handleOpenWhatsApp = async () => {
    // Buscar número e mensagem de WhatsApp configurados
    const { data } = await supabase
      .from('subscription_payment_config')
      .select('support_whatsapp, support_whatsapp_message')
      .limit(1)
      .single();
    
    const whatsappNumber = data?.support_whatsapp || '5511941941427';
    const messageTemplate = data?.support_whatsapp_message || 'Olá! Sou {nome} e gostaria de saber mais sobre o Mostralo!';
    
    // Formatar telefone para exibição
    const formattedPhone = leadData.phone.length === 11 
      ? `(${leadData.phone.slice(0,2)}) ${leadData.phone.slice(2,7)}-${leadData.phone.slice(7)}`
      : leadData.phone;
    
    // Substituir TODOS os placeholders
    const finalMessage = messageTemplate
      .replace(/{nome}/gi, leadData.name)
      .replace(/{email}/gi, leadData.email)
      .replace(/{telefone}/gi, formattedPhone)
      .replace(/{empresa}/gi, leadData.company_name)
      .replace(/{cidade}/gi, leadData.city)
      .replace(/{ifood}/gi, leadData.uses_ifood ? 'Sim' : 'Não');
    
    onComplete(whatsappNumber, finalMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[500px] max-h-[80vh] bg-[#0b141a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] border-b border-[#2a373f]">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
            M
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33]" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium text-sm">Consultor Mostralo</h3>
          <p className="text-green-400 text-xs">online</p>
        </div>
        <button 
          onClick={onClose}
          className="text-[#aebac1] hover:text-white transition-colors text-xl"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 p-4"
        style={{ 
          backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3Oeli9NAAAACXBIWXMAAAsSAAALEgHS3X78AAAAQklEQVRIx+3PQQ0AIAzA0I1Q4N/NReBTEbIWq6IBAAAAAAAAAAAAADCS6ql0vZhUIm0ZAQAAAAAAAAAAAADR3wBL7gL1wgAAAABJRU5ErkJggg==")',
          backgroundColor: '#0b141a'
        }}
      >
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg ${
                  msg.isBot
                    ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    : 'bg-[#005c4b] text-white rounded-tr-none'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <span className="text-[10px] text-[#8696a0]">{msg.time}</span>
                  {!msg.isBot && (
                    <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#202c33] text-[#e9edef] px-4 py-3 rounded-lg rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Âncora para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-4 py-3 bg-[#202c33] border-t border-[#2a373f]">
        {currentStep === 'ifood' && !isTyping ? (
          <div className="flex gap-2">
            <Button
              onClick={() => handleIfoodResponse(true)}
              variant="outline"
              className="flex-1 bg-[#005c4b] border-[#005c4b] text-white hover:bg-[#007c65]"
            >
              Sim, uso
            </Button>
            <Button
              onClick={() => handleIfoodResponse(false)}
              variant="outline"
              className="flex-1 bg-[#202c33] border-[#3b4a54] text-[#e9edef] hover:bg-[#2a373f]"
            >
              Não uso
            </Button>
          </div>
        ) : currentStep === 'complete' && !isTyping ? (
          <Button
            onClick={handleOpenWhatsApp}
            disabled={isSubmitting}
            className="w-full bg-[#25d366] hover:bg-[#1ebe5c] text-white font-medium"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Abrir WhatsApp
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={STEPS_CONFIG[currentStep].placeholder}
              type={STEPS_CONFIG[currentStep].inputType === 'email' ? 'email' : 'text'}
              className="flex-1 bg-[#2a373f] border-none text-[#e9edef] placeholder:text-[#8696a0] focus-visible:ring-0"
              disabled={isTyping}
            />
            <Button
              onClick={handleSubmit}
              disabled={!validateInput() || isTyping}
              size="icon"
              className="bg-[#00a884] hover:bg-[#008c6f] text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}