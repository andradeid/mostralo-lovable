import { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOff, X, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { DiagnosticAnswers, QualificationLevel } from '@/lib/diagnosticScoring';
import { generateSofiaScript } from '@/lib/callScriptGenerator';

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
  onAudioComplete: (audioBase64: string) => void;
  onSkip?: () => void;
}

type CallState = 'connecting' | 'connected' | 'ended';

export function SofiaAutoCall({
  isOpen,
  leadData,
  whatsappProfile,
  savedAudioBase64,
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
  const firstName = displayName.split(' ')[0];
  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

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
    // Não dispara callback automaticamente - usuário precisa clicar no botão
  }, []);

  const startCall = async () => {
    setCallState('connecting');
    
    // Se já tem áudio salvo, usar ele diretamente
    if (savedAudioBase64) {
      console.log('Using saved audio from localStorage');
      await playAudio(savedAudioBase64);
      return;
    }
    
    // Gerar áudio via ElevenLabs
    try {
      const script = generateSofiaScript({
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
          voiceId: 'ORgG8rwdAiMYRug8RJwR' // Ana Alice - voz feminina brasileira
        }
      });

      if (error) {
        console.error('Error generating audio:', error);
        throw error;
      }

      if (data?.audioContent) {
        console.log('Audio received, playing...');
        setGeneratedAudioBase64(data.audioContent);
        await playAudio(data.audioContent);
      } else {
        throw new Error('No audio content received');
      }
    } catch (err) {
      console.error('Failed to generate/play audio:', err);
      // Fallback: simular áudio de 35 segundos
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
              "relative w-36 h-36 rounded-full overflow-hidden border-4",
              callState === 'connected' ? "border-[#25D366]" : "border-white/20"
            )}>
              {whatsappProfile?.pictureUrl ? (
                <img 
                  src={whatsappProfile.pictureUrl} 
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback se imagem falhar - esconde e mostra ícone
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              {/* Fallback sempre presente (fica atrás da imagem) */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center -z-10">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Indicador de status */}
            {callState === 'connected' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#25D366] text-white text-sm font-medium">
                Conectado
              </div>
            )}
          </div>
        </div>

        {/* Info do Lead */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-1">{displayName}</h2>
          {whatsappProfile?.formattedNumber && (
            <p className="text-white/50 text-lg mb-2">
              {formatPhoneDisplay(whatsappProfile.formattedNumber)}
            </p>
          )}
          
          {callState === 'connecting' && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
              <p className="text-[#25D366] font-medium text-lg">
                Conectando ao WhatsApp de {firstName}...
              </p>
              <p className="text-white/50 text-base">
                Preparando sua análise personalizada
              </p>
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
