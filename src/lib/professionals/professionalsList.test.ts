import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProfessionalTodayStats,
  filterAndSortProfessionals,
  professionalsKpis,
  buildProfessionalServicesMap,
  splitProfessionalPhone,
  getInitials,
} from './professionalsList.ts';

const prof = (o: Record<string, unknown>) => ({
  id: 'p', name: 'Ana', specialty: null as string | null, is_active: true, commission_value: 0, ...o,
}) as { id: string; name: string; specialty: string | null; is_active: boolean; commission_value: number };

test('estatística de hoje: ignora cancelado e falta, soma preço e calcula ocupação em vagas de 30 min', () => {
  const stats = buildProfessionalTodayStats(
    ['a', 'b'],
    [
      { professional_id: 'a', status: 'confirmed', price: 50 },
      { professional_id: 'a', status: 'cancelled', price: 80 },
      { professional_id: 'a', status: 'no_show', price: 80 },
      { professional_id: 'a', status: 'pending', price: null },
    ],
    [{ professional_id: 'a', start_time: '09:00:00', end_time: '10:30:00' }],
  );
  // 09:00 → 10:30 = 3 vagas de 30 min; 2 agendamentos válidos = 67%
  assert.deepEqual(stats.a, { todayBookings: 2, todayRevenue: 50, occupancyPercent: 67, hasScheduleToday: true, totalSlots: 3 });
  assert.deepEqual(stats.b, { todayBookings: 0, todayRevenue: 0, occupancyPercent: 0, hasScheduleToday: false, totalSlots: 0 });
});

test('ocupação nunca passa de 100%', () => {
  const stats = buildProfessionalTodayStats(
    ['a'],
    [1, 2, 3].map(() => ({ professional_id: 'a', status: 'confirmed', price: 10 })),
    [{ professional_id: 'a', start_time: '09:00', end_time: '10:00' }],
  );
  assert.equal(stats.a.occupancyPercent, 100);
});

test('filtra por nome/especialidade e status, e ordena', () => {
  const list = [
    prof({ id: '1', name: 'Bruno', specialty: 'Barbeiro' }),
    prof({ id: '2', name: 'Ana', specialty: 'Manicure', is_active: false }),
    prof({ id: '3', name: 'Carla', specialty: 'barbeira' }),
  ];
  assert.deepEqual(filterAndSortProfessionals(list, '', 'all', 'name', undefined).map(p => p.id), ['2', '1', '3']);
  assert.deepEqual(filterAndSortProfessionals(list, 'BARB', 'all', 'name', undefined).map(p => p.id), ['1', '3']);
  assert.deepEqual(filterAndSortProfessionals(list, '', 'inactive', 'name', undefined).map(p => p.id), ['2']);
  const stats = { '1': { todayBookings: 1 }, '3': { todayBookings: 4 } } as any;
  assert.deepEqual(filterAndSortProfessionals(list, '', 'active', 'most_busy', stats).map(p => p.id), ['3', '1']);
  assert.deepEqual(filterAndSortProfessionals(list, '', 'active', 'least_busy', stats).map(p => p.id), ['1', '3']);
});

test('KPIs de ativos, inativos e com comissão', () => {
  const list = [prof({ commission_value: 10 }), prof({ is_active: false }), prof({})];
  assert.deepEqual(professionalsKpis(list), { total: 3, active: 2, inactive: 1, withCommission: 1 });
});

test('mapa de serviços por profissional ignora linha sem serviço', () => {
  const map = buildProfessionalServicesMap([
    { professional_id: 'a', service: { id: 's1', name: 'Corte' } },
    { professional_id: 'a', service: null },
    { professional_id: 'b', service: { id: 's2', name: 'Barba' } },
  ]);
  assert.deepEqual(map, { a: [{ id: 's1', name: 'Corte' }], b: [{ id: 's2', name: 'Barba' }] });
  assert.deepEqual(buildProfessionalServicesMap(null), {});
});

test('telefone salvo vira DDI + número', () => {
  assert.deepEqual(splitProfessionalPhone('5561999990000'), { countryCode: '+55', phone: '61999990000' });
  assert.deepEqual(splitProfessionalPhone('61999990000'), { countryCode: '+55', phone: '61999990000' });
  assert.deepEqual(splitProfessionalPhone(null), { countryCode: '+55', phone: '' });
});

test('iniciais com até 2 letras', () => {
  assert.equal(getInitials('ana maria souza'), 'AM');
  assert.equal(getInitials('Bruno'), 'B');
});
