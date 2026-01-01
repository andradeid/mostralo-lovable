import { useState, useRef } from 'react';
import { CheckCircle2, Zap, Bot, TrendingUp, Star, Award, Clock, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DiagnosticResult as DiagnosticResultType, QualificationLevel } from '@/lib/diagnosticScoring';
import { generateWhatsAppMessage, MARCOS_WHATSAPP } from '@/lib/diagnosticScoring';

interface DiagnosticResultProps {
  result: DiagnosticResultType;
  savedAudioBase64?: string | null;
  onAudioGenerated?: (audioBase64: string) => void;
}

const LEVEL_CONFIG: Record<QualificationLevel, {
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
}> = {
  elite: {
    title: 'Operação com Alto Potencial de Escala',
    subtitle: 'Você foi qualificado para o Programa de Aceleração Elite!',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  potential: {
    title: 'Operação com Potencial de Crescimento',
    subtitle: 'Você foi qualificado para o Programa de Aceleração!',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  disqualified: {
    title: 'Operação Estruturada',
    subtitle: 'Parabéns pela sua operação madura!',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
};

const OPPORTUNITY_CARDS = [
  {
    icon: Zap,
    title: 'Tração Digital',
    description: 'Detectamos que sua loja pode aumentar a visibilidade em até 40% através da integração com o Google Shopping Local.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  {
    icon: Bot,
    title: 'Conversão 24h',
    description: 'Existe um gargalo no seu WhatsApp que pode ser resolvido com um Agente de IA, recuperando vendas que hoje você perde por demora.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    icon: TrendingUp,
    title: 'Eficiência Física',
    description: 'Sua operação está pronta para implementar o Upsell Automático, o que pode elevar seu ticket médio em 25% imediatamente.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  }
];

const BENEFITS = [
  'Isenção Total da Taxa de Setup (Implantação)',
  'Mentoria de Processos com Marcos Andrade (Especialista Internacional)',
  'Prioridade na Fila de integração do Agente de IA'
];

export function DiagnosticResult({ result, savedAudioBase64 }: DiagnosticResultProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const config = LEVEL_CONFIG[result.level];
  
  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage(result);
    window.open(`https://wa.me/${MARCOS_WHATSAPP}?text=${message}`, '_blank');
  };

  const handleReplayAudio = () => {
    if (savedAudioBase64 && !isPlayingAudio) {
      setIsPlayingAudio(true);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audioUrl = `data:audio/mpeg;base64,${savedAudioBase64}`;
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
      };
      
      audioRef.current.onerror = () => {
        setIsPlayingAudio(false);
      };
      
      audioRef.current.play();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Header com animação de check */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4 animate-scale-in">
          <div className="animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Diagnóstico Concluído com Sucesso!
        </h1>
        
        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full mt-2", config.bgColor)}>
          <Award className={cn("w-5 h-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>
            Perfil Identificado: {config.title}
          </span>
        </div>
      </div>

      {/* Cards de Oportunidade */}
      {result.level !== 'disqualified' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground text-center">
            Resumo da Oportunidade
          </h2>
          
          <div className="grid gap-4">
            {OPPORTUNITY_CARDS.map((card, index) => (
              <div
                key={card.title}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="p-4 md:p-5 border-border">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2.5 rounded-lg flex-shrink-0", card.bgColor)}>
                      <card.icon className={cn("w-5 h-5", card.color)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card de Benefício Exclusivo */}
      {result.level !== 'disqualified' && (
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Card className="p-6 md:p-8 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 relative overflow-hidden">
            {/* Decoração */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <h3 className="text-lg md:text-xl font-bold text-foreground">
                  Benefício Liberado: Programa de Aceleração Mostralo
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Pela sua pontuação, você foi qualificado para receber:
              </p>
              
              <ul className="space-y-3">
                {BENEFITS.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* Botão Ouvir Áudio Novamente */}
      {savedAudioBase64 && (
        <div className="text-center animate-fade-in" style={{ animationDelay: '450ms' }}>
          <Button
            onClick={handleReplayAudio}
            disabled={isPlayingAudio}
            variant="outline"
            size="lg"
            className="h-12 px-6"
          >
            <Volume2 className={cn("w-5 h-5 mr-2", isPlayingAudio && "animate-pulse")} />
            {isPlayingAudio ? 'Reproduzindo áudio da Sofia...' : 'Ouvir áudio da Sofia novamente'}
          </Button>
        </div>
      )}

      {/* CTA Principal */}
      <div className="text-center animate-fade-in" style={{ animationDelay: '500ms' }}>
        <Button
          onClick={handleWhatsAppClick}
          size="lg"
          className={cn(
            "w-full md:w-auto h-14 md:h-16 px-8 text-base md:text-lg font-bold",
            "bg-[#25D366] hover:bg-[#128C7E] text-white",
            "shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40",
            "transition-all duration-300"
          )}
        >
          {result.level === 'disqualified' 
            ? 'FALAR COM MARCOS ANDRADE'
            : 'AGENDAR CONSULTORIA COM MARCOS'
          }
        </Button>
        
        {result.level !== 'disqualified' && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <Clock className="w-4 h-4" />
            Vagas limitadas para esta semana
          </p>
        )}
      </div>

      {/* Rodapé de Autoridade */}
      <div className="text-center pt-8 border-t border-border animate-fade-in" style={{ animationDelay: '700ms' }}>
        <p className="font-semibold text-foreground">Marcos Andrade</p>
        <p className="text-sm text-muted-foreground">
          30 anos de experiência em tecnologia e processos
        </p>
        <p className="text-sm text-muted-foreground">
          Mercados atendidos: Suíça, EUA e Brasil
        </p>
        <p className="text-sm text-primary mt-1">Mostralo.com.br</p>
      </div>
    </div>
  );
}
