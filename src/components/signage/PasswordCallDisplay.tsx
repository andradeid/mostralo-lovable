import { useEffect, useRef } from 'react';
import { PasswordCall } from '@/hooks/usePublicPasswordCalls';
import { PasswordCallConfig } from '@/hooks/usePasswordCallConfig';
import { playPasswordCallAudio, getCallText, playBeepSound } from '@/utils/passwordCallTTS';

interface PasswordCallDisplayProps {
  call: PasswordCall | null;
  config: PasswordCallConfig | null;
  show: boolean;
}

const callTypeLabels: Record<string, string> = {
  password: 'SENHA',
  order: 'PEDIDO',
  table: 'MESA'
};

export function PasswordCallDisplay({ call, config, show }: PasswordCallDisplayProps) {
  const hasPlayedSound = useRef(false);

  // Tocar som/voz quando aparecer
  useEffect(() => {
    if (show && config?.sound_enabled && call && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      
      const audioType = config.audio_type || 'beep';
      const voiceTemplate = config.voice_text_template || 'simple';
      
      if (audioType === 'beep') {
        playBeepSound();
      } else {
        const text = getCallText(voiceTemplate, call.call_type, call.call_number);
        
        playPasswordCallAudio(
          audioType,
          text,
          config.elevenlabs_voice_id
        ).catch((error) => {
          console.error('Erro ao reproduzir áudio:', error);
          // Fallback para beep em caso de erro
          playBeepSound();
        });
      }
    }
    if (!show) {
      hasPlayedSound.current = false;
    }
  }, [show, config?.sound_enabled, config?.audio_type, config?.voice_text_template, config?.elevenlabs_voice_id, call]);

  if (!show || !call || !config) return null;

  const template = config.template || 'classic';
  const color = config.primary_color || '#f97316';

  // Templates
  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            style={{ 
              background: `linear-gradient(135deg, ${color}ee, ${color}99)`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="text-center text-white">
              <p className="text-2xl font-medium mb-4 uppercase tracking-widest opacity-80">
                {callTypeLabels[call.call_type]}
              </p>
              <div 
                className="text-[12rem] font-black leading-none animate-pulse"
                style={{ textShadow: '0 0 60px rgba(255,255,255,0.5)' }}
              >
                {call.call_number}
              </div>
            </div>
          </div>
        );

      case 'minimalist':
        return (
          <div className="fixed bottom-8 right-8 z-50 animate-slide-in-right">
            <div 
              className="bg-background/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-l-4"
              style={{ borderColor: color }}
            >
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {callTypeLabels[call.call_type]}
              </p>
              <p 
                className="text-6xl font-bold"
                style={{ color }}
              >
                {call.call_number}
              </p>
            </div>
          </div>
        );

      case 'festive':
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in bg-black/80">
            {/* Confetti effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-6 uppercase tracking-widest"
                style={{ color }}
              >
                {callTypeLabels[call.call_type]}
              </div>
              <div 
                className="text-[14rem] font-black text-white leading-none animate-bounce-slow"
                style={{ textShadow: `0 0 80px ${color}` }}
              >
                {call.call_number}
              </div>
            </div>
          </div>
        );

      case 'corporate':
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in bg-slate-900">
            <div className="text-center">
              <div 
                className="inline-block px-8 py-3 rounded-full mb-8 text-white text-xl font-semibold uppercase tracking-wider"
                style={{ backgroundColor: color }}
              >
                {callTypeLabels[call.call_type]}
              </div>
              <div className="text-white text-[10rem] font-light tracking-widest">
                {call.call_number}
              </div>
              <div 
                className="w-32 h-1 mx-auto mt-8 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        );

      case 'classic':
      default:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in bg-black/90">
            <div className="text-center">
              <div 
                className="border-4 rounded-xl px-16 py-12"
                style={{ borderColor: color }}
              >
                <p 
                  className="text-3xl font-bold mb-4 uppercase tracking-widest"
                  style={{ color }}
                >
                  {callTypeLabels[call.call_type]}
                </p>
                <p className="text-white text-[12rem] font-bold leading-none">
                  {call.call_number}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderTemplate();
}
