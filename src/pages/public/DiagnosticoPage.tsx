import { useState, useEffect } from 'react';
import { Store } from 'lucide-react';
import { DiagnosticForm } from '@/components/leads/DiagnosticForm';
import { DiagnosticResult } from '@/components/leads/DiagnosticResult';
import { DiagnosticAlreadyCompleted } from '@/components/leads/DiagnosticAlreadyCompleted';
import { DiagnosticProcessingScreen } from '@/components/leads/DiagnosticProcessingScreen';
import { SofiaAutoCall } from '@/components/leads/SofiaAutoCall';
import { getDiagnosticResult } from '@/lib/diagnosticScoring';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { DiagnosticAnswers, ContactData, DiagnosticResult as DiagnosticResultType } from '@/lib/diagnosticScoring';

const STORAGE_KEY = 'mostralo_diagnostic_data';

interface StoredDiagnostic {
  result: DiagnosticResultType;
  audioBase64: string | null;
  completedAt: string;
}

export default function DiagnosticoPage() {
  const [result, setResult] = useState<DiagnosticResultType | null>(null);
  const [pendingResult, setPendingResult] = useState<DiagnosticResultType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [savedAudio, setSavedAudio] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string>('');
  
  // Novos estados para o fluxo invertido
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSofiaCall, setShowSofiaCall] = useState(false);

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

  const handleFormComplete = async (answers: DiagnosticAnswers, contact: ContactData) => {
    setIsSubmitting(true);
    
    try {
      const diagnosticResult = getDiagnosticResult(answers, contact);
      
      // Extrair DDD e número do telefone
      const phoneNumbers = contact.phone.replace(/\D/g, '');
      
      // Salvar lead no banco
      const { error } = await supabase
        .from('leads')
        .insert([{
          email: `lead_${Date.now()}@diagnostico.mostralo.me`,
          city: 'Não informado',
          company_name: contact.company,
          name: contact.name,
          phone: phoneNumbers,
          company_phone: phoneNumbers,
          source: 'diagnostico',
          landing_page: '/diagnostico',
          qualification_level: diagnosticResult.level,
          qualification_score: diagnosticResult.score,
          diagnostic_answers: answers as unknown as Json,
          status: 'new'
        }]);
      
      if (error) {
        console.error('Erro ao salvar lead:', error);
        toast.error('Erro ao salvar seus dados. Tente novamente.');
        setIsSubmitting(false);
        return;
      }
      
      // Guardar resultado pendente e iniciar fluxo de processamento
      setPendingResult(diagnosticResult);
      setShowProcessing(true);
      
    } catch (err) {
      console.error('Erro no diagnóstico:', err);
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessingComplete = () => {
    setShowProcessing(false);
    setShowSofiaCall(true);
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

  const handleAudioGenerated = (audioBase64: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredDiagnostic = JSON.parse(stored);
        data.audioBase64 = audioBase64;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSavedAudio(audioBase64);
      }
    } catch (err) {
      console.error('Error saving audio to localStorage:', err);
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setResult(null);
    setPendingResult(null);
    setSavedAudio(null);
    setAlreadyCompleted(false);
    setCompletedAt('');
    setShowProcessing(false);
    setShowSofiaCall(false);
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
          
          <a
            href="https://wa.me/5561994009368"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Falar com Consultor
          </a>
        </div>
      </header>

      {/* SofiaAutoCall - Ligação automática */}
      {showSofiaCall && pendingResult && (
        <SofiaAutoCall
          isOpen={showSofiaCall}
          leadData={{
            name: pendingResult.contact.name,
            company: pendingResult.contact.company,
            answers: pendingResult.answers,
            score: pendingResult.score,
            level: pendingResult.level
          }}
          savedAudioBase64={savedAudio}
          onAudioComplete={handleSofiaCallComplete}
        />
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        {alreadyCompleted && result ? (
          <DiagnosticAlreadyCompleted
            result={result}
            audioBase64={savedAudio}
            completedAt={completedAt}
            onRestart={handleRestart}
          />
        ) : showProcessing ? (
          <DiagnosticProcessingScreen onComplete={handleProcessingComplete} />
        ) : result ? (
          <DiagnosticResult 
            result={result} 
            savedAudioBase64={savedAudio}
            onAudioGenerated={handleAudioGenerated}
          />
        ) : (
          <>
            {/* Hero */}
            <div className="text-center mb-10 md:mb-12 animate-fade-in">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                Diagnóstico de Maturidade Tecnológica
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Analise em 60 segundos se sua operação está preparada para a escala internacional.
              </p>
            </div>

            {/* Formulário */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <DiagnosticForm onComplete={handleFormComplete} />
            </div>
          </>
        )}
      </main>

      {/* Footer simples */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
