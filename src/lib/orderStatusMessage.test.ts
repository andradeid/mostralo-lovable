import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  eventFromKind, formatEstimatedTime, formatOrderItems, greetingAt, renderOrderMessage, storeLinks,
} from '../../supabase/functions/_shared/order-status-message';

test('evento a partir do kind', () => {
  assert.equal(eventFromKind('status_order_confirmed'), 'order_confirmed');
  assert.equal(eventFromKind('status_order_cancelled'), 'order_cancelled');
  assert.equal(eventFromKind('confirmation'), null);
  assert.equal(eventFromKind('status_greeting'), null);
});

test('tempo estimado em minutos e prazo em dias', () => {
  assert.equal(formatEstimatedTime(40), '40 minutos');
  assert.equal(formatEstimatedTime(60), '1 hora');
  assert.equal(formatEstimatedTime(90), '1h30min');
  assert.equal(formatEstimatedTime(null), '');
  // criado qui 26/11 12:00 UTC + até qui 03/12 23:59 local
  const min = Math.floor((Date.parse('2026-12-04T02:59:00Z') - Date.parse('2026-11-26T12:00:00Z')) / 60000);
  assert.equal(formatEstimatedTime(min, '2026-11-26T12:00:00Z'), 'até qui. 03/12');
});

test('saudação pelo horário de São Paulo', () => {
  assert.equal(greetingAt(new Date('2026-11-26T12:00:00Z')), 'Bom dia'); // 09h
  assert.equal(greetingAt(new Date('2026-11-26T18:00:00Z')), 'Boa tarde'); // 15h
  assert.equal(greetingAt(new Date('2026-11-26T23:30:00Z')), 'Boa noite'); // 20h30
});

test('links com domínio próprio e sem', () => {
  assert.deepEqual(storeLinks({ storeSlug: 'querencia', orderId: 'abc', storeCustomDomain: 'unaquerencia.com.br', storeCustomDomainVerified: true }),
    { storeLink: 'https://unaquerencia.com.br', orderLink: 'https://unaquerencia.com.br/pedido/abc' });
  assert.deepEqual(storeLinks({ storeSlug: 'querencia', orderId: 'abc' }),
    { storeLink: 'https://mostralo.com.br/loja/querencia', orderLink: 'https://mostralo.com.br/pedido/abc' });
});

test('troca todas as variáveis', () => {
  const msg = renderOrderMessage('Olá, {primeiro_nome}! Pedido #{numero_pedido} na {loja} ({tipo_entrega}) — R$ {valor_total}\n{itens_pedido}\nPrazo: {tempo_estimado}\n{link_pedido}', {
    customerName: 'Camila Oliveira', orderNumber: '0008', storeName: 'Querencia', deliveryType: 'pickup', orderTotal: 18.99,
    orderItems: formatOrderItems([{ quantity: 1, product_name: 'Doçura', subtotal: 18.99 }]),
    estimatedTime: 'até qui. 03/12', orderId: 'id1', storeSlug: 'querencia',
  });
  assert.equal(msg, 'Olá, Camila! Pedido #0008 na Querencia (Retirada no Balcão) — R$ 18,99\n• 1x Doçura (R$ 18,99)\nPrazo: até qui. 03/12\nhttps://mostralo.com.br/pedido/id1');
});
