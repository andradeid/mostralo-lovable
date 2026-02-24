/**
 * Utilitários para validação de áreas de entrega
 */

export interface TimeFee {
  id: string;
  startTime: string; // "22:00"
  endTime: string;   // "06:00"
  fee: number;
  label?: string;    // "Taxa noturna"
}

export interface DeliveryZone {
  id: string;
  name: string;
  type: 'radius' | 'polygon';
  radius?: number;
  center?: { lat: number; lng: number };
  coordinates?: Array<{ lat: number; lng: number }>;
  deliveryFee: number;
  color?: string;
  isActive: boolean;
  timeFees?: TimeFee[];
}

export interface ZoneValidationResult {
  isInZone: boolean;
  zone: DeliveryZone | null;
  deliveryFee: number;
  message: string;
  activeTimeFee?: TimeFee | null;
}

/**
 * Calcula distância entre dois pontos em metros usando fórmula de Haversine
 */
function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verifica se um ponto está dentro de um raio circular
 */
export function isPointInRadius(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  radiusInMeters: number
): boolean {
  const distance = getDistanceInMeters(point.lat, point.lng, center.lat, center.lng);
  return distance <= radiusInMeters;
}

/**
 * Verifica se um ponto está dentro de um polígono usando algoritmo ray-casting
 */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Encontra a zona de entrega que contém o ponto (prioriza zonas menores)
 */
export function findMatchingZone(
  lat: number,
  lng: number,
  zones: DeliveryZone[]
): DeliveryZone | null {
  const matchingZones = zones.filter((zone) => {
    if (!zone.isActive) return false;

    if (zone.type === 'radius' && zone.center && zone.radius) {
      return isPointInRadius({ lat, lng }, zone.center, zone.radius);
    }

    if (zone.type === 'polygon' && zone.coordinates && zone.coordinates.length >= 3) {
      return isPointInPolygon({ lat, lng }, zone.coordinates);
    }

    return false;
  });

  if (matchingZones.length === 0) return null;

  // Retorna a zona com menor área (mais específica)
  return matchingZones.reduce((smallest, current) => {
    const smallestArea = smallest.type === 'radius' 
      ? Math.PI * Math.pow(smallest.radius || 0, 2)
      : 0;
    const currentArea = current.type === 'radius'
      ? Math.PI * Math.pow(current.radius || 0, 2)
      : 0;
    return currentArea < smallestArea ? current : smallest;
  });
}

/**
 * Verifica se o horário atual está dentro de uma faixa horária
 * Suporta faixas que cruzam meia-noite (ex: 22:00 até 06:00)
 */
export function isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
  const [curH, curM] = currentTime.split(':').map(Number);
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const cur = curH * 60 + curM;
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start <= end) {
    // Faixa normal (ex: 08:00 até 18:00)
    return cur >= start && cur < end;
  } else {
    // Faixa que cruza meia-noite (ex: 22:00 até 06:00)
    return cur >= start || cur < end;
  }
}

/**
 * Retorna a TimeFee ativa para o horário atual, ou null
 */
export function getActiveTimeFee(zone: DeliveryZone, now?: Date): TimeFee | null {
  if (!zone.timeFees || zone.timeFees.length === 0) return null;

  const currentDate = now || new Date();
  const currentTime = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  for (const tf of zone.timeFees) {
    if (isTimeInRange(currentTime, tf.startTime, tf.endTime)) {
      return tf;
    }
  }
  return null;
}

/**
 * Calcula a taxa de entrega baseada na localização e horário
 */
export function calculateDeliveryFee(
  lat: number,
  lng: number,
  zones: DeliveryZone[],
  defaultFee: number = 0
): number {
  const matchingZone = findMatchingZone(lat, lng, zones);
  if (!matchingZone) return defaultFee;

  const activeTimeFee = getActiveTimeFee(matchingZone);
  return activeTimeFee ? activeTimeFee.fee : matchingZone.deliveryFee;
}

/**
 * Valida se um ponto está dentro de alguma zona de entrega
 */
export function validateDeliveryLocation(
  lat: number,
  lng: number,
  zones: DeliveryZone[],
  acceptOutsideZone: boolean = false,
  defaultFee: number = 0
): ZoneValidationResult {
  const matchingZone = findMatchingZone(lat, lng, zones);

  if (matchingZone) {
    const activeTimeFee = getActiveTimeFee(matchingZone);
    const fee = activeTimeFee ? activeTimeFee.fee : matchingZone.deliveryFee;
    const timeLabel = activeTimeFee
      ? ` (${activeTimeFee.label || `${activeTimeFee.startTime}-${activeTimeFee.endTime}`})`
      : '';

    return {
      isInZone: true,
      zone: matchingZone,
      deliveryFee: fee,
      message: `Dentro da área de entrega - ${matchingZone.name}${timeLabel}`,
      activeTimeFee,
    };
  }

  // Fora de todas as zonas
  if (acceptOutsideZone) {
    return {
      isInZone: false,
      zone: null,
      deliveryFee: defaultFee,
      message: 'Fora da área de entrega - Pedido sujeito a aprovação',
      activeTimeFee: null,
    };
  }

  return {
    isInZone: false,
    zone: null,
    deliveryFee: defaultFee,
    message: 'Fora da área de entrega - Selecione outro endereço',
    activeTimeFee: null,
  };
}
