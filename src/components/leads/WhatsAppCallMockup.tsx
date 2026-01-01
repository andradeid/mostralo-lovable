import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, X, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { playNewOrderSound, stopOrderAlertLoop } from '@/utils/soundPlayer';

interface WhatsAppCallMockupProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerRole: string;
  callerAvatar?: string;
  audioMessage?: string;
  onScheduleConsultation: () => void;
}

type CallState = 'idle' | 'incoming' | 'connected' | 'ended';

// Padrão de vibração estilo WhatsApp real
const VIBRATION_PATTERN = [200, 100, 200, 100, 200, 500];

export function WhatsAppCallMockup({
  isOpen,
  onClose,
  callerName,
  callerRole,
  callerAvatar,
  onScheduleConsultation
}: WhatsAppCallMockupProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
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

  const handleAccept = () => {
    setCallState('connected');
    setAudioPlaying(true);
    
    // Simular duração do áudio (35 segundos)
    setTimeout(() => {
      setAudioPlaying(false);
    }, 35000);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90"
        onClick={callState === 'ended' ? handleDecline : undefined}
      />

      {/* Container da Chamada */}
      <div 
        className={cn(
          "relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden",
          "bg-gradient-to-b from-[#1F2C34] to-[#0B141A]",
          callState === 'incoming' && "animate-phone-vibrate"
        )}
      >
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
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

        {/* Conteúdo Principal */}
        <div className="pt-20 pb-8 px-6">
          {/* Avatar com Anéis */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Anéis pulsantes */}
              {callState === 'incoming' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ring-pulse" />
                  <div className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-ring-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute inset-0 rounded-full bg-[#25D366]/10 animate-ring-pulse" style={{ animationDelay: '1s' }} />
                </>
              )}
              
              {/* Avatar */}
              <div className={cn(
                "relative w-28 h-28 rounded-full overflow-hidden border-4",
                callState === 'connected' ? "border-[#25D366]" : "border-white/20"
              )}>
                {callerAvatar ? (
                  <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                    <User className="w-14 h-14 text-white" />
                  </div>
                )}
              </div>

              {/* Indicador de status */}
              {callState === 'connected' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#25D366] text-white text-xs font-medium">
                  Conectado
                </div>
              )}
            </div>
          </div>

          {/* Info do Chamador */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
            <p className="text-white/60">{callerRole}</p>
            
            {callState === 'incoming' && (
              <p className="text-[#25D366] mt-3 animate-pulse font-medium">
                📞 Chamando...
              </p>
            )}
            
            {callState === 'connected' && (
              <p className="text-white/80 mt-3 text-xl font-mono">
                {formatTime(callDuration)}
              </p>
            )}
            
            {callState === 'ended' && (
              <p className="text-white/60 mt-3">
                Chamada encerrada • {formatTime(callDuration)}
              </p>
            )}
          </div>

          {/* Waveform de Áudio */}
          {callState === 'connected' && audioPlaying && (
            <div className="flex items-center justify-center gap-1 h-8 mb-8">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#25D366] rounded-full animate-audio-bar"
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
            <div className="flex items-center justify-center gap-8">
              {/* Recusar */}
              <button
                onClick={handleDecline}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-[#FF5252] flex items-center justify-center shadow-lg shadow-[#FF5252]/30 hover:scale-105 transition-transform">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-white/70 text-sm">Recusar</span>
              </button>

              {/* Aceitar */}
              <button
                onClick={handleAccept}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-105 transition-transform animate-accept-pulse">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <span className="text-white/70 text-sm">Aceitar</span>
              </button>
            </div>
          )}

          {callState === 'connected' && (
            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-[#FF5252] flex items-center justify-center shadow-lg shadow-[#FF5252]/30 hover:scale-105 transition-transform">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-white/70 text-sm">Encerrar</span>
              </button>
            </div>
          )}

          {callState === 'ended' && (
            <div className="space-y-4">
              <Button
                onClick={handleSchedule}
                className="w-full h-14 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-base"
              >
                <Calendar className="w-5 h-5 mr-2" />
                AGENDAR CONSULTORIA
              </Button>
              
              <Button
                onClick={handleDecline}
                variant="ghost"
                className="w-full text-white/60 hover:text-white hover:bg-white/10"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
