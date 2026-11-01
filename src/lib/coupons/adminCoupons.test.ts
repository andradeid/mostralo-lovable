import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCouponRecord,
  couponToFormData,
  duplicateCouponFormData,
  filterCoupons,
  getCalculatedDiscount,
  getComputedStatus,
  getCouponStats,
  getStatusConfig,
  type Coupon,
  type CouponFormData,
} from './adminCoupons.ts';

const coupon = (o: Partial<Coupon>): Coupon => ({
  id: 'c1', code: 'PROMO', name: 'Promo', description: null, discount_type: 'percentage', discount_value: 10,
  applies_to: 'all_plans', plan_ids: [], max_uses: null, max_uses_per_user: 1, used_count: 0,
  start_date: null, end_date: null, status: 'active', is_public: false, promotion_label: 'OFERTA LIMITADA',
  show_countdown: true, duration_type: 'once', duration_months: null, created_at: '', updated_at: '', ...o,
});

const form = (o: Partial<CouponFormData>): CouponFormData => ({ ...couponToFormData(coupon({})), ...o });
const plans = [{ id: 'p1', name: 'Agenda', price: 100 }, { id: 'p2', name: 'Delivery', price: 200 }];

test('status calculado: inativo vence tudo; data fim passada = expirado; início futuro = agendado', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  assert.equal(getComputedStatus(coupon({ status: 'inactive', end_date: '2020-01-01T00:00:00Z' }), now), 'inactive');
  assert.equal(getComputedStatus(coupon({ end_date: '2026-10-31T00:00:00Z' }), now), 'expired');
  assert.equal(getComputedStatus(coupon({ start_date: '2026-11-02T00:00:00Z' }), now), 'scheduled');
  assert.equal(getComputedStatus(coupon({ status: 'expired' }), now), 'expired');
  assert.equal(getComputedStatus(coupon({}), now), 'active');
  assert.equal(getStatusConfig('qualquer').label, 'Inativo');
});

test('preço final: só com 1 plano; desconto e porcentagem com 1 casa', () => {
  assert.equal(getCalculatedDiscount(form({ discount_type: 'percentage', plan_ids: ['p1'] }), plans), null);
  assert.equal(getCalculatedDiscount(form({ discount_type: 'final_price', plan_ids: ['p1', 'p2'] }), plans), null);
  const calc = getCalculatedDiscount(form({ discount_type: 'final_price', plan_ids: ['p1'], final_price: 70 }), plans);
  assert.deepEqual(calc, { originalPrice: 100, finalPrice: 70, discount: 30, percentage: '30.0', planName: 'Agenda', isValid: true });
  assert.equal(getCalculatedDiscount(form({ discount_type: 'final_price', plan_ids: ['p1'], final_price: 100 }), plans)?.isValid, false);
});

test('registro gravado: código sem espaço em maiúsculas, preço final vira desconto fixo', () => {
  const r = buildCouponRecord(form({ code: 'bem vindo', discount_type: 'final_price', plan_ids: ['p2'], final_price: 150 }), plans);
  assert.equal(r.code, 'BEMVINDO');
  assert.equal(r.discount_type, 'fixed');
  assert.equal(r.discount_value, 50);
  assert.equal('final_price' in r, false);
  assert.throws(() => buildCouponRecord(form({ discount_type: 'final_price', plan_ids: [] }), plans), /Selecione um plano específico/);
});

test('duração ajusta meses e usos por usuário', () => {
  const once = buildCouponRecord(form({ duration_type: 'once', duration_months: 5 }), plans);
  assert.equal(once.duration_months, 1);
  assert.equal(once.max_uses_per_user, 1);
  const multiple = buildCouponRecord(form({ duration_type: 'multiple', duration_months: 3 }), plans);
  assert.equal(multiple.duration_months, 3);
  assert.equal(multiple.max_uses_per_user, 3);
  const forever = buildCouponRecord(form({ duration_type: 'forever', duration_months: 3 }), plans);
  assert.equal(forever.duration_months, null);
  assert.equal(forever.max_uses_per_user, 0);
});

test('duplicar: código _COPY, nome (Cópia), sem datas, ativo e não público', () => {
  const d = duplicateCouponFormData(coupon({ start_date: '2026-01-01', end_date: '2026-02-01', status: 'inactive', is_public: true }));
  assert.equal(d.code, 'PROMO_COPY');
  assert.equal(d.name, 'Promo (Cópia)');
  assert.equal(d.start_date, null);
  assert.equal(d.end_date, null);
  assert.equal(d.status, 'active');
  assert.equal(d.is_public, false);
  assert.equal(d.final_price, 0);
});

test('cards e filtros', () => {
  const list = [
    coupon({ id: 'a', used_count: 2, max_uses: 10 }),
    coupon({ id: 'b', status: 'inactive', discount_type: 'fixed', used_count: 3, max_uses: 10 }),
  ];
  assert.deepEqual(getCouponStats(list), { activeCoupons: 1, scheduledCoupons: 0, totalUses: 5, conversionRate: '25.0' });
  assert.equal(getCouponStats([coupon({})]).conversionRate, '—');
  assert.deepEqual(filterCoupons(list, 'inactive', 'all').map((c) => c.id), ['b']);
  assert.deepEqual(filterCoupons(list, 'all', 'percentage').map((c) => c.id), ['a']);
});
