import { addMinutes, addDays, isWithinInterval, format, startOfDay, endOfDay, isBefore, isAfter, addHours } from 'date-fns';

export interface ScheduledOrdersSettings {
  enabled: boolean;
  pickup_settings: {
    min_advance_value: number;
    min_advance_unit: 'minutes' | 'hours' | 'days';
    max_advance_value: number;
    max_advance_unit: 'minutes' | 'hours' | 'days';
  };
  delivery_settings: {
    min_advance_value: number;
    min_advance_unit: 'minutes' | 'hours' | 'days';
    max_advance_value: number;
    max_advance_unit: 'minutes' | 'hours' | 'days';
    time_interval: number;
  };
  hide_asap: boolean;
}

export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Converter valor de tempo para minutos
export function convertToMinutes(value: number, unit: 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'minutes':
      return value;
    case 'hours':
      return value * 60;
    case 'days':
      return value * 60 * 24;
    default:
      return value;
  }
}

// Validar se horário está dentro do permitido
export function validateScheduledTime(
  scheduledFor: Date,
  deliveryType: 'delivery' | 'pickup',
  storeConfig: ScheduledOrdersSettings,
  businessHours?: BusinessHours
): ValidationResult {
  if (!storeConfig.enabled) {
    return { valid: false, error: 'Pedidos agendados não estão habilitados para esta loja' };
  }

  const now = new Date();
  const settings = deliveryType === 'delivery' 
    ? storeConfig.delivery_settings 
    : storeConfig.pickup_settings;

  // Verificar tempo mínimo de antecedência
  const minAdvanceMinutes = convertToMinutes(
    settings.min_advance_value,
    settings.min_advance_unit
  );
  const minScheduledTime = addMinutes(now, minAdvanceMinutes);

  if (isBefore(scheduledFor, minScheduledTime)) {
    return {
      valid: false,
      error: `O horário mínimo para agendamento é ${format(minScheduledTime, 'dd/MM/yyyy HH:mm')}`
    };
  }

  // Verificar tempo máximo de antecedência
  const maxAdvanceMinutes = convertToMinutes(
    settings.max_advance_value,
    settings.max_advance_unit
  );
  const maxScheduledTime = addMinutes(now, maxAdvanceMinutes);

  if (isAfter(scheduledFor, maxScheduledTime)) {
    return {
      valid: false,
      error: `O horário máximo para agendamento é ${format(maxScheduledTime, 'dd/MM/yyyy HH:mm')}`
    };
  }

  // Verificar horário de funcionamento
  if (businessHours && !isWithinBusinessHours(scheduledFor, businessHours)) {
    return {
      valid: false,
      error: 'O horário escolhido está fora do horário de funcionamento'
    };
  }

  return { valid: true };
}

// Verificar se está dentro do horário de funcionamento
export function isWithinBusinessHours(
  scheduledFor: Date,
  businessHours: BusinessHours
): boolean {
  const dayOfWeek = format(scheduledFor, 'EEEE').toLowerCase();
  const dayConfig = businessHours[dayOfWeek];

  if (!dayConfig || dayConfig.closed) {
    return false;
  }

  const scheduledTime = format(scheduledFor, 'HH:mm');
  return scheduledTime >= dayConfig.open && scheduledTime <= dayConfig.close;
}

// Gerar slots de horários disponíveis
export function generateAvailableSlots(
  date: Date,
  deliveryType: 'delivery' | 'pickup',
  storeConfig: ScheduledOrdersSettings,
  businessHours?: BusinessHours
): Date[] {
  const slots: Date[] = [];
  
  if (!storeConfig.enabled) {
    return slots;
  }

  const settings = deliveryType === 'delivery' 
    ? storeConfig.delivery_settings 
    : storeConfig.pickup_settings;

  const dayOfWeek = format(date, 'EEEE').toLowerCase();
  const dayConfig = businessHours?.[dayOfWeek];

  if (!dayConfig || dayConfig.closed) {
    return slots;
  }

  // Parse horários de abertura e fechamento
  const [openHour, openMinute] = dayConfig.open.split(':').map(Number);
  const [closeHour, closeMinute] = dayConfig.close.split(':').map(Number);

  let currentSlot = new Date(date);
  currentSlot.setHours(openHour, openMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(closeHour, closeMinute, 0, 0);

  const now = new Date();
  const minAdvanceMinutes = convertToMinutes(
    settings.min_advance_value,
    settings.min_advance_unit
  );
  const minScheduledTime = addMinutes(now, minAdvanceMinutes);

  const maxAdvanceMinutes = convertToMinutes(
    settings.max_advance_value,
    settings.max_advance_unit
  );
  const maxScheduledTime = addMinutes(now, maxAdvanceMinutes);

  const intervalMinutes = deliveryType === 'delivery' 
    ? storeConfig.delivery_settings.time_interval 
    : 30; // Padrão de 30 minutos para pickup

  while (currentSlot <= endTime) {
    // Verificar se o slot está dentro dos limites permitidos
    if (
      !isBefore(currentSlot, minScheduledTime) && 
      !isAfter(currentSlot, maxScheduledTime)
    ) {
      slots.push(new Date(currentSlot));
    }
    currentSlot = addMinutes(currentSlot, intervalMinutes);
  }

  return slots;
}

// Obter próximos pedidos (próximos 30 minutos)
export function getUpcomingOrders(orders: any[], minutesAhead: number = 30): any[] {
  const now = new Date();
  const futureTime = addMinutes(now, minutesAhead);

  return orders.filter(order => {
    if (!order.scheduled_for) return false;
    const scheduledDate = new Date(order.scheduled_for);
    return isWithinInterval(scheduledDate, { start: now, end: futureTime });
  });
}

// Verificar se pedido está atrasado
export function isOrderLate(order: any): boolean {
  if (!order.scheduled_for) return false;
  const scheduledDate = new Date(order.scheduled_for);
  const now = new Date();
  return isBefore(scheduledDate, now) && order.status === 'entrada';
}

// Agrupar pedidos por data
export function groupOrdersByDate(orders: any[]): Record<string, any[]> {
  return orders.reduce((acc, order) => {
    if (!order.scheduled_for) return acc;
    const dateKey = format(new Date(order.scheduled_for), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, any[]>);
}

// Contar pedidos por dia
export function countOrdersByDay(orders: any[]): Record<string, number> {
  return orders.reduce((acc, order) => {
    if (!order.scheduled_for) return acc;
    const dateKey = format(new Date(order.scheduled_for), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
