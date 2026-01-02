import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { QualificationLevel } from '@/lib/diagnosticScoring';
import { trackPopupEvent } from '@/hooks/usePopupAnalytics';

interface DiagnosticOfferCardProps {
  level: QualificationLevel;
  diagnosticType?: 'general' | 'delivery';
}

const OFFER_CONFIG: Record<Exclude<QualificationLevel, 'disqualified'>, {
  couponCode: string;
  discountPercent: number;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
}> = {
  elite: {
    couponCode: 'DIAG20',
    discountPercent: 20,
    title: 'Oferta Exclusiva Elite',
    subtitle: 'Você desbloqueou o maior desconto disponível!',
    badgeText: 'VIP',
    badgeColor: 'bg-amber-500',
  },
  potential: {
    couponCode: 'DIAG15',
    discountPercent: 15,
    title: 'Oferta Especial',
    subtitle: 'Desconto exclusivo para você!',
    badgeText: 'EXCLUSIVO',
    badgeColor: 'bg-primary',
  },
};

const COUNTDOWN_HOURS = 48;
const STORAGE_KEY = 'diagnostic_offer_timestamp';

export function DiagnosticOfferCard({ level, diagnosticType = 'general' }: DiagnosticOfferCardProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Não mostra para desqualificados
  if (level === 'disqualified') return null;

  const config = OFFER_CONFIG[level];

  useEffect(() => {
    // Salva timestamp quando usuário vê a oferta pela primeira vez
    let startTime = localStorage.getItem(STORAGE_KEY);
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(STORAGE_KEY, startTime);
    }

    const calculateTimeLeft = () => {
      const start = parseInt(startTime!, 10);
      const expiresAt = start + (COUNTDOWN_HOURS * 60 * 60 * 1000);
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartNow = () => {
    // Track analytics
    trackPopupEvent('diagnostic_cta', 'clicked_cta');
    
    // Navegar para signup com cupom e dados do diagnóstico
    const params = new URLSearchParams({
      coupon: config.couponCode,
      from: 'diagnostic',
      type: diagnosticType,
      level: level,
    });
    
    navigate(`/signup?${params.toString()}`);
  };

  if (isExpired) {
    return (
      <Card className="p-6 border-2 border-muted bg-muted/20">
        <div className="text-center">
          <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Oferta Expirada
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            O período promocional terminou, mas você ainda pode assinar!
          </p>
          <Button onClick={() => navigate('/signup')} variant="outline">
            Ver Planos
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "p-6 md:p-8 border-2 relative overflow-hidden",
      "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/10",
      "border-green-500/40 shadow-lg shadow-green-500/10"
    )}>
      {/* Badge */}
      <div className={cn(
        "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white",
        config.badgeColor
      )}>
        <Sparkles className="w-3 h-3 inline mr-1" />
        {config.badgeText}
      </div>

      {/* Decoração */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-green-500/20">
            <Gift className="w-7 h-7 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>

        {/* Desconto */}
        <div className="flex items-center justify-center gap-2 py-4 mb-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <span className="text-4xl md:text-5xl font-black text-green-500">
            {config.discountPercent}%
          </span>
          <span className="text-lg text-green-600 font-semibold">OFF</span>
        </div>

        {/* Código do cupom */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Código:</span>
          <code className="px-3 py-1 bg-muted rounded-lg font-mono font-bold text-foreground">
            {config.couponCode}
          </code>
          <span className="text-sm text-muted-foreground">(aplicado automaticamente)</span>
        </div>

        {/* Countdown */}
        {timeLeft && (
          <div className="flex items-center justify-center gap-2 mb-6 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Expira em: {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        )}

        {/* CTA Principal */}
        <Button
          onClick={handleStartNow}
          size="lg"
          className={cn(
            "w-full h-14 text-lg font-bold",
            "bg-gradient-to-r from-green-500 to-emerald-600",
            "hover:from-green-600 hover:to-emerald-700",
            "text-white shadow-lg shadow-green-500/30",
            "transition-all duration-300 hover:scale-[1.02]"
          )}
        >
          COMEÇAR AGORA COM {config.discountPercent}% OFF
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
