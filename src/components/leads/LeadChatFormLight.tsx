import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Send, Check, CheckCheck, Loader2 } from 'lucide-react';

interface LeadChatFormLightProps {
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

const STORAGE_KEY = 'mostralo_lead_form_progress_light';
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
    const item: SavedProgress = { ...data, timestamp: Date.now() };
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
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const clearProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const STEPS_CONFIG: Record<Step, { question: string; placeholder?: string; inputType?: string }> = {
  name: {
    question: '👋 Olá! Que bom que você quer conhecer o Mostralo!\n\nComo posso te chamar?',
    placeholder: 'Digite seu nome...',
    inputType: 'text'
  },
  email: {
    question: 'Prazer, {name}! 😊\n\nQual o seu melhor e-mail?',
    placeholder: 'seu@email.com',
    inputType: 'email'
  },
  phone: {
    question: 'Perfeito!\n\nQual o WhatsApp para conversarmos?',
    placeholder: '(00) 00000-0000',
    inputType: 'tel'
  },
  company: {
    question: 'Ótimo! 🎉\n\nQual o nome da sua empresa?',
    placeholder: 'Nome da empresa...',
    inputType: 'text'
  },
  city: {
    question: 'Legal!\n\nEm qual cidade vocês ficam?',
    placeholder: 'Nome da cidade...',
    inputType: 'text'
  },
  ifood: {
    question: 'Última pergunta:\n\nVocês já usam iFood?',
    placeholder: '',
    inputType: 'buttons'
  },
  complete: {
    question: 'Maravilha, {name}! 🎉\n\nVou te conectar com um consultor agora!',
    placeholder: '',
    inputType: 'final'
  }
};

export function LeadChatFormLight({ onComplete, onClose }: LeadChatFormLightProps) {
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
  const isProcessingIfoodRef = useRef(false);

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

  useEffect(() => {
    if (messages.length > 0 && currentStep !== 'complete') {
      saveProgress({ step: currentStep, data: leadData, msgs: messages });
    }
  }, [currentStep, leadData, messages]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
    if (currentStep === 'phone') value = formatPhone(value);
    setInputValue(value);
  };

  const validateInput = (): boolean => {
    switch (currentStep) {
      case 'name': return inputValue.trim().length >= 2;
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
      case 'phone': return inputValue.replace(/\D/g, '').length >= 10;
      case 'company': return inputValue.trim().length >= 2;
      case 'city': return inputValue.trim().length >= 2;
      default: return true;
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
    addUserMessage(currentInput);
    setInputValue('');

    const updatedData = { ...leadData };
    switch (currentStep) {
      case 'name': updatedData.name = currentInput.trim(); break;
      case 'email': updatedData.email = currentInput.trim().toLowerCase(); break;
      case 'phone': updatedData.phone = currentInput.replace(/\D/g, ''); break;
      case 'company': updatedData.company_name = currentInput.trim(); break;
      case 'city': updatedData.city = currentInput.trim(); break;
    }
    setLeadData(updatedData);

    if (currentStep === 'phone') {
      setIsTyping(true);
      setIsValidatingPhone(true);

      const showValidationMessages = async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsTyping(false);
        addBotMessage('⏳ Verificando seu WhatsApp...');
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsTyping(false);
        addBotMessage('🔍 Conectando...');
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsTyping(false);
        addBotMessage('📱 Validando número...');
      };

      const validatePhone = async () => {
        const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
          body: { phone: updatedData.phone, leadName: updatedData.name, sendWelcome: true }
        });
        return { data, error };
      };

      try {
        const [, validationResult] = await Promise.all([showValidationMessages(), validatePhone()]);
        const { data, error } = validationResult;

        if (error || !data?.valid) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 1200));
          setIsTyping(false);
          addBotMessage('❌ Número não encontrado no WhatsApp...');
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 1500));
          setIsTyping(false);
          addBotMessage('📲 Verifique o número e tente novamente!');
          setIsValidatingPhone(false);
          setLeadData(prev => ({ ...prev, phone: '' }));
          return;
        }

        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setIsTyping(false);
        addBotMessage('✅ WhatsApp encontrado!');

        if (data?.welcomeSent) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 1500));
          setIsTyping(false);
          addBotMessage('💬 Te mandei uma mensagem lá! 😉');
        }

        await new Promise(resolve => setTimeout(resolve, 1200));
        const nextStep = getNextStep(currentStep);
        setCurrentStep(nextStep);
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsTyping(false);
        addBotMessage(STEPS_CONFIG[nextStep].question.replace('{name}', updatedData.name));
        setIsValidatingPhone(false);
        return;
      } catch (err) {
        setIsValidatingPhone(false);
      }
    }

    const nextStep = getNextStep(currentStep);
    setCurrentStep(nextStep);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(STEPS_CONFIG[nextStep].question.replace('{name}', updatedData.name));
    }, 800);
  };

  const handleIfoodResponse = async (usesIfood: boolean) => {
    if (isProcessingIfoodRef.current || isSubmitting || currentStep !== 'ifood') return;
    isProcessingIfoodRef.current = true;
    setIsSubmitting(true);

    addUserMessage(usesIfood ? 'Sim, uso iFood' : 'Não uso iFood');
    const finalData = { ...leadData, uses_ifood: usesIfood };
    setLeadData(finalData);
    setCurrentStep('complete');
    setIsTyping(true);

    try {
      const referralCode = localStorage.getItem('mostralo_referral_code');
      const urlParams = new URLSearchParams(window.location.search);
      let salespersonId = null;
      if (referralCode) {
        const { data: salesperson } = await supabase.from('salespeople').select('id').eq('referral_code', referralCode).single();
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
      clearProgress();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setIsSubmitting(false);
      isProcessingIfoodRef.current = false;
    }

    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(STEPS_CONFIG.complete.question.replace('{name}', finalData.name));
    }, 1000);
  };

  const handleOpenWhatsApp = async () => {
    const { data } = await supabase.from('subscription_payment_config').select('support_whatsapp, support_whatsapp_message').limit(1).single();
    const whatsappNumber = data?.support_whatsapp || '5511941941427';
    const messageTemplate = data?.support_whatsapp_message || 'Olá! Sou {nome} e gostaria de saber mais sobre o Mostralo!';
    const formattedPhone = leadData.phone.length === 11 ? `(${leadData.phone.slice(0,2)}) ${leadData.phone.slice(2,7)}-${leadData.phone.slice(7)}` : leadData.phone;
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
    <div className="flex flex-col h-full min-h-0 bg-white rounded-b-[2rem] overflow-hidden">
      {/* Header - Light Theme WhatsApp style */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#008069] text-white shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
            M
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#008069]" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">Consultor Mostralo</h3>
          <p className="text-xs text-white/80">online</p>
        </div>
      </div>

      {/* Messages - Light Theme - Fixed overflow */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-[#efeae2]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d1d1d1\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg shadow-sm ${
              message.isBot 
                ? 'bg-white text-gray-800 rounded-tl-none' 
                : 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'
            }`}>
              <p className="text-sm whitespace-pre-line">{message.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500">{message.time}</span>
                {!message.isBot && message.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-lg rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Light Theme - Fixed height */}
      <div className="p-2 bg-[#f0f2f5] border-t border-gray-200 shrink-0">
        {currentStep === 'ifood' ? (
          <div className="flex gap-2 justify-center py-2">
            <Button 
              onClick={() => handleIfoodResponse(true)} 
              disabled={isSubmitting}
              className="bg-[#008069] hover:bg-[#006d59] text-white px-6"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim'}
            </Button>
            <Button 
              onClick={() => handleIfoodResponse(false)} 
              disabled={isSubmitting}
              variant="outline"
              className="border-[#008069] text-[#008069] hover:bg-[#008069]/10 px-6"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Não'}
            </Button>
          </div>
        ) : currentStep === 'complete' ? (
          <Button 
            onClick={handleOpenWhatsApp} 
            className="w-full bg-[#008069] hover:bg-[#006d59] text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Falar com Consultor
          </Button>
        ) : (
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={STEPS_CONFIG[currentStep].placeholder}
              type={STEPS_CONFIG[currentStep].inputType}
              disabled={isTyping || isValidatingPhone}
              className="flex-1 bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-full px-4"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!validateInput() || isTyping || isValidatingPhone}
              size="icon"
              className="rounded-full bg-[#008069] hover:bg-[#006d59] w-10 h-10 shrink-0"
            >
              {isValidatingPhone ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
