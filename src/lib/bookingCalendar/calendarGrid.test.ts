import { test } from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'date-fns';
import {
  bookingRangeForView,
  filterCalendarBookings,
  bookingsForDay,
  buildDayTimeSlots,
  slotBookingsFor,
  timeSlotsForDay,
  weekDaysFor,
  monthGridDaysFor,
  getStatusLabel,
  getStatusStyles,
  makeCalendarLookups,
  calendarDateTitle,
  calendarStats,
} from './calendarGrid.ts';

// deno-lint-ignore no-explicit-any
const bk = (o: Record<string, unknown>): any => ({
  id: 'b', professional_id: 'p1', service_id: 's1', customer_name: 'Ana Souza', customer_phone: '61999990000',
  booking_date: '2026-11-04', start_time: '09:00:00', end_time: '09:30:00', status: 'confirmed', ...o,
});
const fmt = (x: Date) => format(x, 'yyyy-MM-dd');

test('período buscado por visão (semana começa no domingo)', () => {
  const qua = new Date('2026-11-04T12:00:00');
  const mes = bookingRangeForView('month', qua);
  assert.deepEqual([fmt(mes.start), fmt(mes.end)], ['2026-11-01', '2026-11-30']);
  const sem = bookingRangeForView('week', qua);
  assert.deepEqual([fmt(sem.start), fmt(sem.end)], ['2026-11-01', '2026-11-07']);
  const dia = bookingRangeForView('day', qua);
  assert.deepEqual([fmt(dia.start), fmt(dia.end)], ['2026-11-04', '2026-11-04']);
});

test('filtro por profissional e busca por nome ou telefone', () => {
  const list = [bk({ id: 'a' }), bk({ id: 'b', professional_id: 'p2', customer_name: 'Bruno' }), bk({ id: 'c', customer_name: 'Carla', customer_phone: '61988887777' })];
  assert.deepEqual(filterCalendarBookings(list, 'all', '').map(b => b.id), ['a', 'b', 'c']);
  assert.deepEqual(filterCalendarBookings(list, 'p2', '').map(b => b.id), ['b']);
  assert.deepEqual(filterCalendarBookings(list, 'all', 'ANA').map(b => b.id), ['a']);
  assert.deepEqual(filterCalendarBookings(list, 'all', '8887').map(b => b.id), ['c']);
  assert.deepEqual(filterCalendarBookings(list, 'all', '   ').map(b => b.id), ['a', 'b', 'c']);
});

test('agrupa reservas por dia e por horário da grade', () => {
  const list = [bk({ id: 'a' }), bk({ id: 'b', booking_date: '2026-11-05' }), bk({ id: 'c', start_time: '09:30:00' }), bk({ id: 'd', start_time: '09:15:00' })];
  const doDia = bookingsForDay(list, new Date('2026-11-04T08:00:00'));
  assert.deepEqual(doDia.map(b => b.id), ['a', 'c', 'd']);
  // 09:15 entra na linha das 09:00 (antes sumia da grade)
  assert.deepEqual(slotBookingsFor(doDia, '09:00').map(b => b.id), ['a', 'd']);
  assert.deepEqual(slotBookingsFor(doDia, '09:30').map(b => b.id), ['c']);
  const slots = buildDayTimeSlots();
  assert.equal(slots.some(t => slotBookingsFor(doDia, t).some(b => b.id === 'd')), true);
});

test('agendamento fora da faixa 07:00–21:30 ganha linha própria', () => {
  const cedo = bk({ id: 'e', start_time: '06:20:00' });
  const tarde = bk({ id: 'f', start_time: '22:45:00' });
  const slots = timeSlotsForDay(buildDayTimeSlots(), [cedo, tarde]);
  assert.equal(slots[0], '06:00');
  assert.equal(slots[slots.length - 1], '22:30');
  assert.deepEqual(slotBookingsFor([cedo, tarde], '22:30').map(b => b.id), ['f']);
});

test('grade de horários do dia: 07:00 a 21:30 de 30 em 30', () => {
  const slots = buildDayTimeSlots();
  assert.equal(slots.length, 30);
  assert.equal(slots[0], '07:00');
  assert.equal(slots[1], '07:30');
  assert.equal(slots[slots.length - 1], '21:30');
});

test('dias da semana e grade do mês em semanas completas', () => {
  const qua = new Date('2026-11-04T12:00:00');
  assert.deepEqual(weekDaysFor(qua).map(fmt), ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
  const mes = monthGridDaysFor(qua);
  assert.equal(fmt(mes[0]), '2026-11-01');
  assert.equal(fmt(mes[mes.length - 1]), '2026-12-05');
  assert.equal(mes.length % 7, 0);
});

test('status: rótulo e cores', () => {
  assert.equal(getStatusLabel('no_show'), 'Não Compareceu');
  assert.equal(getStatusLabel('in_progress'), 'Em Atendimento');
  assert.equal(getStatusStyles('confirmed').dot, 'bg-emerald-500');
  // deno-lint-ignore no-explicit-any
  assert.equal(getStatusStyles('outro' as any).dot, 'bg-slate-300');
});

test('nome, foto, iniciais e serviço', () => {
  const l = makeCalendarLookups([{ id: 'p1', name: 'carlos barbeiro silva', photo_url: null }], [{ id: 's1', name: 'Corte' }]);
  assert.equal(l.getProfessionalName('p1'), 'carlos barbeiro silva');
  assert.equal(l.getProfessionalName('x'), 'Não atribuído');
  assert.equal(l.getProfessionalInitials('p1'), 'CB');
  assert.equal(l.getProfessionalInitials('x'), 'NA');
  assert.equal(l.getProfessionalPhoto('p1'), null);
  assert.equal(l.getServiceName('s1'), 'Corte');
  assert.equal(l.getServiceName('x'), 'Serviço');
});

test('título da data por visão', () => {
  const qua = new Date('2026-11-04T12:00:00');
  assert.equal(calendarDateTitle('month', qua), 'novembro de 2026');
  assert.equal(calendarDateTitle('week', qua), '01/11 - 07/11/2026');
  assert.equal(calendarDateTitle('day', qua), 'quarta-feira, 04 de novembro de 2026');
});

test('números: dia usa só o dia selecionado; semana/mês usam o período; falta conta como cancelado', () => {
  const list = [
    bk({ id: 'a', status: 'pending' }), bk({ id: 'b', status: 'confirmed' }), bk({ id: 'c', status: 'in_progress' }),
    bk({ id: 'd', status: 'completed' }), bk({ id: 'e', status: 'no_show' }), bk({ id: 'f', status: 'cancelled', booking_date: '2026-11-05' }),
  ];
  const sel = new Date('2026-11-04T12:00:00');
  const byDay = (date: Date) => bookingsForDay(list, date);
  const dia = calendarStats('day', sel, list, byDay);
  assert.equal(dia.statsBookings.length, 5);
  assert.equal(dia.pendingCount + dia.confirmedCount + dia.inProgressCount, 3);
  assert.equal(dia.completedCount, 1);
  assert.equal(dia.cancelledCount, 1);
  assert.equal(dia.totalLabel, 'Dia');
  const semana = calendarStats('week', sel, list, byDay);
  assert.equal(semana.statsBookings.length, 6);
  assert.equal(semana.cancelledCount, 2);
  assert.equal(semana.totalLabel, 'Semana');
  assert.equal(calendarStats('month', sel, list, byDay).totalLabel, 'Mês');
  assert.equal(calendarStats('day', new Date(), list, byDay).totalLabel, 'Hoje');
});
