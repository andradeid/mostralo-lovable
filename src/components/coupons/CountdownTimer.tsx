import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  onExpire?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ 
  endDate, 
  onExpire,
  className = '',
  size = 'md'
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        if (onExpire) onExpire();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Calcular imediatamente
    setTimeLeft(calculateTimeLeft());

    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (isExpired || !timeLeft) {
    return (
      <div className={`flex items-center justify-center gap-2 text-red-600 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="font-semibold">Oferta Expirada</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: {
      container: 'text-xs',
      number: 'text-lg',
      label: 'text-[10px]'
    },
    md: {
      container: 'text-sm',
      number: 'text-2xl md:text-3xl',
      label: 'text-xs'
    },
    lg: {
      container: 'text-base',
      number: 'text-3xl md:text-4xl',
      label: 'text-sm'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center gap-2 md:gap-4 ${sizes.container} ${className}`}>
      {/* Dias */}
      <div className="flex flex-col items-center">
        <div className={`${sizes.number} font-bold text-primary tabular-nums`}>
          {String(timeLeft.days).padStart(2, '0')}
        </div>
        <div className={`${sizes.label} text-muted-foreground uppercase font-medium`}>
          {timeLeft.days === 1 ? 'DIA' : 'DIAS'}
        </div>
      </div>

      <div className={`${sizes.number} font-bold text-muted-foreground`}>:</div>

      {/* Horas */}
      <div className="flex flex-col items-center">
        <div className={`${sizes.number} font-bold text-primary tabular-nums`}>
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <div className={`${sizes.label} text-muted-foreground uppercase font-medium`}>
          {timeLeft.hours === 1 ? 'HORA' : 'HORAS'}
        </div>
      </div>

      <div className={`${sizes.number} font-bold text-muted-foreground`}>:</div>

      {/* Minutos */}
      <div className="flex flex-col items-center">
        <div className={`${sizes.number} font-bold text-primary tabular-nums`}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <div className={`${sizes.label} text-muted-foreground uppercase font-medium`}>
          MIN
        </div>
      </div>

      <div className={`${sizes.number} font-bold text-muted-foreground`}>:</div>

      {/* Segundos */}
      <div className="flex flex-col items-center">
        <div className={`${sizes.number} font-bold text-primary tabular-nums`}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className={`${sizes.label} text-muted-foreground uppercase font-medium`}>
          SEG
        </div>
      </div>
    </div>
  );
};

