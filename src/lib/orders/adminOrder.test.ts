/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  adminOrderLabels, adminOrderTotals, catalogBasePrice, catalogIds, lineSubtotal, parseAdminOrderRequest, priceAdminOrder,
  type Catalog, type Fail,
} from '../../../supabase/functions/_shared/admin-order.ts';
import { buildAdminOrderRequest, screenTotals, totalDiffers, withQuantity, type ScreenOrderState } from './adminOrderRequest.ts';

const STORE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CUST = '33333333-3333-4333-8333-333333333333';
const DRIVER = '44444444-4444-4444-8444-444444444444';
const BURGER = 'aaaaaaaa-0000-4000-8000-000000000001';
const PIZZA = 'aaaaaaaa-0000-4000-8000-000000000002';
const SODA = 'aaaaaaaa-0000-4000-8000-000000000003';
const GRANDE = 'bbbbbbbb-0000-4000-8000-000000000001';
const BACON = 'cccccccc-0000-4000-8000-000000000001';
const QUEIJO = 'cccccccc-0000-4000-8000-000000000002';

const catalog = (o: Partial<Catalog> = {}): Catalog => ({
  products: [
    { id: BURGER, store_id: STORE, name: 'X-Burger', price: 30, offer_price: null, is_on_offer: false, is_available: true },
    { id: PIZZA, store_id: STORE, name: 'Pizza Calabresa', price: 40, offer_price: 35, is_on_offer: true, is_available: true },
    { id: SODA, store_id: STORE, name: 'Refri', price: 8, offer_price: 6, is_on_offer: false, is_available: true },
  ],
  variants: [{ id: GRANDE, product_id: PIZZA, name: 'Grande', price: 55.9, is_available: true }],
  addons: [
    { id: BACON, store_id: STORE, name: 'Bacon', price: 4.5, is_available: true },
    { id: QUEIJO, store_id: STORE, name: 'Queijo', price: 3, is_available: true },
  ],
  productAddons: [{ product_id: BURGER, addon_id: BACON }, { product_id: BURGER, addon_id: QUEIJO }],
  ...o,
});

const screen = (o: Partial<ScreenOrderState> = {}): ScreenOrderState => ({
  storeId: STORE,
  customer: { id: CUST, name: 'Ana', phone: '61999990000', email: undefined, address: 'Rua 1, 10' },
  items: [{
    productId: BURGER, productName: 'X-Burger', quantity: 2, unitPrice: 30, subtotal: 69, notes: 'sem cebola',
    addons: [{ id: BACON, name: 'Bacon', price: 4.5, quantity: 1 }],
  }],
  deliveryType: 'delivery',
  deliveryFee: 7,
  paymentMethod: 'pix',
  paymentDetails: null,
  paymentStatus: 'pending',
  notes: '',
  driverId: null,
  ...o,
});

test('preço base: variação > oferta > preço', () => {
  assert.equal(catalogBasePrice({ price: 40, offer_price: 35, is_on_offer: true }), 35);
  assert.equal(catalogBasePrice({ price: 40, offer_price: 35, is_on_offer: false }), 40);
  assert.equal(catalogBasePrice({ price: 40, offer_price: 0, is_on_offer: true }), 40);
  assert.equal(catalogBasePrice({ price: 40, offer_price: 35, is_on_offer: true }, { price: 55.9 }), 55.9);
  assert.equal(catalogBasePrice({ price: '12.50' as unknown as number }), 12.5);
});

test('subtotal do item: (base + adicionais × qtd do adicional) × quantidade', () => {
  assert.equal(lineSubtotal(30, [{ price: 4.5, quantity: 2 }, { price: 3, quantity: 1 }], 2), 84);
  assert.equal(lineSubtotal(0.1, [{ price: 0.2, quantity: 1 }], 3), 0.9);
  assert.equal(lineSubtotal(10, [], 1), 10);
});

test('totais: taxa só no delivery, nunca negativa', () => {
  assert.deepEqual(adminOrderTotals(69, 'delivery', 7), { subtotal: 69, delivery_fee: 7, total: 76 });
  assert.deepEqual(adminOrderTotals(69, 'pickup', 7), { subtotal: 69, delivery_fee: 0, total: 69 });
  assert.deepEqual(adminOrderTotals(10, 'delivery', -3), { subtotal: 10, delivery_fee: 0, total: 10 });
});

test('etiquetas de canal como o painel aplicava', () => {
  assert.deepEqual(adminOrderLabels('manual', 'delivery'), ['Balcão', 'Delivery']);
  assert.deepEqual(adminOrderLabels('manual', 'pickup'), ['Balcão']);
  assert.deepEqual(adminOrderLabels('whatsapp_chat', 'delivery'), ['WhatsApp', 'Delivery']);
});

test('montagem do corpo: só ids e quantidades dos itens; taxa e entregador só no delivery', () => {
  const body = buildAdminOrderRequest(screen({ driverId: DRIVER }));
  assert.equal(body.source, 'manual');
  assert.equal(body.delivery_fee, 7);
  assert.equal(body.driver_id, DRIVER);
  assert.equal(body.customer.email, null);
  assert.deepEqual(body.items, [{ product_id: BURGER, variant_id: null, quantity: 2, notes: 'sem cebola', addons: [{ id: BACON, quantity: 1 }] }]);
  assert.ok(!('unitPrice' in body.items[0]) && !('subtotal' in body.items[0]));

  const pickup = buildAdminOrderRequest(screen({ deliveryType: 'pickup', driverId: DRIVER, source: 'whatsapp_chat' }));
  assert.equal(pickup.delivery_fee, 0);
  assert.equal(pickup.driver_id, null);
  assert.equal(pickup.source, 'whatsapp_chat');
});

test('montagem do corpo: tipo de cartão só com cartão', () => {
  assert.deepEqual(buildAdminOrderRequest(screen({ paymentMethod: 'card', paymentDetails: { card_type: 'debit' } })).payment_details, { card_type: 'debit' });
  assert.equal(buildAdminOrderRequest(screen({ paymentMethod: 'card', paymentDetails: null })).payment_details, null);
  assert.equal(buildAdminOrderRequest(screen({ paymentMethod: 'pix', paymentDetails: { card_type: 'credit' } })).payment_details, null);
});

test('tela: quantidade recalcula o subtotal sem mexer no item original; totais e diferença', () => {
  const item = screen().items[0];
  const changed = withQuantity(item, 3);
  assert.equal(changed.subtotal, 103.5);
  assert.equal(item.subtotal, 69);
  assert.deepEqual(screenTotals([{ subtotal: 69 }, { subtotal: 8 }], 'delivery', 7), { subtotal: 77, delivery_fee: 7, total: 84 });
  assert.equal(totalDiffers(84, 84.004), false);
  assert.equal(totalDiffers(84, 79), true);
});

test('servidor aceita o corpo montado pela tela', () => {
  const parsed = parseAdminOrderRequest(buildAdminOrderRequest(screen({ driverId: DRIVER })));
  assert.ok(parsed.ok);
  if (parsed.ok) {
    assert.equal(parsed.req.notes, '');
    assert.equal(parsed.req.items[0].notes, 'sem cebola');
    assert.equal(parsed.req.customer.address, 'Rua 1, 10');
  }
});

test('servidor recusa corpo inválido com code', () => {
  const base = buildAdminOrderRequest(screen());
  const code = (b: unknown) => { const r = parseAdminOrderRequest(b); return r.ok ? null : (r as Fail).code; };
  assert.equal(code(null), 'invalid_body');
  assert.equal(code({ ...base, store_id: 'x' }), 'invalid_store');
  assert.equal(code({ ...base, customer: { ...base.customer, id: '' } }), 'customer_required');
  assert.equal(code({ ...base, customer: { ...base.customer, address: '  ' } }), 'address_required');
  assert.equal(code({ ...base, delivery_type: 'pickup', customer: { ...base.customer, address: null } }), null);
  assert.equal(code({ ...base, items: [] }), 'empty_order');
  assert.equal(code({ ...base, items: [{ ...base.items[0], quantity: 1.5 }] }), 'invalid_quantity');
  assert.equal(code({ ...base, items: [{ ...base.items[0], quantity: 0 }] }), 'invalid_quantity');
  assert.equal(code({ ...base, items: [{ ...base.items[0], addons: [{ id: BACON, quantity: 0 }] }] }), 'invalid_quantity');
  assert.equal(code({ ...base, delivery_fee: -1 }), 'invalid_delivery_fee');
  assert.equal(code({ ...base, payment_method: 'boleto' }), 'invalid_payment_method');
  assert.equal(code({ ...base, payment_status: 'refunded' }), 'invalid_payment_status');
  assert.equal(code({ ...base, source: 'ifood' }), 'invalid_source');
  assert.equal(code({ ...base, driver_id: 'abc' }), 'invalid_driver');
});

test('servidor: entregador descartado na retirada; adicionais repetidos somam', () => {
  const base = buildAdminOrderRequest(screen());
  const r = parseAdminOrderRequest({
    ...base, delivery_type: 'pickup', driver_id: DRIVER,
    items: [{ product_id: BURGER, quantity: 1, addons: [{ id: BACON, quantity: 1 }, { id: BACON, quantity: 2 }] }],
  });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.req.driver_id, null);
    assert.deepEqual(r.req.items[0].addons, [{ id: BACON, quantity: 3 }]);
  }
});

test('preço pelo catálogo ignora o preço da tela e aplica oferta/variação', () => {
  const items = [
    { product_id: BURGER, quantity: 2, notes: '', addons: [{ id: BACON, quantity: 2 }, { id: QUEIJO, quantity: 1 }] },
    { product_id: PIZZA, quantity: 1, addons: [] },
    { product_id: PIZZA, variant_id: GRANDE, quantity: 2 },
    { product_id: SODA, quantity: 3 },
  ];
  assert.deepEqual(catalogIds(items), { productIds: [BURGER, PIZZA, SODA], variantIds: [GRANDE], addonIds: [BACON, QUEIJO] });
  const r = priceAdminOrder(items, STORE, catalog());
  assert.ok(r.ok);
  if (!r.ok) return;
  const [burger, pizzaOffer, pizzaGrande, soda] = r.items;
  assert.deepEqual(burger, {
    product_id: BURGER, product_name: 'X-Burger', quantity: 2, unit_price: 30, subtotal: 84, notes: '',
    addons: [
      { addon_id: BACON, addon_name: 'Bacon', quantity: 2, unit_price: 4.5, subtotal: 9 },
      { addon_id: QUEIJO, addon_name: 'Queijo', quantity: 1, unit_price: 3, subtotal: 3 },
    ],
  });
  assert.equal(pizzaOffer.unit_price, 35);
  assert.equal(pizzaOffer.notes, null);
  assert.equal(pizzaGrande.unit_price, 55.9);
  assert.equal(pizzaGrande.subtotal, 111.8);
  assert.equal(pizzaGrande.product_name, 'Pizza Calabresa (Grande)');
  assert.equal(soda.unit_price, 8);
  assert.equal(r.subtotal, 84 + 35 + 111.8 + 24);
});

test('catálogo recusa produto, variação e adicional fora da loja, indisponíveis ou não ligados', () => {
  const code = (items: Parameters<typeof priceAdminOrder>[0], c = catalog()) => {
    const r = priceAdminOrder(items, STORE, c); return r.ok ? null : (r as Fail).code;
  };
  assert.equal(code([{ product_id: 'aaaaaaaa-0000-4000-8000-00000000ffff', quantity: 1 }]), 'product_unavailable');
  const other = catalog({ products: catalog().products.map(p => (p.id === BURGER ? { ...p, store_id: OTHER } : p)) });
  assert.equal(code([{ product_id: BURGER, quantity: 1 }], other), 'product_unavailable');
  const off = catalog({ products: catalog().products.map(p => (p.id === BURGER ? { ...p, is_available: false } : p)) });
  assert.equal(code([{ product_id: BURGER, quantity: 1 }], off), 'product_unavailable');
  assert.equal(code([{ product_id: BURGER, variant_id: GRANDE, quantity: 1 }]), 'variant_unavailable');
  const varOff = catalog({ variants: [{ id: GRANDE, product_id: PIZZA, name: 'Grande', price: 55.9, is_available: false }] });
  assert.equal(code([{ product_id: PIZZA, variant_id: GRANDE, quantity: 1 }], varOff), 'variant_unavailable');
  assert.equal(code([{ product_id: PIZZA, quantity: 1, addons: [{ id: BACON, quantity: 1 }] }]), 'addon_unavailable');
  const addonOther = catalog({ addons: [{ id: BACON, store_id: OTHER, name: 'Bacon', price: 0.01, is_available: true }] });
  assert.equal(code([{ product_id: BURGER, quantity: 1, addons: [{ id: BACON, quantity: 1 }] }], addonOther), 'addon_unavailable');
  const r = priceAdminOrder([{ product_id: BURGER, quantity: 1 }], STORE, off);
  assert.ok(!r.ok);
  assert.equal((r as Fail).status, 409);
  assert.match((r as Fail).error, /não está mais disponível/);
});
