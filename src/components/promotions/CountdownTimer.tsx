import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  onExpire?: () => void;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ endDate, onExpire, compact = false }: CountdownTimerProps) => {
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
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (isExpired) {
    return null;
  }

  if (!timeLeft) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-orange-600" />
        <span className="font-mono font-bold text-orange-600">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <TimeUnit value={timeLeft.days} label="DIAS" />
      <Separator />
      <TimeUnit value={timeLeft.hours} label="HORAS" />
      <Separator />
      <TimeUnit value={timeLeft.minutes} label="MIN" />
      <Separator />
      <TimeUnit value={timeLeft.seconds} label="SEG" />
    </div>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white text-red-600 font-bold text-2xl sm:text-4xl rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-lg min-w-[60px] sm:min-w-[80px] text-center border-2 border-red-200">
      {String(value).padStart(2, '0')}
    </div>
    <span className="text-xs sm:text-sm font-semibold mt-1 text-white">{label}</span>
  </div>
);

const Separator = () => (
  <div className="text-white font-bold text-2xl sm:text-4xl pb-6">:</div>
);

