import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, X, User, Calendar, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { playNewOrderSound, stopOrderAlertLoop } from '@/utils/soundPlayer';
import { supabase } from '@/integrations/supabase/client';
import type { DiagnosticAnswers, QualificationLevel } from '@/lib/diagnosticScoring';
import { generateSofiaScript } from '@/lib/callScriptGenerator';

// Mensagens rotativas durante conexão
const CONNECTING_MESSAGES = [
  { main: "Conectando...", sub: "Aguarde só um instante" },
  { main: "Validando informações...", sub: "Preparando tudo pra você" },
  { main: "Preparando consultoria...", sub: "Quase lá" },
  { main: "Conectando com a Sofia...", sub: "Só mais um momento" },
  { main: "Finalizando conexão...", sub: "Já já você será atendido" }
];

interface LeadData {
  name: string;
  company: string;
  answers: DiagnosticAnswers;
  score: number;
  level: QualificationLevel;
}

interface WhatsAppCallMockupProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerRole: string;
  callerAvatar?: string;
  onScheduleConsultation: () => void;
  leadData?: LeadData;
  savedAudioBase64?: string | null;
  onAudioGenerated?: (audioBase64: string) => void;
}

type CallState = 'idle' | 'incoming' | 'connecting' | 'connected' | 'ended';

// Padrão de vibração estilo WhatsApp real
const VIBRATION_PATTERN = [200, 100, 200, 100, 200, 500];

export function WhatsAppCallMockup({
  isOpen,
  onClose,
  callerName,
  callerRole,
  callerAvatar,
  onScheduleConsultation,
  leadData,
  savedAudioBase64,
  onAudioGenerated
}: WhatsAppCallMockupProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [connectingMessageIndex, setConnectingMessageIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Iniciar chamada quando modal abre
  useEffect(() => {
    if (isOpen) {
      setCallState('incoming');
      setCallDuration(0);
    } else {
      setCallState('idle');
      cleanup();
    }
  }, [isOpen]);

  // Vibração física do dispositivo
  useEffect(() => {
    if (callState === 'incoming') {
      // Tocar som de chamada
      playNewOrderSound('bell1');
      
      // Iniciar loop de vibração
      if ('vibrate' in navigator) {
        navigator.vibrate(VIBRATION_PATTERN);
        vibrationRef.current = setInterval(() => {
          navigator.vibrate(VIBRATION_PATTERN);
        }, 1500);
      }
    } else {
      // Parar vibração
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
        vibrationRef.current = null;
      }
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
      stopOrderAlertLoop();
    }

    return () => {
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
      }
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    };
  }, [callState]);

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

  // Rotação das mensagens de conexão
  useEffect(() => {
    if (callState === 'connecting') {
      const interval = setInterval(() => {
        setConnectingMessageIndex(prev => 
          (prev + 1) % CONNECTING_MESSAGES.length
        );
      }, 2500);
      
      return () => clearInterval(interval);
    } else {
      setConnectingMessageIndex(0);
    }
  }, [callState]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (vibrationRef.current) clearInterval(vibrationRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('vibrate' in navigator) navigator.vibrate(0);
    stopOrderAlertLoop();
  }, []);

  const handleAccept = async () => {
    setCallState('connecting');
    
    // Se já tem áudio salvo, usar ele diretamente
    if (savedAudioBase64) {
      console.log('Using saved audio from localStorage');
      setCallState('connected');
      setAudioPlaying(true);
      
      const savedAudioUrl = `data:audio/mpeg;base64,${savedAudioBase64}`;
      setAudioUrl(savedAudioUrl);
      audioRef.current = new Audio(savedAudioUrl);
      
      audioRef.current.onended = () => {
        console.log('Audio playback finished');
        setAudioPlaying(false);
        setCallState('ended');
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setAudioPlaying(false);
      };
      
      await audioRef.current.play();
      return;
    }
    
    if (leadData) {
      try {
        // Gerar script Sofia com técnica Flávio Augusto (Pedestal + Escassez)
        const script = generateSofiaScript({
          leadName: leadData.name,
          companyName: leadData.company,
          answers: leadData.answers,
          score: leadData.score,
          level: leadData.level
        });
        console.log('Generated Sofia script:', script);
        
        // Usar função text-to-speech com voz feminina OpenAI
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: script,
            voiceId: 'nova' // Voz feminina OpenAI
          }
        });

        if (error) {
          console.error('Error generating audio:', error);
          throw error;
        }

        if (data?.audioContent) {
          console.log('Audio received, playing...');
          
          // Notificar para salvar no localStorage
          if (onAudioGenerated) {
            onAudioGenerated(data.audioContent);
          }
          
          setCallState('connected');
          setAudioPlaying(true);
          
          const generatedAudioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
          setAudioUrl(generatedAudioUrl); // Salvar para replay
          audioRef.current = new Audio(generatedAudioUrl);
          
          audioRef.current.onended = () => {
            console.log('Audio playback finished');
            setAudioPlaying(false);
            setCallState('ended'); // Mostrar botões automaticamente ao terminar
          };
          
          audioRef.current.onerror = (e) => {
            console.error('Audio playback error:', e);
            setAudioPlaying(false);
          };
          
          await audioRef.current.play();
        } else {
          throw new Error('No audio content received');
        }
      } catch (err) {
        console.error('Failed to generate/play audio:', err);
        // Fallback: simular áudio
        setCallState('connected');
        setAudioPlaying(true);
        setTimeout(() => setAudioPlaying(false), 35000);
      }
    } else {
      setTimeout(() => {
        setCallState('connected');
        setAudioPlaying(true);
        setTimeout(() => setAudioPlaying(false), 35000);
      }, 1500);
    }
  };

  const handleDecline = () => {
    cleanup();
    onClose();
  };

  const handleEndCall = () => {
    setCallState('ended');
    cleanup();
  };

  const handleSchedule = () => {
    cleanup();
    onClose();
    onScheduleConsultation();
  };

  const handleReplay = () => {
    if (audioUrl && !isReplaying) {
      setIsReplaying(true);
      
      // Parar áudio anterior se houver
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const replayAudio = new Audio(audioUrl);
      audioRef.current = replayAudio;
      
      replayAudio.onended = () => {
        setIsReplaying(false);
      };
      
      replayAudio.onerror = () => {
        setIsReplaying(false);
      };
      
      replayAudio.play();
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
        {callState !== 'incoming' && (
          <button 
            onClick={handleDecline}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>

      {/* Conteúdo Principal - Centralizado */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Avatar com Anéis */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Anéis pulsantes */}
            {callState === 'incoming' && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ring-pulse" />
                <div className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-ring-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-0 rounded-full bg-[#25D366]/10 animate-ring-pulse" style={{ animationDelay: '1s' }} />
              </>
            )}
            
            {/* Avatar - Maior para fullscreen */}
            <div className={cn(
              "relative w-36 h-36 rounded-full overflow-hidden border-4",
              callState === 'connected' ? "border-[#25D366]" : "border-white/20"
            )}>
              {callerAvatar ? (
                <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {/* Indicador de status */}
            {callState === 'connected' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#25D366] text-white text-sm font-medium">
                Conectado
              </div>
            )}
          </div>
        </div>

        {/* Info do Chamador */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">{callerName}</h2>
          <p className="text-white/60 text-lg">{callerRole}</p>
          
          {callState === 'incoming' && (
            <p className="text-[#25D366] mt-4 animate-pulse font-medium text-lg">
              📞 Chamando...
            </p>
          )}
          
          {callState === 'connecting' && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
              <p className="text-[#25D366] font-medium text-lg transition-all duration-300">
                {CONNECTING_MESSAGES[connectingMessageIndex].main}
              </p>
              <p className="text-white/50 text-base transition-all duration-300">
                {CONNECTING_MESSAGES[connectingMessageIndex].sub}
              </p>
            </div>
          )}
          
          {callState === 'connected' && (
            <p className="text-white/80 mt-4 text-2xl font-mono">
              {formatTime(callDuration)}
            </p>
          )}
          
          {callState === 'ended' && (
            <p className="text-white/60 mt-4 text-lg">
              Chamada encerrada • {formatTime(callDuration)}
            </p>
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

        {/* Botões de Ação */}
        {callState === 'incoming' && (
          <div className="flex items-center justify-center gap-12">
            {/* Recusar */}
            <button
              onClick={handleDecline}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-18 h-18 rounded-full bg-[#FF5252] flex items-center justify-center shadow-lg shadow-[#FF5252]/30 hover:scale-105 transition-transform" style={{ width: '72px', height: '72px' }}>
                <PhoneOff className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/70 text-base">Recusar</span>
            </button>

            {/* Aceitar */}
            <button
              onClick={handleAccept}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-18 h-18 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-105 transition-transform animate-accept-pulse" style={{ width: '72px', height: '72px' }}>
                <Phone className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/70 text-base">Aceitar</span>
            </button>
          </div>
        )}

        {callState === 'connecting' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-1 h-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#25D366]/60 rounded-full animate-audio-bar"
                  style={{ 
                    animationDelay: `${i * 0.15}s`,
                    height: '6px'
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleDecline}
              className="flex flex-col items-center gap-2"
            >
              <div className="rounded-full bg-[#FF5252] flex items-center justify-center" 
                   style={{ width: '64px', height: '64px' }}>
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-white/70 text-sm">Encerrar</span>
            </button>
          </div>
        )}

        {callState === 'connected' && (
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

        {callState === 'ended' && (
          <div className="space-y-4 max-w-sm mx-auto w-full">
            <Button
              onClick={handleSchedule}
              className="w-full h-16 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg"
            >
              <Calendar className="w-6 h-6 mr-2" />
              AGENDAR CONSULTORIA
            </Button>
            
            {audioUrl && (
              <Button
                onClick={handleReplay}
                disabled={isReplaying}
                variant="outline"
                className="w-full h-14 border-white/20 text-white hover:bg-white/10 text-base bg-transparent"
              >
                <Volume2 className={cn("w-5 h-5 mr-2", isReplaying && "animate-pulse")} />
                {isReplaying ? 'Reproduzindo...' : 'Ouvir novamente'}
              </Button>
            )}
            
            <Button
              onClick={handleDecline}
              variant="ghost"
              className="w-full h-14 text-white/60 hover:text-white hover:bg-white/10 text-base"
            >
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
