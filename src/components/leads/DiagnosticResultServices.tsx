import { useState, useRef } from 'react';
import { CheckCircle2, UserX, Clock, Users, Star, Award, Volume2, Calculator, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ServiceDiagnosticResult, QualificationLevel } from '@/lib/diagnosticScoringServices';
import { generateServiceWhatsAppMessage, MARCOS_WHATSAPP, SERVICE_NICHE_CONFIG } from '@/lib/diagnosticScoringServices';
import { DiagnosticOfferCard } from './DiagnosticOfferCard';

interface DiagnosticResultServicesProps {
  result: ServiceDiagnosticResult;
  savedAudioBase64?: string | null;
}

const LEVEL_CONFIG: Record<QualificationLevel, {
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
}> = {
  elite: {
    title: 'Perfil Elite para Gestão Profissional',
    subtitle: 'Você foi qualificado para o Programa de Gestão Elite!',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  potential: {
    title: 'Alto Potencial de Otimização',
    subtitle: 'Você foi qualificado para o Programa de Gestão!',
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

const BENEFITS = [
  'Lembretes automáticos no WhatsApp dos clientes',
  'Sistema de agendamento online 24h',
  'Recuperação automática de clientes inativos'
];

export function DiagnosticResultServices({ result, savedAudioBase64 }: DiagnosticResultServicesProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const config = LEVEL_CONFIG[result.level];
  const nicheConfig = SERVICE_NICHE_CONFIG[result.nicho];
  
  const formattedNoShowSavings = result.noShowSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedInactiveRecovery = result.inactiveRecovery.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedTotalSavings = result.totalMonthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const noShowPercent = Math.round(nicheConfig.noShowRate * 100);
  
  const handleWhatsAppClick = () => {
    const message = generateServiceWhatsAppMessage(result);
    window.open(`https://wa.me/${MARCOS_WHATSAPP}?text=${message}`, '_blank');
  };

  const handleReplayAudio = () => {
    if (savedAudioBase64 && !isPlayingAudio) {
      setIsPlayingAudio(true);
      if (audioRef.current) audioRef.current.pause();
      const audioUrl = `data:audio/mpeg;base64,${savedAudioBase64}`;
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.onerror = () => setIsPlayingAudio(false);
      audioRef.current.play();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4 animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Diagnóstico de Agendamento Concluído!
        </h1>
        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full mt-2", config.bgColor)}>
          <Award className={cn("w-5 h-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.title}</span>
        </div>
      </div>

      {/* Calculadora de Economia Visual */}
      {result.level !== 'disqualified' && (
        <Card className="p-6 md:p-8 border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-6 h-6 text-green-500" />
            <h3 className="text-lg md:text-xl font-bold text-foreground">
              Sua Economia Estimada
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Economia No-Shows */}
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-5 h-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Redução de No-Shows</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{formattedNoShowSavings}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa atual: {noShowPercent}% → Com lembretes: 3%
              </p>
            </div>
            
            {/* Tempo Economizado */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Tempo Economizado</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{result.timeSavedHours}h/mês</p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {Math.round(result.timeSavedHours / result.estimatedAverageTicket * 100)} atendimentos extras
              </p>
            </div>
            
            {/* Recuperação de Clientes */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Clientes Recuperados</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">{formattedInactiveRecovery}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens automáticas de reengajamento
              </p>
            </div>
          </div>
          
          {/* Total */}
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
            <p className="text-sm text-muted-foreground mb-1">Economia Total Mensal</p>
            <p className="text-4xl md:text-5xl font-bold text-green-500">{formattedTotalSavings}</p>
            <p className="text-sm text-muted-foreground mt-2">
              + {result.timeSavedHours}h de tempo livre para atender mais clientes
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            *Estimativa baseada em {result.estimatedWeeklyAppointments} atendimentos/semana × R$ {result.estimatedAverageTicket} (ticket médio {nicheConfig.label.toLowerCase()})
          </p>
        </Card>
      )}

      {/* Benefícios */}
      {result.level !== 'disqualified' && (
        <Card className="p-6 md:p-8 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h3 className="text-lg md:text-xl font-bold text-foreground">
              Benefícios Liberados
            </h3>
          </div>
          <ul className="space-y-3">
            {BENEFITS.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Card de Oferta Exclusiva com Cupom */}
      {result.level !== 'disqualified' && (
        <div className="animate-fade-in">
          <DiagnosticOfferCard level={result.level} diagnosticType="general" />
        </div>
      )}

      {/* Botão Ouvir Áudio */}
      {savedAudioBase64 && (
        <div className="text-center">
          <Button onClick={handleReplayAudio} disabled={isPlayingAudio} variant="outline" size="lg">
            <Volume2 className={cn("w-5 h-5 mr-2", isPlayingAudio && "animate-pulse")} />
            {isPlayingAudio ? 'Reproduzindo...' : 'Ouvir áudio da Sofia'}
          </Button>
        </div>
      )}

      {/* CTA Secundário - WhatsApp */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Prefere falar com um especialista?
        </p>
        <Button
          onClick={handleWhatsAppClick}
          variant="outline"
          size="lg"
          className={cn(
            "h-12 md:h-14 px-6 text-base font-semibold",
            "border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white",
            "transition-all duration-300"
          )}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          {result.level === 'disqualified' ? 'FALAR COM MARCOS ANDRADE' : 'Falar com Marcos no WhatsApp'}
        </Button>
        {result.level !== 'disqualified' && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
            <Clock className="w-4 h-4" />
            Vagas limitadas para gestão profissional esta semana
          </p>
        )}
      </div>

      {/* Rodapé */}
      <div className="text-center pt-8 border-t border-border">
        <p className="font-semibold text-foreground">Marcos Andrade</p>
        <p className="text-sm text-muted-foreground">Especialista em Gestão de Agendamentos</p>
        <p className="text-sm text-primary mt-1">Mostralo.com.br</p>
      </div>
    </div>
  );
}
