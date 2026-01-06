import { useState, useRef } from 'react';
import { CheckCircle2, TrendingDown, Wallet, Star, Award, Clock, Volume2, Calculator, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DeliveryDiagnosticResult, QualificationLevel } from '@/lib/diagnosticScoringDelivery';
import { generateDeliveryWhatsAppMessage, NICHE_CONFIG } from '@/lib/diagnosticScoringDelivery';
import { DiagnosticOfferCard } from './DiagnosticOfferCard';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';

interface DiagnosticResultDeliveryProps {
  result: DeliveryDiagnosticResult;
  savedAudioBase64?: string | null;
}

const LEVEL_CONFIG: Record<QualificationLevel, {
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
}> = {
  elite: {
    title: 'Perfil Elite para Migração',
    subtitle: 'Você foi qualificado para o Programa de Migração Elite!',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  potential: {
    title: 'Alto Potencial de Economia',
    subtitle: 'Você foi qualificado para o Programa de Migração!',
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
  'Isenção Total da Taxa de Implementação do App',
  'Mentoria de Migração com Marcos Andrade',
  'Comissão de apenas 5% vs 20-27% dos apps'
];

export function DiagnosticResultDelivery({ result, savedAudioBase64 }: DiagnosticResultDeliveryProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const config = LEVEL_CONFIG[result.level];
  const nicheConfig = NICHE_CONFIG[result.nicho];
  const { effectivePhone } = useMasterWhatsApp();
  
  const formattedMonthlySavings = result.monthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedAnnualSavings = result.annualSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const currentCommissionPercent = Math.round(result.currentCommission * 100);
  const mostraloCommissionPercent = Math.round(result.mostraloCommission * 100);
  
  const handleWhatsAppClick = () => {
    const message = generateDeliveryWhatsAppMessage(result);
    window.open(`https://wa.me/${effectivePhone}?text=${message}`, '_blank');
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
          Diagnóstico de Delivery Concluído!
        </h1>
        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full mt-2", config.bgColor)}>
          <Award className={cn("w-5 h-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.title}</span>
        </div>
      </div>

      {/* Card de Áudio no TOPO com destaque */}
      {savedAudioBase64 && (
        <Card className="p-4 border-[#25D366]/30 bg-[#25D366]/5 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[#25D366]/20">
                <Volume2 className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <p className="font-medium text-foreground">Áudio Personalizado</p>
                <p className="text-sm text-muted-foreground">Sofia explicou seu diagnóstico</p>
              </div>
            </div>
            <Button
              onClick={handleReplayAudio}
              disabled={isPlayingAudio}
              className={cn(
                "h-11 px-5",
                "bg-[#25D366] hover:bg-[#1ebe5a] text-white",
                "shadow-lg shadow-[#25D366]/30"
              )}
            >
              <Volume2 className={cn("w-4 h-4 mr-2", isPlayingAudio && "animate-pulse")} />
              {isPlayingAudio ? 'Tocando...' : 'Ouvir'}
            </Button>
          </div>
        </Card>
      )}

      {/* Calculadora de Economia Visual */}
      {result.level !== 'disqualified' && (
        <Card className="p-6 md:p-8 border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-6 h-6 text-green-500" />
            <h3 className="text-lg md:text-xl font-bold text-foreground">
              Sua Economia Estimada
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Comparativo de comissões */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="text-muted-foreground">Apps de Delivery</span>
                </div>
                <span className="text-xl font-bold text-red-500">{currentCommissionPercent}%</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-green-500" />
                  <span className="text-muted-foreground">App Próprio</span>
                </div>
                <span className="text-xl font-bold text-green-500">{mostraloCommissionPercent}%</span>
              </div>
            </div>
            
            {/* Economia */}
            <div className="flex flex-col justify-center items-center p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <p className="text-sm text-muted-foreground mb-1">Economia mensal</p>
              <p className="text-3xl md:text-4xl font-bold text-green-500">{formattedMonthlySavings}</p>
              <p className="text-sm text-muted-foreground mt-4 mb-1">Economia anual</p>
              <p className="text-2xl font-bold text-foreground">{formattedAnnualSavings}</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            *Estimativa baseada em {result.estimatedMonthlyOrders} pedidos/mês × R$ {result.estimatedAverageTicket} (ticket médio {nicheConfig.label.toLowerCase()})
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
          <DiagnosticOfferCard level={result.level} diagnosticType="delivery" />
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
          Falar com consultor
        </Button>
        {result.level !== 'disqualified' && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
            <Clock className="w-4 h-4" />
            Vagas limitadas para migração esta semana
          </p>
        )}
      </div>

      {/* Rodapé */}
      <div className="text-center pt-8 border-t border-border">
        <p className="font-semibold text-foreground">Marcos Andrade</p>
        <p className="text-sm text-muted-foreground">Especialista em Migração de Apps de Delivery</p>
        <p className="text-sm text-primary mt-1">Mostralo.com.br</p>
      </div>
    </div>
  );
}
