import { useState, useEffect } from 'react';
import { Store } from 'lucide-react';
import { DiagnosticFormDelivery } from '@/components/leads/DiagnosticFormDelivery';
import { DiagnosticResultDelivery } from '@/components/leads/DiagnosticResultDelivery';
import { DiagnosticAlreadyCompleted } from '@/components/leads/DiagnosticAlreadyCompleted';
import { SofiaAutoCall } from '@/components/leads/SofiaAutoCall';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { DeliveryDiagnosticAnswers, ContactData, DeliveryDiagnosticResult, BusinessNiche } from '@/lib/diagnosticScoringDelivery';
import { getDeliveryDiagnosticResult, NICHE_CONFIG } from '@/lib/diagnosticScoringDelivery';
import { generateDeliverySofiaScript } from '@/lib/callScriptGeneratorDelivery';
import type { DiagnosticResult, DiagnosticAnswers } from '@/lib/diagnosticScoring';

const STORAGE_KEY = 'mostralo_delivery_diagnostic';

interface LeadData {
  name: string;
  company: string;
  phone: string;
  answers: any;
  score: number;
  level: string;
}

interface StoredDiagnostic {
  result: DeliveryDiagnosticResult;
  audioBase64: string | null;
  completedAt: string;
  leadData?: LeadData;
}

// Converter resultado de delivery para o formato esperado pelo DiagnosticAlreadyCompleted
function convertToLegacyResult(deliveryResult: DeliveryDiagnosticResult): DiagnosticResult {
  return {
    score: deliveryResult.score,
    maxScore: deliveryResult.maxScore,
    level: deliveryResult.level,
    answers: {
      q1: 'a',
      q2: 'a',
      q3: 'a',
      q4: 'a'
    } as DiagnosticAnswers,
    contact: deliveryResult.contact
  };
}

export default function DiagnosticoDeliveryPage() {
  const [result, setResult] = useState<DeliveryDiagnosticResult | null>(null);
  const [pendingResult, setPendingResult] = useState<DeliveryDiagnosticResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [savedAudio, setSavedAudio] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string>('');
  
  // Estado para abrir o modal de chamada
  const [showSofiaCall, setShowSofiaCall] = useState(false);
  const [storedLeadData, setStoredLeadData] = useState<LeadData | undefined>(undefined);
  
  // Perfil WhatsApp do lead
  const [whatsappProfile, setWhatsappProfile] = useState<{
    pictureUrl: string | null;
    pushName: string | null;
    formattedNumber: string | null;
  }>({ pictureUrl: null, pushName: null, formattedNumber: null });

  // Script personalizado para a Sofia
  const [customScript, setCustomScript] = useState<string>('');

  // Verificar localStorage ao carregar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredDiagnostic = JSON.parse(stored);
        setResult(data.result);
        setSavedAudio(data.audioBase64);
        setCompletedAt(data.completedAt);
        setStoredLeadData(data.leadData);
        setAlreadyCompleted(true);
      }
    } catch (err) {
      console.error('Error loading stored diagnostic:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleFormComplete = async (answers: DeliveryDiagnosticAnswers, contact: ContactData) => {
    setIsSubmitting(true);
    
    try {
      const diagnosticResult = getDeliveryDiagnosticResult(answers, contact);
      const nicheConfig = NICHE_CONFIG[answers.nicho];
      
      // Guardar perfil WhatsApp
      setWhatsappProfile({
        pictureUrl: contact.whatsappProfilePicture || null,
        pushName: contact.whatsappPushName || null,
        formattedNumber: contact.whatsappFormattedNumber || null
      });
      
      // Gerar script personalizado para a Sofia
      const script = generateDeliverySofiaScript({
        leadName: contact.name,
        companyName: contact.company,
        nicho: answers.nicho,
        answers: answers,
        score: diagnosticResult.score,
        level: diagnosticResult.level,
        monthlySavings: diagnosticResult.monthlySavings,
        annualSavings: diagnosticResult.annualSavings,
        currentCommission: diagnosticResult.currentCommission
      });
      setCustomScript(script);
      
      // Extrair número do telefone
      const phoneNumbers = contact.phone.replace(/\D/g, '');
      
      // Salvar lead no banco
      const { error } = await supabase
        .from('leads')
        .insert([{
          email: `lead_${Date.now()}@diagnostico-delivery.mostralo.me`,
          city: 'Não informado',
          company_name: contact.company,
          name: contact.name,
          phone: phoneNumbers,
          company_phone: phoneNumbers,
          source: 'diagnostico-delivery',
          landing_page: '/diagnostico-delivery',
          qualification_level: diagnosticResult.level,
          qualification_score: diagnosticResult.score,
          diagnostic_answers: answers as unknown as Json,
          business_type: nicheConfig.label,
          notes: `Nicho: ${nicheConfig.label} | Economia estimada: R$ ${diagnosticResult.monthlySavings}/mês | R$ ${diagnosticResult.annualSavings}/ano`,
          status: 'new'
        }]);
      
      if (error) {
        console.error('Erro ao salvar lead:', error);
        toast.error('Erro ao salvar seus dados. Tente novamente.');
        setIsSubmitting(false);
        return;
      }
      
      // Guardar resultado pendente e abrir modal de chamada
      setPendingResult(diagnosticResult);
      setShowSofiaCall(true);
      
    } catch (err) {
      console.error('Erro no diagnóstico:', err);
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSofiaCallComplete = (audioBase64: string) => {
    // Salvar no localStorage
    if (pendingResult) {
      const leadData: LeadData = {
        name: pendingResult.contact.name,
        company: pendingResult.contact.company,
        phone: pendingResult.contact.phone,
        answers: pendingResult.answers,
        score: pendingResult.score,
        level: pendingResult.level
      };
      
      const storedData: StoredDiagnostic = {
        result: pendingResult,
        audioBase64: audioBase64 || null,
        completedAt: new Date().toISOString(),
        leadData
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
      
      setSavedAudio(audioBase64 || null);
      setCompletedAt(storedData.completedAt);
      setStoredLeadData(leadData);
    }
    
    // Fechar chamada e mostrar resultado
    setShowSofiaCall(false);
    setResult(pendingResult);
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setResult(null);
    setPendingResult(null);
    setSavedAudio(null);
    setAlreadyCompleted(false);
    setCompletedAt('');
    setShowSofiaCall(false);
    setCustomScript('');
    setStoredLeadData(undefined);
  };

  // Criar leadData compatível com SofiaAutoCall
  const getSofiaLeadData = () => {
    if (!pendingResult) return null;
    
    // Converter DeliveryDiagnosticAnswers para DiagnosticAnswers (formato legacy)
    const legacyAnswers: DiagnosticAnswers = {
      q1: 'a',
      q2: 'a',
      q3: 'a',
      q4: 'a'
    };
    
    return {
      name: pendingResult.contact.name,
      company: pendingResult.contact.company,
      phone: pendingResult.contact.phone,
      answers: legacyAnswers,
      score: pendingResult.score,
      level: pendingResult.level
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <a href="/" className="flex items-center gap-2">
            <Store className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl text-foreground">Mostralo</span>
          </a>
        </div>
      </header>

      {/* SofiaAutoCall - Ligação automática */}
      {showSofiaCall && pendingResult && getSofiaLeadData() && (
        <SofiaAutoCall
          isOpen={showSofiaCall}
          leadData={getSofiaLeadData()!}
          whatsappProfile={whatsappProfile}
          savedAudioBase64={savedAudio}
          customScript={customScript}
          onAudioComplete={handleSofiaCallComplete}
        />
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        {alreadyCompleted && result ? (
          <>
            <DiagnosticAlreadyCompleted
              result={convertToLegacyResult(result)}
              audioBase64={savedAudio}
              completedAt={completedAt}
              onRestart={handleRestart}
              leadData={storedLeadData}
            />
            <div className="mt-8">
              <DiagnosticResultDelivery result={result} savedAudioBase64={savedAudio} />
            </div>
          </>
        ) : result ? (
          <DiagnosticResultDelivery 
            result={result} 
            savedAudioBase64={savedAudio}
          />
        ) : (
          <>
            {/* Hero */}
            <div className="text-center mb-10 md:mb-12 animate-fade-in">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                Diagnóstico de Delivery
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Descubra quanto você está perdendo em comissões para iFood, Rappi e outros apps. Calcule sua economia com app próprio.
              </p>
            </div>

            {/* Formulário */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <DiagnosticFormDelivery onComplete={handleFormComplete} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
