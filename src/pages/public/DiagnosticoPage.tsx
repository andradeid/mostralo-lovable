import { useState } from 'react';
import { Store } from 'lucide-react';
import { DiagnosticForm } from '@/components/leads/DiagnosticForm';
import { DiagnosticResult } from '@/components/leads/DiagnosticResult';
import { getDiagnosticResult } from '@/lib/diagnosticScoring';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { DiagnosticAnswers, ContactData, DiagnosticResult as DiagnosticResultType } from '@/lib/diagnosticScoring';

export default function DiagnosticoPage() {
  const [result, setResult] = useState<DiagnosticResultType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      setResult(diagnosticResult);
    } catch (err) {
      console.error('Erro no diagnóstico:', err);
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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

      <main className="container mx-auto px-4 py-8 md:py-12">
        {!result ? (
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
        ) : (
          <DiagnosticResult result={result} />
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
