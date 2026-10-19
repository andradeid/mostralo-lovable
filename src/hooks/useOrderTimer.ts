import { useState, useEffect, useMemo } from 'react';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ORDER_TIME_THRESHOLDS } from '@/config/orderTimings';

type TimeColor = 'green' | 'yellow' | 'red';

interface OrderTimerReturn {
  elapsedTime: string;
  color: TimeColor;
  minutes: number;
}

export const useOrderTimer = (createdAt: string, scheduledFor?: string | null): OrderTimerReturn => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  const result = useMemo(() => {
    if (scheduledFor) {
      const delta = new Date(scheduledFor).getTime() - currentTime.getTime();
      const remaining = Math.ceil(Math.abs(delta) / 60000);
      const duration = remaining >= 60 ? `${Math.floor(remaining / 60)}h${String(remaining % 60).padStart(2, '0')}` : `${remaining}min`;
      return { elapsedTime: delta >= 0 ? `faltam ${duration}` : `atrasado ${duration}`, color: delta < 0 ? 'red' as const : 'green' as const, minutes: Math.ceil(delta / 60000) };
    }
    const orderDate = new Date(createdAt);
    const minutes = differenceInMinutes(currentTime, orderDate);
    
    const elapsedTime = formatDistanceToNow(orderDate, {
      locale: ptBR,
      addSuffix: true
    });

    let color: TimeColor = 'green';
    if (minutes >= ORDER_TIME_THRESHOLDS.yellow) {
      color = 'red';
    } else if (minutes >= ORDER_TIME_THRESHOLDS.green) {
      color = 'yellow';
    }

    return { elapsedTime, color, minutes };
  }, [createdAt, scheduledFor, currentTime]);

  return result;
};
