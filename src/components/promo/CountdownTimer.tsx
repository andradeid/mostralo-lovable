import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  hours: number;
  storageKey?: string;
  onExpire?: () => void;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const STORAGE_PREFIX = 'mostralo_promo_countdown_';

export function CountdownTimer({ 
  hours, 
  storageKey = 'default',
  onExpire 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fullKey = `${STORAGE_PREFIX}${storageKey}`;
    
    // Verificar se já existe um timestamp salvo
    const savedTimestamp = localStorage.getItem(fullKey);
    let targetTime: number;
    
    if (savedTimestamp) {
      targetTime = parseInt(savedTimestamp, 10);
    } else {
      // Criar novo timestamp (agora + X horas)
      targetTime = Date.now() + hours * 60 * 60 * 1000;
      localStorage.setItem(fullKey, targetTime.toString());
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTime - now;
      
      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    // Calcular imediatamente
    setTimeLeft(calculateTimeLeft());

    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [hours, storageKey, onExpire]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (isExpired) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400 font-semibold text-lg">⏰ Oferta Expirada!</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {/* Horas */}
      <div className="flex flex-col items-center">
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
          <span className="text-2xl sm:text-4xl font-bold text-white font-mono">
            {formatNumber(timeLeft.hours)}
          </span>
        </div>
        <span className="text-xs sm:text-sm text-zinc-400 mt-1">Horas</span>
      </div>

      <span className="text-2xl sm:text-4xl font-bold text-orange-500">:</span>

      {/* Minutos */}
      <div className="flex flex-col items-center">
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
          <span className="text-2xl sm:text-4xl font-bold text-white font-mono">
            {formatNumber(timeLeft.minutes)}
          </span>
        </div>
        <span className="text-xs sm:text-sm text-zinc-400 mt-1">Min</span>
      </div>

      <span className="text-2xl sm:text-4xl font-bold text-orange-500">:</span>

      {/* Segundos */}
      <div className="flex flex-col items-center">
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
          <span className="text-2xl sm:text-4xl font-bold text-orange-400 font-mono animate-pulse">
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>
        <span className="text-xs sm:text-sm text-zinc-400 mt-1">Seg</span>
      </div>
    </div>
  );
}
