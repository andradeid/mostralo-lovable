import { useState, useRef, useEffect } from 'react';
import { Store, CheckCircle, Play, Pause, Phone, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DiagnosticResult } from '@/lib/diagnosticScoring';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiagnosticAlreadyCompletedProps {
  result: DiagnosticResult;
  audioBase64: string | null;
  completedAt: string;
  onRestart: () => void;
}

const LEVEL_CONFIG = {
  elite: {
    title: 'Elite Global',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  potential: {
    title: 'Alto Potencial',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
  disqualified: {
    title: 'Em Desenvolvimento',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-muted'
  }
};

export function DiagnosticAlreadyCompleted({ 
  result, 
  audioBase64, 
  completedAt, 
  onRestart 
}: DiagnosticAlreadyCompletedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const levelConfig = LEVEL_CONFIG[result.level];

  useEffect(() => {
    if (audioBase64) {
      audioRef.current = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBase64]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Olá Marcos! Fiz o diagnóstico de maturidade tecnológica e fui classificado como ${levelConfig.title}. Gostaria de conversar sobre como escalar minha operação.`
    );
    window.open(`https://wa.me/5561994009368?text=${message}`, '_blank');
  };

  const formattedDate = format(new Date(completedAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Diagnóstico já realizado!
        </h1>
        <p className="text-muted-foreground">
          Você completou seu diagnóstico em {formattedDate}
        </p>
      </div>

      {/* Resultado */}
      <Card className={`mb-6 ${levelConfig.borderColor} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${levelConfig.bgColor} flex items-center justify-center`}>
              <Store className={`w-6 h-6 ${levelConfig.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Seu nível de maturidade</p>
              <h2 className={`text-xl font-bold ${levelConfig.color}`}>
                {levelConfig.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pontuação: {result.score} pontos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Áudio da Sofia */}
      {audioBase64 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Mensagem da Sofia</p>
                <p className="text-sm text-muted-foreground">
                  Ouça novamente a análise personalizada
                </p>
              </div>
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="icon"
                onClick={toggleAudio}
                className="shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTAs */}
      <div className="space-y-3">
        <Button
          onClick={handleWhatsAppClick}
          className="w-full h-14 text-lg gap-2"
          size="lg"
        >
          <Phone className="w-5 h-5" />
          Falar com Marcos Andrade
        </Button>

        <Button
          variant="ghost"
          onClick={onRestart}
          className="w-full text-muted-foreground hover:text-foreground gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Fazer diagnóstico novamente
        </Button>
      </div>
    </div>
  );
}
