import { useState } from 'react';
import { ChevronRight, ChevronLeft, User, Phone, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn, formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { DiagnosticLoadingScreen } from './DiagnosticLoadingScreen';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { supabase } from '@/integrations/supabase/client';
import type { DiagnosticAnswers, ContactData } from '@/lib/diagnosticScoring';

interface DiagnosticFormProps {
  onComplete: (answers: DiagnosticAnswers, contact: ContactData) => void;
}

interface Question {
  id: keyof DiagnosticAnswers;
  title: string;
  question: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Visibilidade e Atração',
    question: 'Hoje, se um cliente pesquisar por um produto que você tem em estoque (ex: Whey, Açaí, Suplemento) no Google, ele encontra sua loja na vitrine principal com preço e foto?',
    options: [
      { value: 'a', label: 'Sim, meus produtos aparecem automaticamente no Google Shopping' },
      { value: 'b', label: 'Não, sou invisível para quem pesquisa online na minha região' },
      { value: 'c', label: 'Não sei como fazer meu estoque aparecer no Google' }
    ]
  },
  {
    id: 'q2',
    title: 'Conversão Digital',
    question: 'Qual a taxa de perda de vendas no seu WhatsApp por falta de resposta imediata ou dúvidas técnicas fora do horário comercial?',
    options: [
      { value: 'a', label: 'Perco muitas vendas porque não conseguimos responder a tempo' },
      { value: 'b', label: 'Dependo 100% de funcionários humanos, que ficam sobrecarregados' },
      { value: 'c', label: 'Minha IA já atende, tira dúvidas e envia o link de pagamento 24h' }
    ]
  },
  {
    id: 'q3',
    title: 'Eficiência no Balcão',
    question: 'No seu atendimento atual, o sistema sugere produtos complementares (upsell) de forma inteligente e obrigatória em todas as vendas?',
    options: [
      { value: 'a', label: 'Não, depende da proatividade/memória do meu atendente' },
      { value: 'b', label: 'Às vezes, mas não é um processo automatizado' },
      { value: 'c', label: 'Sim, meu Totem/Sistema já faz isso de forma algorítmica' }
    ]
  },
  {
    id: 'q4',
    title: 'Escala e Gestão',
    question: 'Qual o seu maior desafio operacional para dobrar o faturamento da sua loja nos próximos 6 meses?',
    options: [
      { value: 'a', label: 'Reduzir custos com funcionários e erros de pedido' },
      { value: 'b', label: 'Atrair novos clientes qualificados para dentro da loja' },
      { value: 'c', label: 'Padronizar processos para conseguir abrir novas unidades' },
      { value: 'd', label: 'Nenhum, já estou satisfeito com meu faturamento atual' }
    ]
  }
];

// Duração do loading em ms: 4s para Q1-Q3, 6s para Q4
const LOADING_DURATIONS: Record<string, number> = {
  q1: 4000,
  q2: 4000,
  q3: 4000,
  q4: 6000
};

export function DiagnosticForm({ onComplete }: DiagnosticFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DiagnosticAnswers>>({});
  const [contact, setContact] = useState<ContactData>({ name: '', phone: '', company: '' });
  const [animating, setAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQuestionId, setProcessingQuestionId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsappValidated, setIsWhatsappValidated] = useState(false);
  
  const totalSteps = QUESTIONS.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isContactStep = currentStep === QUESTIONS.length;
  
  // Validação automática quando completar o número
  const cleanPhone = contact.phone.replace(/\D/g, '');
  const canValidateWhatsapp = cleanPhone.length >= 10 && contact.name.trim().length >= 3;
  
  const handleAnswer = (questionId: keyof DiagnosticAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Iniciar animação de loading
    setTimeout(() => {
      setProcessingQuestionId(questionId);
      setIsProcessing(true);
    }, 200);
  };
  
  const handleLoadingComplete = () => {
    setIsProcessing(false);
    setProcessingQuestionId(null);
    setAnimating(true);
    
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setAnimating(false);
    }, 150);
  };
  
  const handleBack = () => {
    if (currentStep > 0 && !isProcessing) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimating(false);
      }, 150);
    }
  };
  
  const handlePhoneChange = (value: string) => {
    const formatted = countryCode === '+55'
      ? formatBrazilianPhone(value)
      : formatInternationalPhone(value);
    setContact(prev => ({ ...prev, phone: formatted }));
    
    // Reset validation status when phone changes
    if (whatsappStatus !== 'idle') {
      setWhatsappStatus('idle');
      setIsWhatsappValidated(false);
    }
  };

  // Validar WhatsApp quando perder foco ou completar número
  const handlePhoneBlur = async () => {
    if (canValidateWhatsapp && whatsappStatus === 'idle') {
      const isValid = await validateWhatsApp();
      setIsWhatsappValidated(true);
    }
  };

  const validateWhatsApp = async (): Promise<boolean> => {
    const cleanPhone = contact.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return false;
    
    setWhatsappStatus('validating');
    
    const fullPhone = countryCode.replace('+', '') + cleanPhone;
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { 
          phone: fullPhone,
          leadName: contact.name,
          sendWelcome: true
        }
      });
      
      if (error) throw error;
      
      const isValid = data?.valid || false;
      setWhatsappStatus(isValid ? 'valid' : 'invalid');
      return isValid;
    } catch (err) {
      console.error('Erro ao validar WhatsApp:', err);
      setWhatsappStatus('invalid');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (contact.name && contact.phone && contact.company && !isSubmitting && isWhatsappValidated) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        onComplete(answers as DiagnosticAnswers, contact);
      }, 1000);
    }
  };
  
  const isContactValid = contact.name.trim().length >= 3 && 
                         contact.phone.replace(/\D/g, '').length >= 10 && 
                         contact.company.trim().length >= 2 &&
                         isWhatsappValidated;

  // Renderizar tela de loading se estiver processando
  if (isProcessing && processingQuestionId) {
    return (
      <DiagnosticLoadingScreen
        questionId={processingQuestionId}
        duration={LOADING_DURATIONS[processingQuestionId] || 4000}
        onComplete={handleLoadingComplete}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Barra de progresso */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progresso</span>
          <span>{currentStep + 1} de {totalSteps}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Botão voltar */}
      {currentStep > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      )}
      
      <div className={cn(
        "transition-all duration-300",
        animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      )}>
        {!isContactStep ? (
          // Perguntas
          <div>
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
                {QUESTIONS[currentStep].title}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                {QUESTIONS[currentStep].question}
              </h2>
            </div>
            
            <div className="space-y-3">
              {QUESTIONS[currentStep].options.map((option) => {
                const isSelected = answers[QUESTIONS[currentStep].id] === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(QUESTIONS[currentStep].id, option.value)}
                    className={cn(
                      "w-full p-4 md:p-5 rounded-xl border-2 text-left transition-all duration-200",
                      "hover:border-primary hover:bg-primary/5 active:scale-[0.99]",
                      isSelected 
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                      )}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground animate-scale-in" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm md:text-base",
                        isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {option.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Formulário de contato
          <div>
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
                Última Etapa
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                Para receber seu resultado personalizado, preencha seus dados:
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome completo
                </Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome"
                  value={contact.name}
                  onChange={(e) => setContact(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </Label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={countryCode}
                    onChange={setCountryCode}
                    disabled={isSubmitting}
                  />
                  <div className="relative flex-1">
                    <Input
                      id="phone"
                      placeholder={countryCode === '+55' ? '(11) 99999-9999' : '999 999 9999'}
                      value={contact.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      disabled={isSubmitting}
                      className={cn(
                        "h-12 pr-10",
                        whatsappStatus === 'valid' && 'border-emerald-500 focus-visible:ring-emerald-500',
                        whatsappStatus === 'invalid' && 'border-amber-500 focus-visible:ring-amber-500'
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {whatsappStatus === 'validating' && (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      )}
                      {whatsappStatus === 'valid' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                      {whatsappStatus === 'invalid' && (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
                {whatsappStatus !== 'idle' && (
                  <p className={cn(
                    "text-xs animate-fade-in",
                    whatsappStatus === 'validating' && 'text-muted-foreground',
                    whatsappStatus === 'valid' && 'text-emerald-500',
                    whatsappStatus === 'invalid' && 'text-amber-500'
                  )}>
                    {whatsappStatus === 'validating' && '● Verificando WhatsApp...'}
                    {whatsappStatus === 'valid' && '✓ WhatsApp verificado! Mensagem de boas-vindas enviada.'}
                    {whatsappStatus === 'invalid' && '⚠ WhatsApp não encontrado (o cadastro continuará)'}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company" className={cn(
                  "flex items-center gap-2",
                  !isWhatsappValidated && "text-muted-foreground"
                )}>
                  <Building2 className="w-4 h-4" />
                  Nome da sua loja/empresa
                </Label>
                <Input
                  id="company"
                  placeholder={isWhatsappValidated ? "Nome da empresa" : "Valide seu WhatsApp primeiro"}
                  value={contact.company}
                  onChange={(e) => setContact(prev => ({ ...prev, company: e.target.value }))}
                  className={cn(
                    "h-12",
                    !isWhatsappValidated && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!isWhatsappValidated || isSubmitting}
                />
                {!isWhatsappValidated && canValidateWhatsapp && whatsappStatus === 'idle' && (
                  <p className="text-xs text-muted-foreground">
                    Clique fora do campo WhatsApp para validar
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={!isContactValid || isSubmitting}
                className="w-full h-14 text-lg font-semibold mt-6"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    Ver Meu Resultado
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
