/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  addDaysIso, clampWeeks, formatDdMm, generateWeeklyDates, isIsoDate, isoFromLocalDate, nowInTimezone, weekdayOfIso,
} from './weeklyDates.ts';
import { classifyOccurrence, classifyOccurrences, minutesToTime, timeToMinutes, type ClassifyContext } from './conflicts.ts';
import { buildRecurrenceSummary, describeSkipped, normalizeRecurrenceResult, previewCounts, seriesCancelNotice } from './summary.ts';

test('datas semanais: padrão 4, limite 2..12, virada de mês/ano e horário de verão', () => {
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-11-03' }), ['2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24']);
  assert.equal(generateWeeklyDates({ startDate: '2026-11-03', weeks: 1 }).length, 2);
  assert.equal(generateWeeklyDates({ startDate: '2026-11-03', weeks: 50 }).length, 12);
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-12-22', weeks: 3 }), ['2026-12-22', '2026-12-29', '2027-01-05']);
  // mudança de horário (EUA, 08/03/2026) não desloca o dia
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-03-02', weeks: 2 }), ['2026-03-02', '2026-03-09']);
  assert.deepEqual(generateWeeklyDates({ startDate: 'xx' }), []);
  assert.equal(clampWeeks('abc'), 4);
  assert.equal(clampWeeks(7.9), 7);
});

test('datas semanais: "até a data" corta junto com a quantidade', () => {
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-11-03', weeks: 12, untilDate: '2026-11-20' }), ['2026-11-03', '2026-11-10', '2026-11-17']);
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-11-03', weeks: 2, untilDate: '2027-01-01' }), ['2026-11-03', '2026-11-10']);
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-11-03', weeks: 4, untilDate: '2026-11-01' }), []);
  assert.deepEqual(generateWeeklyDates({ startDate: '2026-11-03', weeks: 4, untilDate: '' }).length, 4);
});

test('helpers de data não usam o fuso do navegador', () => {
  assert.equal(addDaysIso('2026-02-27', 7), '2026-03-06');
  assert.equal(weekdayOfIso('2026-11-02'), 1); // segunda
  assert.equal(weekdayOfIso('2026-11-08'), 0); // domingo
  assert.equal(formatDdMm('2026-11-09'), '09/11');
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isoFromLocalDate(new Date(2026, 10, 3)), '2026-11-03');
  // 02:30 UTC de 04/11 ainda é 03/11 em São Paulo
  assert.deepEqual(nowInTimezone('America/Sao_Paulo', new Date('2026-11-04T02:30:00Z')), { date: '2026-11-03', minutes: 23 * 60 + 30 });
  assert.equal(nowInTimezone('Fuso/Invalido', new Date('2026-11-04T02:30:00Z')).date, '2026-11-03');
});

const baseCtx = (over: Partial<ClassifyContext> = {}): ClassifyContext => ({
  startTime: '10:00',
  durationMinutes: 30,
  bufferMinutes: 0,
  schedules: [0, 1, 2, 3, 4, 5, 6].filter(d => d !== 0).map(d => ({
    day_of_week: d, start_time: '09:00:00', end_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00', is_available: true,
  })),
  blocks: [],
  bookings: [],
  now: null,
  ...over,
});

test('conflitos: livre, ocupado, cancelada não conta', () => {
  assert.equal(classifyOccurrence('2026-11-03', baseCtx()), 'free');
  const bookings = [
    { booking_date: '2026-11-10', start_time: '10:15:00', end_time: '10:45:00', status: 'confirmed' },
    { booking_date: '2026-11-17', start_time: '10:00:00', end_time: '10:30:00', status: 'cancelled' },
    { booking_date: '2026-11-24', start_time: '10:30:00', end_time: '11:00:00', status: 'pending' }, // encosta, não sobrepõe
  ];
  assert.deepEqual(
    classifyOccurrences(['2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24'], baseCtx({ bookings })).map(o => o.status),
    ['free', 'busy', 'free', 'free'],
  );
  // com 15 min de folga a reserva das 10:30 passa a conflitar (mesma regra da grade do diálogo)
  assert.equal(classifyOccurrence('2026-11-24', baseCtx({ bookings, bufferMinutes: 15 })), 'busy');
});

test('conflitos: expediente, intervalo, dia sem trabalho e bloqueios', () => {
  assert.equal(classifyOccurrence('2026-11-08', baseCtx()), 'off_hours'); // domingo sem horário
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ startTime: '08:30' })), 'off_hours');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ startTime: '17:45' })), 'off_hours');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ startTime: '17:30' })), 'free');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ startTime: '11:45' })), 'off_hours'); // invade o almoço
  const off = baseCtx();
  off.schedules = off.schedules.map(s => (s.day_of_week === 2 ? { ...s, is_available: false } : s));
  assert.equal(classifyOccurrence('2026-11-03', off), 'off_hours');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ blocks: [{ block_date: '2026-11-03', is_all_day: true }] })), 'blocked');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ blocks: [{ block_date: '2026-11-03', start_time: '09:50', end_time: '10:10', is_all_day: false }] })), 'blocked');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ blocks: [{ block_date: '2026-11-10', is_all_day: true }] })), 'free');
});

test('conflitos: data/horário que já passou no fuso da loja', () => {
  const now = { date: '2026-11-03', minutes: 10 * 60 };
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ now })), 'past');
  assert.equal(classifyOccurrence('2026-11-03', baseCtx({ now, startTime: '10:30' })), 'free');
  assert.equal(classifyOccurrence('2026-10-27', baseCtx({ now })), 'past');
});

test('minutos e horários', () => {
  assert.equal(timeToMinutes('09:30:00'), 570);
  assert.equal(minutesToTime(570), '09:30');
});

test('resumo depois de salvar', () => {
  assert.equal(buildRecurrenceSummary({ created: [{ date: '2026-11-03', booking_id: 'a' }], skipped: [] }), '1 reserva criada');
  assert.equal(
    buildRecurrenceSummary({
      created: [{ date: '2026-11-03', booking_id: 'a' }, { date: '2026-11-17', booking_id: 'b' }],
      skipped: [{ date: '2026-11-24', reason: 'blocked' }, { date: '2026-11-10', reason: 'busy' }],
    }),
    '2 reservas criadas; 2 datas puladas (ocupado em 10/11; bloqueado em 24/11)',
  );
  assert.equal(describeSkipped([{ date: '2026-11-17', reason: 'busy' }, { date: '2026-11-10', reason: 'busy' }]), 'ocupado em 10/11, 17/11');
  assert.deepEqual(previewCounts([{ date: 'a', status: 'free' }, { date: 'b', status: 'busy' }]), { free: 1, skipped: 1, total: 2 });
});

test('lê a resposta do banco', () => {
  const r = normalizeRecurrenceResult({
    recurrence_group_id: 'g1',
    created: [{ date: '2026-11-03', booking_id: 'b1' }, { date: 1 }],
    skipped: [{ date: '2026-11-10', reason: 'busy' }, { date: '2026-11-17', reason: 'estranho' }],
  });
  assert.equal(r.recurrenceGroupId, 'g1');
  assert.equal(r.created.length, 1);
  assert.deepEqual(r.skipped.map(s => s.reason), ['busy', 'busy']);
  assert.deepEqual(normalizeRecurrenceResult(null), { recurrenceGroupId: null, created: [], skipped: [] });
  assert.equal(normalizeRecurrenceResult({ recurrence_group_id: 'g', created: [], skipped: [] }).recurrenceGroupId, null);
});

test('aviso de cancelamento da série', () => {
  assert.equal(seriesCancelNotice('', []), null);
  assert.equal(seriesCancelNotice('Cliente viajou.', []), 'Cliente viajou.');
  assert.equal(seriesCancelNotice(null, ['2026-11-17']), 'Também cancelamos o horário de 17/11.');
  assert.equal(seriesCancelNotice('Cliente viajou.', ['2026-11-24', '2026-11-17']), 'Cliente viajou. Também cancelamos os horários de 17/11, 24/11.');
});
