import { useState } from 'react';
import { ChevronRight, ChevronLeft, User, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
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

export function DiagnosticForm({ onComplete }: DiagnosticFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DiagnosticAnswers>>({});
  const [contact, setContact] = useState<ContactData>({ name: '', phone: '', company: '' });
  const [animating, setAnimating] = useState(false);
  
  const totalSteps = QUESTIONS.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isContactStep = currentStep === QUESTIONS.length;
  
  const handleAnswer = (questionId: keyof DiagnosticAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    setTimeout(() => {
      if (currentStep < QUESTIONS.length) {
        setAnimating(true);
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setAnimating(false);
        }, 150);
      }
    }, 200);
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimating(false);
      }, 150);
    }
  };
  
  const handleSubmit = () => {
    if (contact.name && contact.phone && contact.company) {
      onComplete(answers as DiagnosticAnswers, contact);
    }
  };
  
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };
  
  const isContactValid = contact.name.trim().length >= 3 && 
                         contact.phone.replace(/\D/g, '').length >= 10 && 
                         contact.company.trim().length >= 2;

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
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nome da sua loja/empresa
                </Label>
                <Input
                  id="company"
                  placeholder="Nome da empresa"
                  value={contact.company}
                  onChange={(e) => setContact(prev => ({ ...prev, company: e.target.value }))}
                  className="h-12"
                />
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={!isContactValid}
                className="w-full h-14 text-lg font-semibold mt-6"
                size="lg"
              >
                Ver Meu Resultado
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
