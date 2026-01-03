import { useState, useEffect } from 'react';
import { Store, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { DiagnosticFormServices } from '@/components/leads/DiagnosticFormServices';
import { DiagnosticResultServices } from '@/components/leads/DiagnosticResultServices';
import { DiagnosticAlreadyCompleted } from '@/components/leads/DiagnosticAlreadyCompleted';
import { SofiaAutoCall } from '@/components/leads/SofiaAutoCall';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { ServiceDiagnosticAnswers, ContactData, ServiceDiagnosticResult, ServiceNiche } from '@/lib/diagnosticScoringServices';
import { getServiceDiagnosticResult, SERVICE_NICHE_CONFIG } from '@/lib/diagnosticScoringServices';
import { generateServicesSofiaScript } from '@/lib/callScriptGeneratorServices';
import type { DiagnosticResult, DiagnosticAnswers } from '@/lib/diagnosticScoring';

const STORAGE_KEY = 'mostralo_services_diagnostic';

interface StoredDiagnostic {
  result: ServiceDiagnosticResult;
  audioBase64: string | null;
  completedAt: string;
}

// Converter resultado de serviços para o formato esperado pelo DiagnosticAlreadyCompleted
function convertToLegacyResult(serviceResult: ServiceDiagnosticResult): DiagnosticResult {
  return {
    score: serviceResult.score,
    maxScore: serviceResult.maxScore,
    level: serviceResult.level,
    answers: {
      q1: 'a',
      q2: 'a',
      q3: 'a',
      q4: 'a'
    } as DiagnosticAnswers,
    contact: serviceResult.contact
  };
}

export default function DiagnosticoServicosPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<ServiceDiagnosticResult | null>(null);
  const [pendingResult, setPendingResult] = useState<ServiceDiagnosticResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [savedAudio, setSavedAudio] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string>('');
  
  // Estado para abrir o modal de chamada
  const [showSofiaCall, setShowSofiaCall] = useState(false);
  
  // Perfil WhatsApp do lead
  const [whatsappProfile, setWhatsappProfile] = useState<{
    pictureUrl: string | null;
    pushName: string | null;
    formattedNumber: string | null;
  }>({ pictureUrl: null, pushName: null, formattedNumber: null });

  // Script personalizado para a Sofia
  const [customScript, setCustomScript] = useState<string>('');

  // Montar para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificar localStorage ao carregar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredDiagnostic = JSON.parse(stored);
        setResult(data.result);
        setSavedAudio(data.audioBase64);
        setCompletedAt(data.completedAt);
        setAlreadyCompleted(true);
      }
    } catch (err) {
      console.error('Error loading stored diagnostic:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleFormComplete = async (answers: ServiceDiagnosticAnswers, contact: ContactData) => {
    setIsSubmitting(true);
    
    try {
      const diagnosticResult = getServiceDiagnosticResult(answers, contact);
      const nicheConfig = SERVICE_NICHE_CONFIG[answers.nicho];
      
      // Guardar perfil WhatsApp
      setWhatsappProfile({
        pictureUrl: contact.whatsappProfilePicture || null,
        pushName: contact.whatsappPushName || null,
        formattedNumber: contact.whatsappFormattedNumber || null
      });
      
      // Gerar script personalizado para a Sofia
      const script = generateServicesSofiaScript({
        leadName: contact.name,
        companyName: contact.company,
        nicho: answers.nicho,
        answers: answers,
        score: diagnosticResult.score,
        level: diagnosticResult.level,
        noShowSavings: diagnosticResult.noShowSavings,
        timeSavedHours: diagnosticResult.timeSavedHours,
        inactiveRecovery: diagnosticResult.inactiveRecovery,
        totalMonthlySavings: diagnosticResult.totalMonthlySavings
      });
      setCustomScript(script);
      
      // Extrair número do telefone
      const phoneNumbers = contact.phone.replace(/\D/g, '');
      
      // Salvar lead no banco
      const { error } = await supabase
        .from('leads')
        .insert([{
          email: `lead_${Date.now()}@diagnostico-servicos.mostralo.me`,
          city: 'Não informado',
          company_name: contact.company,
          name: contact.name,
          phone: phoneNumbers,
          company_phone: phoneNumbers,
          source: 'diagnostico-servicos',
          landing_page: '/diagnostico-servicos',
          qualification_level: diagnosticResult.level,
          qualification_score: diagnosticResult.score,
          diagnostic_answers: answers as unknown as Json,
          business_type: nicheConfig.label,
          notes: `Nicho: ${nicheConfig.label} | Economia no-show: R$ ${diagnosticResult.noShowSavings}/mês | Tempo: ${diagnosticResult.timeSavedHours}h/mês | Recuperação: R$ ${diagnosticResult.inactiveRecovery}/mês | Total: R$ ${diagnosticResult.totalMonthlySavings}/mês`,
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
      const storedData: StoredDiagnostic = {
        result: pendingResult,
        audioBase64: audioBase64 || null,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
      
      setSavedAudio(audioBase64 || null);
      setCompletedAt(storedData.completedAt);
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
  };

  // Criar leadData compatível com SofiaAutoCall
  const getSofiaLeadData = () => {
    if (!pendingResult) return null;
    
    // Converter ServiceDiagnosticAnswers para DiagnosticAnswers (formato legacy)
    const legacyAnswers: DiagnosticAnswers = {
      q1: 'a',
      q2: 'a',
      q3: 'a',
      q4: 'a'
    };
    
    return {
      name: pendingResult.contact.name,
      company: pendingResult.contact.company,
      answers: legacyAnswers,
      score: pendingResult.score,
      level: pendingResult.level
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Store className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl text-foreground">Mostralo</span>
          </a>
          
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Alternar tema</span>
            </Button>
          )}
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
            />
            <div className="mt-8">
              <DiagnosticResultServices result={result} savedAudioBase64={savedAudio} />
            </div>
          </>
        ) : result ? (
          <DiagnosticResultServices 
            result={result} 
            savedAudioBase64={savedAudio}
          />
        ) : (
          <>
            {/* Hero */}
            <div className="text-center mb-10 md:mb-12 animate-fade-in">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                Diagnóstico de Agendamento
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Descubra quanto você está perdendo com no-shows, agenda manual e clientes que não voltam. Calcule sua economia com gestão profissional.
              </p>
            </div>

            {/* Formulário */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <DiagnosticFormServices onComplete={handleFormComplete} />
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
