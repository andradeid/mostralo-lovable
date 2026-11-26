import { useState, useEffect, useMemo } from 'react';
import { differenceInMinutes, addMinutes, format } from 'date-fns';
import { deadlineLabel, isLongEstimate, LONG_ESTIMATE_MINUTES } from '@/lib/leadTime';

export type DeliveryStatus = 'on_time' | 'almost_due' | 'late';

interface EstimatedDeliveryTimerReturn {
  remainingMinutes: number;
  status: DeliveryStatus;
  displayText: string;
  color: 'green' | 'yellow' | 'red';
  hasEstimate: boolean;
  estimatedTime: string;
  /** Prazo de 1 dia ou mais (encomenda): mostrar data, não minutos */
  isLong: boolean;
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
        isLong: false,
      };
    }

    const createdDate = new Date(createdAt);
    const estimatedDeliveryDate = addMinutes(createdDate, estimatedMinutes);
    const remaining = differenceInMinutes(estimatedDeliveryDate, currentTime);
    // Encomenda (prazo em dias): data limite, sem contagem em minutos
    if (isLongEstimate(estimatedMinutes)) {
      const label = deadlineLabel(estimatedDeliveryDate);
      const late = remaining <= 0;
      return {
        remainingMinutes: remaining,
        status: (late ? 'late' : remaining < LONG_ESTIMATE_MINUTES ? 'almost_due' : 'on_time') as DeliveryStatus,
        displayText: late ? `Prazo vencido (${label})` : `Prazo: até ${label}`,
        color: (late ? 'red' : remaining < LONG_ESTIMATE_MINUTES ? 'yellow' : 'green') as 'green' | 'yellow' | 'red',
        hasEstimate: true,
        estimatedTime: format(estimatedDeliveryDate, 'dd/MM'),
        isLong: true,
      };
    }

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
      isLong: false,
    };
  }, [createdAt, estimatedMinutes, currentTime]);
};
