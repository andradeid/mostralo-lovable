/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  addressLine, buildQuoteBody, normalizeCep, optionLabel, parseQuoteResponse, parseShippingAddress,
  type ShippingSettings,
} from '../../../supabase/functions/_shared/shipping.ts';

const S: ShippingSettings = {
  enabled: true, environment: 'sandbox', origin_postal_code: '73026125', services: ['1', '2', '3'],
  default_weight_kg: '0.800', default_height_cm: '12.0', default_width_cm: '22.0', default_length_cm: '33.0',
  handling_days: 1, free_shipping_min: null,
};

test('normalizeCep', () => {
  assert.equal(normalizeCep('73026-125'), '73026125');
  assert.equal(normalizeCep('7302612'), null);
  assert.equal(normalizeCep('00000-000'), null);
  assert.equal(normalizeCep(null), null);
});

test('buildQuoteBody usa embalagem padrão quando o produto não tem medidas', () => {
  const b = buildQuoteBody(S, '01310100', [
    { product_id: 'a', quantity: 2, unit_price: 59.9 },
    { product_id: 'b', quantity: 1, unit_price: 169.9, weight_kg: 1.2, height_cm: 14, width_cm: 24, length_cm: 35 },
  ]);
  assert.deepEqual(b.from, { postal_code: '73026125' });
  assert.deepEqual(b.products[0], { id: 'a', width: 22, height: 12, length: 33, weight: 0.8, insurance_value: 59.9, quantity: 2 });
  assert.equal(b.products[1].weight, 1.2);
  assert.equal(b.services, '1,2,3');
});

const RESP = [
  { id: 1, name: 'PAC', price: '24.90', custom_price: '22.40', delivery_time: 8, custom_delivery_time: 8, company: { name: 'Correios' } },
  { id: 2, name: 'SEDEX', price: '41.30', custom_price: '41.30', custom_delivery_time: 3, company: { name: 'Correios' } },
  { id: 3, name: '.Package', custom_price: '19.80', custom_delivery_time: 6, company: { name: 'Jadlog' } },
  { id: 4, name: '.Com', error: 'Transportadora não atende este trecho.', company: { name: 'Jadlog' } },
  { id: 17, name: 'Mini Envios', custom_price: '12.00', custom_delivery_time: 9, company: { name: 'Correios' } },
];

test('parseQuoteResponse: filtra serviços, ignora erro, soma dias de postagem e ordena', () => {
  const o = parseQuoteResponse(RESP, S, 100);
  assert.deepEqual(o.map((x) => x.service_id), ['3', '1', '2']);
  assert.equal(o[0].price, 19.8);
  assert.equal(o[1].price, 22.4); // custom_price
  assert.equal(o[1].delivery_days, 9); // 8 + 1 dia para postar
  assert.equal(optionLabel(o[0]), 'Jadlog .Package');
  assert.equal(optionLabel({ name: 'PAC', company: 'Correios' }), 'Correios PAC');
});

test('parseQuoteResponse: frete grátis só na mais barata a partir do mínimo', () => {
  const s = { ...S, free_shipping_min: '199' };
  assert.equal(parseQuoteResponse(RESP, s, 198.99)[0].free, false);
  const o = parseQuoteResponse(RESP, s, 199);
  assert.equal(o[0].price, 0);
  assert.equal(o[0].carrier_price, 19.8);
  assert.equal(o[0].free, true);
  assert.equal(o[1].free, false);
});

test('parseQuoteResponse: resposta inválida vira lista vazia', () => {
  assert.deepEqual(parseQuoteResponse({ message: 'Unauthenticated.' }, S, 10), []);
});

test('parseShippingAddress exige CEP, rua, número, cidade e UF', () => {
  const a = parseShippingAddress({ postal_code: '01310-100', street: 'Av. Paulista', number: '1000', complement: 'ap 52', district: 'Bela Vista', city: 'São Paulo', state: 'sp' });
  assert.ok(a);
  assert.equal(a!.state, 'SP');
  assert.equal(addressLine(a!), 'Av. Paulista, 1000, ap 52 · Bela Vista · São Paulo - SP · 01310-100');
  assert.equal(parseShippingAddress({ postal_code: '01310100', street: 'X', number: '', city: 'Y', state: 'SP' }), null);
});
