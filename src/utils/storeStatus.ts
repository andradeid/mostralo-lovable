export function isStoreOpen(businessHours: any): boolean {
  // 1. Verificar se serviço está pausado
  if (businessHours?.service_paused === true) {
    return false;
  }

  // 2. Verificar dia e horário atual
  if (!businessHours) return false;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5);
  
  const dayHours = businessHours[today];
  if (!dayHours || dayHours.closed) return false;
  
  // Verificar se está dentro do horário
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

export function getStoreStatusMessage(businessHours: any): string {
  if (!businessHours) {
    return 'Carregando...';
  }
  
  if (businessHours.service_paused === true || businessHours.service_paused === 'true') {
    return 'Serviço pausado temporariamente';
  }
  
  const isOpen = isStoreOpen(businessHours);
  return isOpen ? 'Estabelecimento aberto' : 'Estabelecimento fechado';
}

export function getNextOpeningTime(businessHours: any): {
  nextOpenDay: string;
  nextOpenTime: string;
  isToday: boolean;
  isTomorrow: boolean;
  daysUntilOpen: number;
} | null {
  if (!businessHours) return null;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesPortuguese = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);

  // Verificar se abre ainda hoje (após horário atual)
  const todayHours = businessHours[dayNames[currentDay]];
  if (todayHours && !todayHours.closed && currentTime < todayHours.open) {
    return {
      nextOpenDay: dayNamesPortuguese[currentDay],
      nextOpenTime: todayHours.open,
      isToday: true,
      isTomorrow: false,
      daysUntilOpen: 0
    };
  }

  // Procurar próximo dia aberto (até 7 dias à frente)
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDay + i) % 7;
    const nextDayHours = businessHours[dayNames[nextDayIndex]];
    
    if (nextDayHours && !nextDayHours.closed) {
      return {
        nextOpenDay: dayNamesPortuguese[nextDayIndex],
        nextOpenTime: nextDayHours.open,
        isToday: false,
        isTomorrow: i === 1,
        daysUntilOpen: i
      };
    }
  }

  return null; // Loja sempre fechada
}

export function formatNextOpeningMessage(nextOpening: ReturnType<typeof getNextOpeningTime>): string {
  if (!nextOpening) return '';

  if (nextOpening.isToday) {
    return `Abre hoje às ${nextOpening.nextOpenTime}`;
  }

  if (nextOpening.isTomorrow) {
    return `Abre amanhã às ${nextOpening.nextOpenTime}`;
  }

  if (nextOpening.daysUntilOpen <= 6) {
    return `Abre ${nextOpening.nextOpenDay} às ${nextOpening.nextOpenTime}`;
  }

  return '';
}
