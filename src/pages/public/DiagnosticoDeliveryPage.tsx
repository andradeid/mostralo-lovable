import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { DiagnosticFormDelivery } from '@/components/leads/DiagnosticFormDelivery';
import { DiagnosticResultDelivery } from '@/components/leads/DiagnosticResultDelivery';
import { DiagnosticAlreadyCompleted } from '@/components/leads/DiagnosticAlreadyCompleted';
import { SofiaAutoCall } from '@/components/leads/SofiaAutoCall';
import { supabase } from '@/integrations/supabase/client';
import type { DeliveryDiagnosticAnswers, ContactData, DeliveryDiagnosticResult } from '@/lib/diagnosticScoringDelivery';
import { getDeliveryDiagnosticResult, NICHE_CONFIG } from '@/lib/diagnosticScoringDelivery';
import { generateDeliverySofiaScript } from '@/lib/callScriptGeneratorDelivery';

const STORAGE_KEY = 'mostralo_delivery_diagnostic';

interface StoredDiagnostic {
  result: DeliveryDiagnosticResult;
  audioBase64?: string | null;
  completedAt: string;
}

export default function DiagnosticoDeliveryPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<DeliveryDiagnosticResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedAudioBase64, setSavedAudioBase64] = useState<string | null>(null);

  // Verificar localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredDiagnostic = JSON.parse(stored);
        const completedDate = new Date(parsed.completedAt);
        const now = new Date();
        const hoursSinceCompletion = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCompletion < 24) {
          setDiagnosticResult(parsed.result);
          setSavedAudioBase64(parsed.audioBase64 || null);
          setIsCompleted(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFormComplete = async (answers: DeliveryDiagnosticAnswers, contact: ContactData) => {
    const result = getDeliveryDiagnosticResult(answers, contact);
    setDiagnosticResult(result);

    // Salvar lead no Supabase
    try {
      const nicheConfig = NICHE_CONFIG[answers.nicho];
      await supabase.from('leads').insert({
        name: contact.name,
        phone: contact.phone,
        company: contact.company,
        source: 'diagnostico-delivery',
        landing_page: '/diagnostico-delivery',
        qualification_level: result.level,
        qualification_score: result.score,
        diagnostic_answers: answers as any,
        whatsapp_profile_picture: contact.whatsappProfilePicture,
        whatsapp_push_name: contact.whatsappPushName,
        whatsapp_formatted_number: contact.whatsappFormattedNumber,
        notes: `Nicho: ${nicheConfig.label} | Economia estimada: R$ ${result.monthlySavings}/mês | R$ ${result.annualSavings}/ano`
      });
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleSofiaCallComplete = (audioBase64?: string) => {
    if (diagnosticResult) {
      const stored: StoredDiagnostic = {
        result: diagnosticResult,
        audioBase64: audioBase64 || savedAudioBase64,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setSavedAudioBase64(audioBase64 || savedAudioBase64 || null);
    }
    setShowResult(true);
  };

  const handleAudioGenerated = (audioBase64: string) => {
    setSavedAudioBase64(audioBase64);
    if (diagnosticResult) {
      const stored: StoredDiagnostic = {
        result: diagnosticResult,
        audioBase64,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDiagnosticResult(null);
    setShowResult(false);
    setIsCompleted(false);
    setSavedAudioBase64(null);
  };

  // Se já completou nas últimas 24h
  if (isCompleted && diagnosticResult) {
    return (
      <>
        <Helmet>
          <title>Diagnóstico de Delivery | Mostralo</title>
          <meta name="description" content="Descubra quanto você pode economizar migrando do iFood para um app próprio." />
        </Helmet>
        <div className="min-h-screen bg-background">
          <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
            <DiagnosticAlreadyCompleted onRestart={handleRestart} />
            <div className="mt-8">
              <DiagnosticResultDelivery result={diagnosticResult} savedAudioBase64={savedAudioBase64} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Diagnóstico de Delivery - Quanto você perde pro iFood? | Mostralo</title>
        <meta name="description" content="Descubra quanto você está perdendo em comissões para iFood e Rappi. Calcule sua economia com app próprio." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
              Diagnóstico de Delivery
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Descubra quanto você está perdendo em comissões para apps de delivery e calcule sua economia com um app próprio
            </p>
          </div>

          {/* Conteúdo dinâmico */}
          {!diagnosticResult ? (
            <DiagnosticFormDelivery onComplete={handleFormComplete} />
          ) : !showResult ? (
            <SofiaAutoCall
              leadData={{
                name: diagnosticResult.contact.name,
                company: diagnosticResult.contact.company,
                phone: diagnosticResult.contact.phone,
                whatsappProfilePicture: diagnosticResult.contact.whatsappProfilePicture || null
              }}
              diagnosticAnswers={diagnosticResult.answers as any}
              qualificationLevel={diagnosticResult.level}
              score={diagnosticResult.score}
              customScript={generateDeliverySofiaScript({
                leadName: diagnosticResult.contact.name,
                companyName: diagnosticResult.contact.company,
                nicho: diagnosticResult.nicho,
                answers: diagnosticResult.answers,
                score: diagnosticResult.score,
                level: diagnosticResult.level,
                monthlySavings: diagnosticResult.monthlySavings,
                annualSavings: diagnosticResult.annualSavings,
                currentCommission: diagnosticResult.currentCommission
              })}
              onCallComplete={handleSofiaCallComplete}
              onAudioGenerated={handleAudioGenerated}
            />
          ) : (
            <DiagnosticResultDelivery result={diagnosticResult} savedAudioBase64={savedAudioBase64} />
          )}
        </div>
      </div>
    </>
  );
}
