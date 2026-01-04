import { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { DiagnosticAnswers, QualificationLevel } from '@/lib/diagnosticScoring';
import { generateSofiaScript } from '@/lib/callScriptGenerator';
import { CallStepCard, type CallStep, type StepStatus } from './CallStepCard';
import { ConfettiExplosion } from './ConfettiExplosion';

interface LeadData {
  name: string;
  company: string;
  answers: DiagnosticAnswers;
  score: number;
  level: QualificationLevel;
}

interface WhatsAppProfile {
  pictureUrl: string | null;
  pushName: string | null;
  formattedNumber: string | null;
}

interface SofiaAutoCallProps {
  isOpen: boolean;
  leadData: LeadData;
  whatsappProfile?: WhatsAppProfile;
  savedAudioBase64?: string | null;
  customScript?: string;
  onAudioComplete: (audioBase64: string) => void;
  onSkip?: () => void;
}

type CallState = 'connecting' | 'connected' | 'ended';

const STEP_DURATION = 3000; // 3 segundos por etapa
const CELEBRATION_DURATION = 1200; // 1.2s para confete

const CALL_STEPS_CONFIG: Omit<CallStep, 'status'>[] = [
  { id: 'validate', label: 'Validando número...', icon: 'phone' },
  { id: 'photo', label: 'Buscando foto do perfil...', icon: 'camera' },
  { id: 'name', label: 'Buscando nome do contato...', icon: 'user' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function SofiaAutoCall({
  isOpen,
  leadData,
  whatsappProfile,
  savedAudioBase64,
  customScript,
  onAudioComplete,
  onSkip
}: SofiaAutoCallProps) {
  // Formatar número para exibição
  const formatPhoneDisplay = (number: string | null | undefined): string => {
    if (!number) return '';
    
    const clean = number.replace(/\D/g, '');
    if (clean.length >= 12) {
      const country = clean.slice(0, 2);
      const ddd = clean.slice(2, 4);
      const part1 = clean.slice(4, 9);
      const part2 = clean.slice(9);
      return `+${country} ${ddd} ${part1}-${part2}`;
    }
    return `+${clean}`;
  };

  // Nome a exibir (pushName do WhatsApp ou nome digitado)
  const displayName = whatsappProfile?.pushName || leadData.name;
  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  
  // Estados para cards sequenciais
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<CallStep>({ ...CALL_STEPS_CONFIG[0], status: 'pending' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCardExiting, setIsCardExiting] = useState(false);
  const [allStepsComplete, setAllStepsComplete] = useState(false);
  
  // Estados para reveal progressivo
  const [showNumber, setShowNumber] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showName, setShowName] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const audioReadyRef = useRef<string | null>(null);

  // Iniciar chamada automaticamente quando abre
  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startCall();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Timer da chamada
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    console.log('Audio playback finished - waiting for user to click button');
    setAudioPlaying(false);
    setCallState('ended');
  }, []);

  // Função para processar uma etapa com animação
  const processStep = async (
    stepIndex: number, 
    successMessage: string,
    onSuccess?: () => void
  ) => {
    const stepConfig = CALL_STEPS_CONFIG[stepIndex];
    
    // Mostrar card com loading
    setCurrentStep({ ...stepConfig, status: 'loading' });
    setIsCardExiting(false);
    
    // Aguardar duração da etapa
    await delay(STEP_DURATION);
    
    // Mostrar sucesso
    setCurrentStep({ ...stepConfig, status: 'success', message: successMessage });
    
    // Disparar confete
    setShowConfetti(true);
    
    // Executar callback (revelar dados)
    if (onSuccess) onSuccess();
    
    // Aguardar animação de celebração
    await delay(CELEBRATION_DURATION);
    
    // Esconder confete e animar saída do card
    setShowConfetti(false);
    setIsCardExiting(true);
    
    // Aguardar animação de saída
    await delay(400);
  };

  const startCall = async () => {
    setCallState('connecting');
    
    // Iniciar geração do áudio IMEDIATAMENTE em background
    let audioGenerationPromise: Promise<string | null> | null = null;
    
    if (savedAudioBase64) {
      console.log('Using saved audio from localStorage');
      audioReadyRef.current = savedAudioBase64;
    } else {
      // Gerar áudio em paralelo com as etapas visuais
      audioGenerationPromise = (async () => {
        try {
          // Usar script customizado se fornecido, senão gerar o padrão
          const script = customScript || generateSofiaScript({
            leadName: leadData.name,
            companyName: leadData.company,
            answers: leadData.answers,
            score: leadData.score,
            level: leadData.level
          });
          console.log('Generated Sofia script:', script);
          
          const { data, error } = await supabase.functions.invoke('text-to-speech', {
            body: {
              text: script,
              voiceId: 'nova' // Voz feminina OpenAI
            }
          });

          if (error) throw error;
          return data?.audioContent || null;
        } catch (err) {
          console.error('Failed to generate audio:', err);
          return null;
        }
      })();
    }
    
    // Etapa 1: Validando número
    await processStep(0, 'Número válido!', () => setShowNumber(true));
    setCurrentStepIndex(1);
    
    // Etapa 2: Buscando foto
    const photoMessage = whatsappProfile?.pictureUrl ? 'Foto encontrada!' : 'Foto privada';
    await processStep(1, photoMessage, () => setShowPhoto(true));
    setCurrentStepIndex(2);
    
    // Etapa 3: Buscando nome
    const nameMessage = whatsappProfile?.pushName || 'Nome não disponível';
    await processStep(2, nameMessage, () => setShowName(true));
    
    // Todas as etapas visuais completas - mostrar estado "Conectando..."
    setAllStepsComplete(true);
    setIsCardExiting(true);
    
    // Aguardar áudio se ainda não estiver pronto
    if (audioGenerationPromise) {
      const audioResult = await audioGenerationPromise;
      if (audioResult) {
        audioReadyRef.current = audioResult;
        setGeneratedAudioBase64(audioResult);
      }
    }
    
    // Pequena pausa antes de conectar
    await delay(500);
    
    // Tocar áudio
    const audioToPlay = audioReadyRef.current || savedAudioBase64;
    if (audioToPlay) {
      await playAudio(audioToPlay);
    } else {
      // Fallback: simular chamada de 35 segundos
      setCallState('connected');
      setAudioPlaying(true);
      setTimeout(() => {
        handleAudioEnded();
      }, 35000);
    }
  };

  const playAudio = async (audioBase64: string) => {
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
    audioRef.current = new Audio(audioUrl);
    
    audioRef.current.onended = handleAudioEnded;
    
    audioRef.current.onerror = (e) => {
      console.error('Audio playback error:', e);
      setAudioPlaying(false);
      // Em caso de erro, chamar callback mesmo assim
      setTimeout(() => {
        onAudioComplete(audioBase64);
      }, 1000);
    };
    
    setCallState('connected');
    setAudioPlaying(true);
    
    try {
      await audioRef.current.play();
    } catch (playError) {
      console.error('Failed to play audio:', playError);
      // Tentar novamente com interação do usuário
    }
  };

  const handleEndCall = () => {
    // Encerrar chamada e ir para resultado
    cleanup();
    setCallState('ended');
    
    const audioToReturn = generatedAudioBase64 || savedAudioBase64;
    if (audioToReturn) {
      onAudioComplete(audioToReturn);
    } else {
      // Mesmo sem áudio, continuar para resultado
      onAudioComplete('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col",
        "bg-gradient-to-b from-[#1F2C34] to-[#0B141A]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-area-top">
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <div className="w-2 h-2 rounded-full bg-[#25D366]" />
          <span>Chamada de voz do WhatsApp</span>
        </div>
        <button 
          onClick={handleEndCall}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Conteúdo Principal - Centralizado */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Avatar com Foto do WhatsApp */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Avatar */}
            <div className={cn(
              "relative w-36 h-36 rounded-full overflow-hidden border-4 transition-all duration-500",
              callState === 'connected' ? "border-[#25D366]" : "border-white/20"
            )}>
              {showPhoto ? (
                // Foto revelada com animação
                <div className="animate-scale-in w-full h-full">
                  {whatsappProfile?.pictureUrl ? (
                    <img 
                      src={whatsappProfile.pictureUrl} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {/* Fallback (fica atrás da imagem) */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center -z-10">
                    <User className="w-16 h-16 text-white" />
                  </div>
                </div>
              ) : (
                // Placeholder enquanto carrega
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span className="text-5xl text-white/20 font-light">?</span>
                </div>
              )}
            </div>

            {/* Indicador de status */}
            {callState === 'connected' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#25D366] text-white text-sm font-medium animate-fade-in">
                Conectado
              </div>
            )}
          </div>
        </div>

        {/* Info do Lead */}
        <div className="text-center mb-10">
          {/* Nome - Oculto até ser revelado */}
          <h2 className="text-3xl font-bold text-white mb-1">
            {showName ? (
              <span className="animate-fade-in">{displayName}</span>
            ) : (
              <span className="text-white/20">• • • • •</span>
            )}
          </h2>
          
          {/* Número - Oculto até ser revelado */}
          <p className="text-white/50 text-lg mb-2">
            {showNumber ? (
              <span className="animate-fade-in">
                {whatsappProfile?.formattedNumber 
                  ? formatPhoneDisplay(whatsappProfile.formattedNumber)
                  : '+55 ** *****-****'}
              </span>
            ) : (
              <span className="text-white/20">+•• •• •••••-••••</span>
            )}
          </p>
          
          {callState === 'connecting' && !allStepsComplete && (
            <div className="mt-6 relative flex flex-col items-center">
              {/* Confete */}
              {showConfetti && <ConfettiExplosion />}
              
              {/* Card único da etapa atual */}
              <CallStepCard 
                step={currentStep}
                isExiting={isCardExiting}
              />
              
              {/* Indicador de progresso */}
              <p className="text-white/40 text-sm mt-4">
                Etapa {currentStepIndex + 1} de {CALL_STEPS_CONFIG.length}
              </p>
            </div>
          )}
          
          {/* Estado "Conectando..." após as 3 etapas */}
          {callState === 'connecting' && allStepsComplete && (
            <div className="mt-6 flex flex-col items-center gap-4 animate-fade-in">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-[#25D366]"
                    style={{
                      height: [16, 24, 32, 24, 16][i],
                      animation: 'pulse 1s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <span className="text-white/70 text-base">Conectando...</span>
            </div>
          )}
          
          {callState === 'connected' && (
            <p className="text-white/80 mt-4 text-2xl font-mono">
              {formatTime(callDuration)}
            </p>
          )}
          
          {callState === 'ended' && (
            <>
              <p className="text-white/60 mt-4 text-lg">
                Chamada encerrada • {formatTime(callDuration)}
              </p>
              
              {/* Botão para ver diagnóstico */}
              <button
                onClick={() => {
                  const audioToReturn = generatedAudioBase64 || savedAudioBase64;
                  onAudioComplete(audioToReturn || '');
                }}
                className="mt-8 px-8 py-4 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold text-lg rounded-full shadow-lg shadow-[#25D366]/30 transition-all hover:scale-105 animate-fade-in"
              >
                Ver Meu Diagnóstico
              </button>
            </>
          )}
        </div>

        {/* Waveform de Áudio */}
        {callState === 'connected' && audioPlaying && (
          <div className="flex items-center justify-center gap-1 h-10 mb-10">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#25D366] rounded-full animate-audio-bar"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  height: '4px'
                }}
              />
            ))}
          </div>
        )}

        {/* Mensagem durante a chamada */}
        {callState === 'connected' && audioPlaying && (
          <div className="text-center mb-8">
            <p className="text-white/70 text-base">
              Ouça a Sofia apresentar seu diagnóstico personalizado
            </p>
          </div>
        )}

        {/* Botão Encerrar */}
        {(callState === 'connecting' || callState === 'connected') && (
          <div className="flex justify-center">
            <button
              onClick={handleEndCall}
              className="flex flex-col items-center gap-3"
            >
              <div className="rounded-full bg-[#FF5252] flex items-center justify-center shadow-lg shadow-[#FF5252]/30 hover:scale-105 transition-transform" style={{ width: '72px', height: '72px' }}>
                <PhoneOff className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/70 text-base">Encerrar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
