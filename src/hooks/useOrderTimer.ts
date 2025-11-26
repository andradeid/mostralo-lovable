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

export const useOrderTimer = (createdAt: string): OrderTimerReturn => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  const result = useMemo(() => {
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
  }, [createdAt, currentTime]);

  return result;
};
