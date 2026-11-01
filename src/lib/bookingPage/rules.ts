// Regras puras da página pública de agendamento: validação do formulário, horário final,
// profissionais que fazem o serviço, horários livres, passos e mensagens de "sem horário".
// Sem React e sem Supabase, para poder testar com node:test.
import { z } from 'zod';
import { getSpecialDayFor } from '../specialDays';
import { calculateBookingDeposit } from '../../../supabase/functions/_shared/booking-deposit';
import type { BookingService, Professional, ProfessionalServiceLink, Step } from './types';

// Validation schema
export const bookingSchema = z.object({
  customerName: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  customerPhone: z.string().trim().min(10, 'Telefone inválido').max(20),
  customerEmail: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500).optional()
});

export interface BookingFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

/** Valida o formulário do cliente. Devolve null quando está tudo certo, ou o erro de cada campo. */
export function validateBookingForm({ customerName, customerPhone, customerEmail, notes }: BookingFormInput): Record<string, string> | null {
  // Validate form
  const validation = bookingSchema.safeParse({
    customerName,
    customerPhone,
    customerEmail: customerEmail || undefined,
    notes
  });

  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    validation.error.issues.forEach(issue => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
    });
    return fieldErrors;
  }
  return null;
}

// Helper to convert time string (HH:MM:SS or HH:MM) to minutes
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatPrice = (price: number, priceType: 'fixed' | 'from') => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
  return priceType === 'from' ? `A partir de ${formatted}` : formatted;
};

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Sinal previsto (mesma conta do servidor) para avisar antes de confirmar
export function expectedBookingDeposit(bookingSettings: unknown, selectedService: BookingService | null): number {
  const st = bookingSettings as any;
  if (!st?.require_deposit || !selectedService) return 0;
  const mode = st.deposit_payment_mode === 'mostralo' ? 'mostralo' : 'store';
  if (mode === 'store' && !String(st.pix_key ?? '').trim()) return 0;
  return calculateBookingDeposit(st, selectedService as any);
}

// Profissionais que fazem o serviço escolhido. Loja sem vínculo cadastrado para o serviço: todos.
// Profissional sem nenhum serviço marcado também aparece em todos (nunca foi configurado).
export function eligibleProfessionalsFor(
  service: BookingService | null,
  professionals: Professional[],
  professionalServices: ProfessionalServiceLink[],
): Professional[] {
  if (!service) return professionals;
  const linked = new Set(
    professionalServices.filter(l => l.service_id === service.id).map(l => l.professional_id)
  );
  if (linked.size === 0) return professionals;
  const configured = new Set(professionalServices.map(l => l.professional_id));
  return professionals.filter(p => linked.has(p.id) || !configured.has(p.id));
}

export interface SlotsInput {
  businessHours: any;
  selectedDate: Date | undefined;
  selectedService: BookingService | null;
  targetProfIds: string[];
  schedulesForDay: any[];
  blocksForDay: any[];
  bookingsForDay: any[];
  slotIntervalMinutes: number | null | undefined;
  minAdvanceHours: number | null | undefined;
  now?: Date;
}

// Horários livres por profissional (mesma lógica do painel). Retorna horário → profissionais livres.
export function computeSlotsByTime({
  businessHours,
  selectedDate,
  selectedService,
  targetProfIds,
  schedulesForDay,
  blocksForDay,
  bookingsForDay,
  slotIntervalMinutes,
  minAdvanceHours: minAdvanceHoursSetting,
  now = new Date(),
}: SlotsInput): Map<string, string[]> {
  const result = new Map<string, string[]>();
  if (!selectedDate || !selectedService) return result;

  const slotInterval = slotIntervalMinutes || 30;
  const minAdvanceHours = minAdvanceHoursSetting ?? 2;
  const minAllowedDateTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const serviceDuration = selectedService.duration_minutes || 30;
  const totalServiceTime = serviceDuration + (selectedService.buffer_minutes || 0);

  // Dia especial da loja (feriado/véspera): fechado = sem horários; aberto = limita ao horário do dia
  const special = getSpecialDayFor(businessHours, selectedDate);
  if (special?.closed) return result;
  const specialOpen = special ? timeToMinutes(special.open) : null;
  const specialClose = special ? timeToMinutes(special.close) : null;

  for (const profId of targetProfIds) {
    const schedule = schedulesForDay.find((sc: any) => sc.professional_id === profId);
    if (!schedule || !schedule.is_available) continue;
    const profBlocks = blocksForDay.filter((b: any) => b.professional_id === profId);
    if (profBlocks.some((b: any) => b.is_all_day)) continue;

    const workStart = timeToMinutes(schedule.start_time);
    const workEnd = timeToMinutes(schedule.end_time);
    const breakStart = schedule.break_start ? timeToMinutes(schedule.break_start) : null;
    const breakEnd = schedule.break_end ? timeToMinutes(schedule.break_end) : null;
    const blockedIntervals = profBlocks
      .filter((b: any) => !b.is_all_day && b.start_time && b.end_time)
      .map((b: any) => ({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) }));
    const occupiedIntervals = bookingsForDay
      .filter((bk: any) => bk.professional_id === profId || (!bk.professional_id && targetProfIds.length === 1))
      .map((bk: any) => ({ start: timeToMinutes(bk.start_time), end: timeToMinutes(bk.end_time) }));

    for (let minutes = workStart; minutes <= workEnd - serviceDuration; minutes += slotInterval) {
      const slotEnd = minutes + totalServiceTime;
      if (specialOpen !== null && minutes < specialOpen) continue;
      if (specialClose !== null && minutes + serviceDuration > specialClose) continue;
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (slotDateTime <= minAllowedDateTime) continue;
      if (breakStart !== null && breakEnd !== null && minutes < breakEnd && slotEnd > breakStart) continue;
      if (blockedIntervals.some(bl => minutes < bl.end && slotEnd > bl.start)) continue;
      if (occupiedIntervals.some(iv => minutes < iv.end && slotEnd > iv.start)) continue;

      const label = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
      result.set(label, [...(result.get(label) || []), profId]);
    }
  }
  return result;
}

// No "qualquer profissional", atribui quem estiver livre no horário e com menos atendimentos no dia
export function pickProfessionalForTimeFrom(
  time: string,
  slotsByTime: Map<string, string[]>,
  bookingsForDay: any[],
  eligibleProfessionals: Professional[],
): Professional | null {
  const free = slotsByTime.get(time) || [];
  if (free.length === 0) return null;
  const load = (id: string) => bookingsForDay.filter((bk: any) => bk.professional_id === id).length;
  const bestId = [...free].sort((a, b) => load(a) - load(b))[0];
  return eligibleProfessionals.find(p => p.id === bestId) || null;
}

export interface NoSlotsInput {
  businessHours: any;
  anyProfessional: boolean;
  schedulesForDay: any[];
  selectedProfessional: Professional | null;
  selectedDate: Date | undefined;
  professionalSchedule: any;
  professionalBlocks: any[];
}

// Determine no slots reason
export function getNoSlotsReason({
  businessHours, anyProfessional, schedulesForDay, selectedProfessional, selectedDate, professionalSchedule, professionalBlocks,
}: NoSlotsInput) {
  if (selectedDate && getSpecialDayFor(businessHours, selectedDate)?.closed) return 'special_closed';
  if (anyProfessional && selectedDate) {
    return schedulesForDay.some((sc: any) => sc.is_available) ? 'fully_booked' : 'nobody_working';
  }
  if (!selectedProfessional || !selectedDate) return null;
  if (professionalSchedule === null) return 'schedule_not_configured';
  if (professionalSchedule && !professionalSchedule.is_available) return 'not_working';
  if (professionalBlocks.some((b: { is_all_day?: boolean }) => b.is_all_day)) return 'blocked';
  if (selectedDate.toDateString() === new Date().toDateString()) return 'today_passed';
  return 'fully_booked';
}

// Get no slots message
export function getNoSlotsMessage(
  noSlotsReason: string | null,
  selectedProfessional: Professional | null,
  businessHours: any,
  selectedDate: Date | undefined,
) {
  switch (noSlotsReason) {
    // Sem horário cadastrado para o dia = não atende nesse dia da semana
    case 'not_working':
    case 'schedule_not_configured':
      return `${selectedProfessional?.name?.split(' ')[0] || 'O profissional'} não atende neste dia da semana`;
    case 'nobody_working': return 'Nenhum profissional atende neste dia da semana';
    case 'special_closed': {
      const sp = selectedDate ? getSpecialDayFor(businessHours, selectedDate) : null;
      return `Fechado nesta data${sp?.name ? ` (${sp.name})` : ''}`;
    }
    case 'blocked': return 'Profissional indisponível nesta data';
    case 'today_passed': return 'Nenhum horário disponível para hoje';
    default: return 'Nenhum horário disponível para esta data';
  }
}

export interface CanProceedInput {
  selectedService: BookingService | null;
  selectedProfessional: Professional | null;
  anyProfessional: boolean;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  customerName: string;
  customerPhone: string;
}

export function canProceedStep(currentStep: Step, s: CanProceedInput) {
  switch (currentStep) {
    case 'service': return !!s.selectedService;
    case 'professional': return !!s.selectedProfessional || s.anyProfessional;
    case 'datetime': return !!s.selectedDate && !!s.selectedTime;
    case 'confirm': return !!s.customerName && s.customerPhone.replace(/\D/g, '').length >= 10;
    default: return false;
  }
}

/** Próximo passo (pula "profissional" quando ele já está definido). null = já está no último. */
export function nextStepOf(currentStep: Step, skipProfessionalStep: boolean): Step | null {
  const steps: Step[] = ['service', 'professional', 'datetime', 'confirm'];
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex < steps.length - 1) {
    let nextStepIndex = currentIndex + 1;

    // Se profissional foi pré-selecionado, pular o step de profissional
    if (steps[nextStepIndex] === 'professional' && skipProfessionalStep) {
      nextStepIndex++;
    }

    return steps[nextStepIndex];
  }
  return null;
}

/** Passo anterior (pula "profissional" quando ele já está definido). null = já está no primeiro. */
export function prevStepOf(currentStep: Step, skipProfessionalStep: boolean): Step | null {
  const steps: Step[] = ['service', 'professional', 'datetime', 'confirm'];
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex > 0) {
    let prevStepIndex = currentIndex - 1;

    // Se profissional foi pré-selecionado, pular o step de profissional ao voltar
    if (steps[prevStepIndex] === 'professional' && skipProfessionalStep) {
      prevStepIndex--;
    }

    if (prevStepIndex >= 0) {
      return steps[prevStepIndex];
    }
  }
  return null;
}
