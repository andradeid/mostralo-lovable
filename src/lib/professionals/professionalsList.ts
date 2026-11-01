// Regras da tela de Profissionais (painel de agendamento). Funções puras:
// mesmo código que ficava dentro da ProfessionalsPage, só movido para cá.

export type StatusFilter = 'all' | 'active' | 'inactive';
export type SortOption = 'name' | 'most_busy' | 'least_busy';

export interface ProfessionalTodayStat {
  todayBookings: number;
  todayRevenue: number;
  occupancyPercent: number;
  hasScheduleToday: boolean;
  totalSlots: number;
}

export type ProfessionalTodayStats = Record<string, ProfessionalTodayStat>;

interface TodayBookingRow {
  professional_id: string | null;
  status: string | null;
  price: number | null;
}

interface TodayScheduleRow {
  professional_id: string;
  start_time: string | null;
  end_time: string | null;
}

/** Números de hoje por profissional (agendamentos, faturamento e ocupação em vagas de 30 min). */
export function buildProfessionalTodayStats(
  professionalIds: string[],
  bookings: TodayBookingRow[] | null,
  schedules: TodayScheduleRow[] | null,
): ProfessionalTodayStats {
  const stats: Record<string, {
    todayBookings: number;
    todayRevenue: number;
    occupancyPercent: number;
    hasScheduleToday: boolean;
    totalSlots: number;
  }> = {};

  professionalIds.forEach(id => {
    const profBookings = (bookings || []).filter(b =>
      b.professional_id === id && b.status !== 'cancelled' && b.status !== 'no_show'
    );
    const profSchedule = (schedules || []).find(s => s.professional_id === id);

    let totalSlots = 0;
    if (profSchedule?.start_time && profSchedule?.end_time) {
      // Vagas de 30 min no expediente, contando os minutos (ex.: 08:30–18:00 = 19 vagas)
      const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
      totalSlots = Math.max(0, Math.floor((toMin(profSchedule.end_time) - toMin(profSchedule.start_time)) / 30));
    }

    const occupancy = totalSlots > 0
      ? Math.round((profBookings.length / totalSlots) * 100)
      : 0;

    stats[id] = {
      todayBookings: profBookings.length,
      todayRevenue: profBookings.reduce((sum, b) => sum + (b.price || 0), 0),
      occupancyPercent: Math.min(occupancy, 100),
      hasScheduleToday: !!profSchedule,
      totalSlots,
    };
  });

  return stats;
}

interface ListedProfessional {
  id: string;
  name: string;
  specialty: string | null;
  is_active: boolean;
  commission_value: number;
}

/** Busca por nome/especialidade, filtro de status e ordenação (nome ou ocupação de hoje). */
export function filterAndSortProfessionals<P extends ListedProfessional>(
  professionals: P[],
  searchTerm: string,
  statusFilter: StatusFilter,
  sortOption: SortOption,
  todayStats: ProfessionalTodayStats | undefined,
): P[] {
  let result = professionals.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status filter
  if (statusFilter === 'active') result = result.filter(p => p.is_active);
  if (statusFilter === 'inactive') result = result.filter(p => !p.is_active);

  // Sort
  if (sortOption === 'most_busy') {
    result = [...result].sort((a, b) =>
      (todayStats?.[b.id]?.todayBookings || 0) - (todayStats?.[a.id]?.todayBookings || 0)
    );
  } else if (sortOption === 'least_busy') {
    result = [...result].sort((a, b) =>
      (todayStats?.[a.id]?.todayBookings || 0) - (todayStats?.[b.id]?.todayBookings || 0)
    );
  } else {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}

export interface ProfessionalsKpis {
  total: number;
  active: number;
  inactive: number;
  withCommission: number;
}

export function professionalsKpis(professionals: ListedProfessional[]): ProfessionalsKpis {
  const active = professionals.filter(p => p.is_active).length;
  const inactive = professionals.filter(p => !p.is_active).length;
  const withCommission = professionals.filter(p => p.commission_value > 0).length;
  return {
    total: professionals.length,
    active,
    inactive,
    withCommission
  };
}

/** Mapa profissional → serviços vinculados (linhas de professional_services com o serviço junto). */
export function buildProfessionalServicesMap(data: any[] | null): Record<string, { id: string; name: string }[]> {
  const servicesMap: Record<string, { id: string; name: string }[]> = {};
  (data || []).forEach((ps: any) => {
    if (ps.service) {
      if (!servicesMap[ps.professional_id]) {
        servicesMap[ps.professional_id] = [];
      }
      servicesMap[ps.professional_id].push(ps.service);
    }
  });
  return servicesMap;
}

/** Separa o telefone salvo (com DDI 55) em DDI + número para o formulário de edição. */
export function splitProfessionalPhone(savedPhone: string | null): { countryCode: string; phone: string } {
  let countryCode = '+55';
  let phone = '';
  if (savedPhone) {
    if (savedPhone.startsWith('55')) {
      countryCode = '+55';
      phone = savedPhone.slice(2);
    } else {
      phone = savedPhone;
    }
  }
  return { countryCode, phone };
}

export const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
