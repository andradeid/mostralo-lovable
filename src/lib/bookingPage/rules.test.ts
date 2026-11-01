/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  calculateEndTime, canProceedStep, computeSlotsByTime, eligibleProfessionalsFor, expectedBookingDeposit,
  formatDuration, getNoSlotsMessage, getNoSlotsReason, nextStepOf, pickProfessionalForTimeFrom, prevStepOf,
  timeToMinutes, validateBookingForm,
} from './rules.ts';

const svc = { id: 's1', name: 'Corte', description: null, duration_minutes: 30, price: 50, price_type: 'fixed' as const };
const ana = { id: 'ana', name: 'Ana Souza', slug: 'ana', photo_url: null, specialty: null };
const bia = { id: 'bia', name: 'Bia', slug: null, photo_url: null, specialty: null };
const caio = { id: 'caio', name: 'Caio', slug: null, photo_url: null, specialty: null };

test('horário final soma a duração e vira o dia em horas cheias', () => {
  assert.equal(calculateEndTime('09:00', 30), '09:30');
  assert.equal(calculateEndTime('09:45', 30), '10:15');
  assert.equal(calculateEndTime('23:30', 45), '24:15');
  assert.equal(timeToMinutes('08:30:00'), 510);
});

test('duração em texto', () => {
  assert.equal(formatDuration(45), '45 min');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(90), '1h 30min');
});

test('formulário: nome curto, telefone curto e e-mail inválido dão erro por campo', () => {
  assert.equal(validateBookingForm({ customerName: 'Ana', customerPhone: '(61) 99999-0000', customerEmail: '', notes: '' }), null);
  const errs = validateBookingForm({ customerName: 'A', customerPhone: '123', customerEmail: 'x@', notes: '' });
  assert.deepEqual(errs, { customerName: 'Nome deve ter pelo menos 2 caracteres', customerPhone: 'Telefone inválido', customerEmail: 'Email inválido' });
});

test('profissionais do serviço: sem vínculo = todos; com vínculo = os vinculados + os nunca configurados', () => {
  assert.deepEqual(eligibleProfessionalsFor(null, [ana, bia], []), [ana, bia]);
  assert.deepEqual(eligibleProfessionalsFor(svc, [ana, bia], [{ professional_id: 'ana', service_id: 'outro' }]), [ana, bia]);
  const links = [{ professional_id: 'ana', service_id: 's1' }, { professional_id: 'bia', service_id: 'outro' }];
  assert.deepEqual(eligibleProfessionalsFor(svc, [ana, bia, caio], links), [ana, caio]);
});

test('passos: pula "profissional" quando definido, nos dois sentidos', () => {
  assert.equal(nextStepOf('service', false), 'professional');
  assert.equal(nextStepOf('service', true), 'datetime');
  assert.equal(nextStepOf('confirm', false), null);
  assert.equal(prevStepOf('datetime', true), 'service');
  assert.equal(prevStepOf('datetime', false), 'professional');
  assert.equal(prevStepOf('service', false), null);
});

test('pode avançar: confirmar exige nome e 10 dígitos de telefone', () => {
  const base = { selectedService: svc, selectedProfessional: null, anyProfessional: false, selectedDate: undefined, selectedTime: null, customerName: 'Ana', customerPhone: '(61) 9999-000' };
  assert.equal(canProceedStep('confirm', base), false);
  assert.equal(canProceedStep('confirm', { ...base, customerPhone: '(61) 9999-0000' }), true);
  assert.equal(canProceedStep('professional', base), false);
  assert.equal(canProceedStep('professional', { ...base, anyProfessional: true }), true);
});

test('sinal previsto: desligado, sem Pix no modo loja, e com Pix', () => {
  assert.equal(expectedBookingDeposit(null, svc), 0);
  assert.equal(expectedBookingDeposit({ require_deposit: true, default_deposit_percentage: 30 }, svc), 0);
  assert.equal(expectedBookingDeposit({ require_deposit: true, default_deposit_percentage: 30, pix_key: 'x' }, svc), 15);
  assert.equal(expectedBookingDeposit({ require_deposit: true, default_deposit_percentage: 30, deposit_payment_mode: 'mostralo' }, svc), 15);
});

const day = new Date(2030, 0, 7); // segunda
const early = new Date(2030, 0, 1);
const schedule = (id: string) => ({ professional_id: id, is_available: true, start_time: '09:00:00', end_time: '11:00:00', break_start: '10:00', break_end: '10:30' });

test('horários livres: intervalo, pausa, agendamento e bloqueio', () => {
  const slots = computeSlotsByTime({
    businessHours: null, selectedDate: day, selectedService: svc, targetProfIds: ['ana'],
    schedulesForDay: [schedule('ana')], blocksForDay: [], bookingsForDay: [{ professional_id: 'ana', start_time: '09:30:00', end_time: '10:00:00' }],
    slotIntervalMinutes: 30, minAdvanceHours: 2, now: early,
  });
  assert.deepEqual([...slots.keys()], ['09:00', '10:30']);
});

test('horários livres: dia especial fechado não tem horário; aberto limita ao horário do dia', () => {
  const base = {
    selectedDate: day, selectedService: svc, targetProfIds: ['ana'], schedulesForDay: [schedule('ana')],
    blocksForDay: [], bookingsForDay: [], slotIntervalMinutes: 30, minAdvanceHours: 2, now: early,
  };
  assert.equal(computeSlotsByTime({ ...base, businessHours: { special_days: [{ id: '1', date: '2030-01-07', name: 'X', open: '', close: '', closed: true }] } }).size, 0);
  const open = computeSlotsByTime({ ...base, businessHours: { special_days: [{ id: '1', date: '2030-01-07', name: 'X', open: '09:30', close: '10:00', closed: false }] } });
  assert.deepEqual([...open.keys()], ['09:30']);
});

test('qualquer profissional: escolhe o livre com menos atendimentos no dia', () => {
  const slotsByTime = new Map([['09:00', ['ana', 'bia']]]);
  const bookings = [{ professional_id: 'ana' }, { professional_id: 'ana' }, { professional_id: 'bia' }];
  assert.equal(pickProfessionalForTimeFrom('09:00', slotsByTime, bookings, [ana, bia])?.id, 'bia');
  assert.equal(pickProfessionalForTimeFrom('10:00', slotsByTime, bookings, [ana, bia]), null);
});

test('motivo e mensagem de "sem horário"', () => {
  const base = { businessHours: null, anyProfessional: false, schedulesForDay: [], selectedProfessional: ana, selectedDate: day, professionalSchedule: null, professionalBlocks: [] };
  assert.equal(getNoSlotsReason(base), 'schedule_not_configured');
  assert.equal(getNoSlotsMessage('schedule_not_configured', ana, null, day), 'Ana não atende neste dia da semana');
  assert.equal(getNoSlotsReason({ ...base, anyProfessional: true }), 'nobody_working');
  assert.equal(getNoSlotsReason({ ...base, professionalSchedule: { is_available: true }, professionalBlocks: [{ is_all_day: true }] }), 'blocked');
  const hours = { special_days: [{ id: '1', date: '2030-01-07', name: 'Natal', open: '', close: '', closed: true }] };
  assert.equal(getNoSlotsReason({ ...base, businessHours: hours }), 'special_closed');
  assert.equal(getNoSlotsMessage('special_closed', ana, hours, day), 'Fechado nesta data (Natal)');
});
