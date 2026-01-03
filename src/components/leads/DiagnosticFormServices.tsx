import { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, User, Phone, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn, formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { DiagnosticLoadingScreen } from './DiagnosticLoadingScreen';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { WhatsAppValidationSteps, INITIAL_VALIDATION_STEPS, type ValidationStep, type StepStatus } from './WhatsAppValidationSteps';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ServiceDiagnosticAnswers, 
  ContactData, 
  ServiceNiche 
} from '@/lib/diagnosticScoringServices';
import { 
  SERVICE_NICHE_CONFIG, 
  SERVICE_NICHE_QUESTIONS, 
  GESTAO_OPTIONS, 
  VOLUME_SEMANAL_OPTIONS,
  DESAFIO_OPTIONS_BY_NICHE 
} from '@/lib/diagnosticScoringServices';

interface DiagnosticFormServicesProps {
  onComplete: (answers: ServiceDiagnosticAnswers, contact: ContactData) => void;
}

interface Question {
  id: 'nicho' | 'gestaoAgendamento' | 'volumeSemanal' | 'maiorDesafio';
  title: string;
  question: string;
  options: { value: string; label: string }[];
}

// Duração do loading em ms
const LOADING_DURATIONS: Record<string, number> = {
  nicho: 3000,
  gestaoAgendamento: 4000,
  volumeSemanal: 4000,
  maiorDesafio: 6000
};

// Helper para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function DiagnosticFormServices({ onComplete }: DiagnosticFormServicesProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ServiceDiagnosticAnswers>>({});
  const [contact, setContact] = useState<ContactData>({ name: '', phone: '', company: '' });
  const [animating, setAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQuestionId, setProcessingQuestionId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsappValidated, setIsWhatsappValidated] = useState(false);
  
  // Dados do perfil WhatsApp
  const [whatsappProfilePic, setWhatsappProfilePic] = useState<string | null>(null);
  const [whatsappPushName, setWhatsappPushName] = useState<string | null>(null);
  const [whatsappFormattedNumber, setWhatsappFormattedNumber] = useState<string | null>(null);
  
  // Estados para validação progressiva
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>(INITIAL_VALIDATION_STEPS);
  const [showValidationSteps, setShowValidationSteps] = useState(false);
  
  // Gerar perguntas dinamicamente baseado no nicho selecionado
  const getQuestions = useCallback((): Question[] => {
    const selectedNiche = answers.nicho as ServiceNiche | undefined;
    const nicheQuestions = selectedNiche ? SERVICE_NICHE_QUESTIONS[selectedNiche] : SERVICE_NICHE_QUESTIONS.outro;
    const desafioOptions = selectedNiche ? DESAFIO_OPTIONS_BY_NICHE[selectedNiche] : DESAFIO_OPTIONS_BY_NICHE.outro;
    
    return [
      {
        id: 'nicho' as const,
        title: 'Seu Negócio',
        question: 'Qual o tipo do seu negócio?',
        options: Object.entries(SERVICE_NICHE_CONFIG).map(([value, config]) => ({
          value,
          label: `${config.icon} ${config.label}`
        }))
      },
      {
        id: 'gestaoAgendamento' as const,
        title: 'Gestão de Agenda',
        question: nicheQuestions.gestaoAgendamento,
        options: GESTAO_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))
      },
      {
        id: 'volumeSemanal' as const,
        title: 'Volume de Atendimentos',
        question: nicheQuestions.volumeSemanal,
        options: VOLUME_SEMANAL_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))
      },
      {
        id: 'maiorDesafio' as const,
        title: 'Maior Desafio',
        question: nicheQuestions.maiorDesafio,
        options: desafioOptions.map(opt => ({ value: opt.value, label: opt.label }))
      }
    ];
  }, [answers.nicho]);
  
  const questions = getQuestions();
  const totalSteps = questions.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isContactStep = currentStep === questions.length;
  
  // Validação automática quando completar o número
  const cleanPhone = contact.phone.replace(/\D/g, '');
  const canValidateWhatsapp = cleanPhone.length >= 10 && contact.name.trim().length >= 3;
  
  // Função para atualizar status de uma etapa
  const updateStepStatus = useCallback((stepId: string, status: StepStatus, result?: string) => {
    setValidationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result } : step
    ));
  }, []);
  
  const handleAnswer = (questionId: Question['id'], value: string) => {
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
      setShowValidationSteps(false);
      setValidationSteps(INITIAL_VALIDATION_STEPS);
      setWhatsappProfilePic(null);
      setWhatsappPushName(null);
      setWhatsappFormattedNumber(null);
    }
  };

  // Validar WhatsApp quando perder foco
  const handlePhoneBlur = async () => {
    if (canValidateWhatsapp && whatsappStatus === 'idle') {
      await validateWhatsApp();
    }
  };

  const validateWhatsApp = async (): Promise<boolean> => {
    const cleanPhone = contact.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return false;
    
    setWhatsappStatus('validating');
    setShowValidationSteps(true);
    setValidationSteps(INITIAL_VALIDATION_STEPS);
    
    const fullPhone = countryCode.replace('+', '') + cleanPhone;
    
    try {
      updateStepStatus('validate', 'loading');
      await delay(600);
      
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { 
          phone: fullPhone,
          leadName: contact.name,
          sendWelcome: true
        }
      });
      
      if (error) throw error;
      
      const isValid = data?.valid || false;
      
      if (!isValid) {
        updateStepStatus('validate', 'error', 'Número não encontrado no WhatsApp');
        setWhatsappStatus('invalid');
        setIsWhatsappValidated(true);
        return false;
      }
      
      updateStepStatus('validate', 'success', 'Número válido!');
      
      if (data?.profilePictureUrl) {
        setWhatsappProfilePic(data.profilePictureUrl);
      }
      
      if (data?.pushName) {
        setWhatsappPushName(data.pushName);
      }
      
      if (data?.formattedNumber) {
        setWhatsappFormattedNumber(data.formattedNumber);
      }
      
      setWhatsappStatus('valid');
      setIsWhatsappValidated(true);
      
      return true;
    } catch (err) {
      console.error('Erro ao validar WhatsApp:', err);
      updateStepStatus('validate', 'error', 'Erro na validação');
      setWhatsappStatus('invalid');
      setIsWhatsappValidated(true);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (contact.name && contact.phone && contact.company && !isSubmitting && isWhatsappValidated) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        onComplete(answers as ServiceDiagnosticAnswers, {
          ...contact,
          whatsappProfilePicture: whatsappProfilePic,
          whatsappPushName: whatsappPushName,
          whatsappFormattedNumber: whatsappFormattedNumber
        });
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
                {questions[currentStep].title}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                {questions[currentStep].question}
              </h2>
            </div>
            
            <div className="space-y-3">
              {questions[currentStep].options.map((option) => {
                const questionId = questions[currentStep].id;
                const isSelected = answers[questionId] === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(questionId, option.value)}
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
                      type="tel"
                      inputMode="numeric"
                      placeholder={countryCode === '+55' ? '(11) 99999-9999' : '999 999 9999'}
                      value={contact.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      disabled={isSubmitting}
                      className="h-12"
                    />
                  </div>
                </div>
                
                {/* Etapas de validação progressiva */}
                {showValidationSteps && (
                  <WhatsAppValidationSteps 
                    steps={validationSteps} 
                    className="mt-3"
                  />
                )}
                
                {!showValidationSteps && canValidateWhatsapp && whatsappStatus === 'idle' && (
                  <p className="text-xs text-muted-foreground">
                    Clique fora do campo WhatsApp para validar
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company" className={cn(
                  "flex items-center gap-2",
                  !isWhatsappValidated && "text-muted-foreground"
                )}>
                  <Building2 className="w-4 h-4" />
                  Nome do seu negócio
                </Label>
                <Input
                  id="company"
                  placeholder={isWhatsappValidated ? "Nome do seu estabelecimento" : "Valide seu WhatsApp primeiro"}
                  value={contact.company}
                  onChange={(e) => setContact(prev => ({ ...prev, company: e.target.value }))}
                  className={cn(
                    "h-12",
                    !isWhatsappValidated && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!isWhatsappValidated || isSubmitting}
                />
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
                    Calculando sua economia...
                  </>
                ) : (
                  <>
                    Ver Minha Economia
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
