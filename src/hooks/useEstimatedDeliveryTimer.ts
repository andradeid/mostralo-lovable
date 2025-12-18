import { useState, useEffect, useMemo } from 'react';
import { differenceInMinutes, addMinutes, format } from 'date-fns';

export type DeliveryStatus = 'on_time' | 'almost_due' | 'late';

interface EstimatedDeliveryTimerReturn {
  remainingMinutes: number;
  status: DeliveryStatus;
  displayText: string;
  color: 'green' | 'yellow' | 'red';
  hasEstimate: boolean;
  estimatedTime: string;
}

export const useEstimatedDeliveryTimer = (
  createdAt: string,
  estimatedMinutes: number | null
): EstimatedDeliveryTimerReturn => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    if (!estimatedMinutes) {
      return {
        remainingMinutes: 0,
        status: 'on_time' as DeliveryStatus,
        displayText: '',
        color: 'green' as const,
        hasEstimate: false,
        estimatedTime: '',
      };
    }

    const createdDate = new Date(createdAt);
    const estimatedDeliveryDate = addMinutes(createdDate, estimatedMinutes);
    const remaining = differenceInMinutes(estimatedDeliveryDate, currentTime);
    const estimatedTime = format(estimatedDeliveryDate, 'HH:mm');

    let status: DeliveryStatus;
    let color: 'green' | 'yellow' | 'red';
    let displayText: string;

    if (remaining > 5) {
      status = 'on_time';
      color = 'green';
      displayText = `Faltam ${remaining} min`;
    } else if (remaining > 0) {
      status = 'almost_due';
      color = 'yellow';
      displayText = `Faltam ${remaining} min`;
    } else {
      status = 'late';
      color = 'red';
      const lateMinutes = Math.abs(remaining);
      displayText = `Atrasado ${lateMinutes} min`;
    }

    return {
      remainingMinutes: remaining,
      status,
      displayText,
      color,
      hasEstimate: true,
      estimatedTime,
    };
  }, [createdAt, estimatedMinutes, currentTime]);
};
