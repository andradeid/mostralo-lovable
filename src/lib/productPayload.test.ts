/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  addonCategoryIdsOf,
  buildProductAddonRows,
  buildProductPayload,
  buildVariantRows,
  buildVariantPayload,
  descriptionHasHtml,
  productFormValuesFromRow,
  variantsFromRows,
  type ProductFormData,
  type ProductVariant,
} from './productPayload.ts';

// ---- Referência: trechos copiados do ProductForm.tsx ANTES da componentização (commit da1ba65) ----
// deno-lint-ignore no-explicit-any
const ref = {
  productData: (data: ProductFormData, store: { id: string }) => ({
    name: data.name,
    description: data.description || null,
    price: data.price,
    category_id: data.category_id,
    is_available: data.is_available,
    is_featured: data.is_featured || false,
    display_order: data.display_order,
    image_url: data.image_url || null,
    button_text: data.button_text || 'Comprar',
    image_gallery: data.image_gallery || [],
    store_id: store.id,
    is_on_offer: data.is_on_offer || false,
    original_price: data.is_on_offer ? data.price : null,
    offer_price: data.is_on_offer ? data.offer_price : null,
    track_stock: data.track_stock || false,
    stock_quantity: data.track_stock ? data.stock_quantity : null,
    stock_alert_threshold: data.track_stock ? (data.stock_alert_threshold ?? 5) : 5
  }),
  variantData: (variants: ProductVariant[], finalProductId: string) => variants.map((variant, index) => ({
    product_id: finalProductId,
    name: variant.name,
    price: variant.price,
    is_default: variant.is_default,
    display_order: index,
    is_available: true
  })),
  productAddonData: (addonsData: { id: string }[], finalProductId: string) => addonsData.map(addon => ({
    product_id: finalProductId,
    addon_id: addon.id,
    is_required: false,
    max_quantity: 1
  })),
  // deno-lint-ignore no-explicit-any
  reset: (data: any) => {
    const desc = data.description || '';
    return {
      name: data.name,
      description: desc,
      price: Number(data.price),
      category_id: data.category_id || '',
      is_available: data.is_available,
      is_featured: data.is_featured || false,
      display_order: data.display_order,
      image_url: data.image_url || '',
      button_text: data.button_text || 'Comprar',
      image_gallery: data.image_gallery || [],
      is_on_offer: data.is_on_offer || false,
      original_price: Number(data.original_price) || 0,
      offer_price: Number(data.offer_price) || 0,
      track_stock: data.track_stock || false,
      stock_quantity: data.stock_quantity ?? null,
      stock_alert_threshold: data.stock_alert_threshold ?? 5
    };
  },
};
// ---------------------------------------------------------------------------------------------------

const base = (o: Partial<ProductFormData> = {}): ProductFormData => ({
  name: 'Pizza', description: '', price: 50, category_id: 'c1', is_available: true, is_featured: false,
  display_order: 0, image_url: '', button_text: 'Comprar', image_gallery: [], is_on_offer: false,
  original_price: 0, offer_price: 0, track_stock: false, stock_quantity: null, stock_alert_threshold: 5,
  ...o,
});

const cenarios: [string, ProductFormData][] = [
  ['produto simples (campos vazios viram null)', base()],
  ['em oferta com estoque controlado', base({ is_on_offer: true, offer_price: 39.9, track_stock: true, stock_quantity: 12, stock_alert_threshold: 3, description: '<p>x</p>', image_url: 'https://x/a.jpg', image_gallery: ['g1', 'g2'], is_featured: true })],
  ['oferta desligada guarda null nos preços de oferta e estoque sem controle volta ao alerta 5', base({ is_on_offer: false, offer_price: 20, track_stock: false, stock_quantity: 7, stock_alert_threshold: 1 })],
  ['estoque controlado sem alerta usa 5; botão vazio vira Comprar', base({ track_stock: true, stock_quantity: 0, stock_alert_threshold: undefined, button_text: '' })],
];

for (const [nome, dados] of cenarios) {
  test(`registro do produto igual ao original: ${nome}`, () => {
    assert.deepEqual(buildProductPayload(dados, 's1'), ref.productData(dados, { id: 's1' }));
  });
}

test('variações: ordem da tela vira display_order e todas disponíveis (igual ao original)', () => {
  const v: ProductVariant[] = [{ name: 'P', price: 10, is_default: true }, { id: 'x', name: 'G', price: 15, is_default: false }];
  assert.deepEqual(buildVariantRows(v, 'p1'), ref.variantData(v, 'p1'));
  assert.equal(buildVariantRows(v, 'p1')[1].display_order, 1);
});

test('adicionais: um registro por adicional das categorias marcadas (igual ao original)', () => {
  const a = [{ id: 'a1' }, { id: 'a2' }];
  assert.deepEqual(buildProductAddonRows(a, 'p1'), ref.productAddonData(a, 'p1'));
});

test('tela de editar recebe os mesmos valores do original (números e vazios)', () => {
  const rows = [
    { name: 'X', description: null, price: '12.50', category_id: null, is_available: false, is_featured: null, display_order: 3, image_url: null, button_text: null, image_gallery: null, is_on_offer: null, original_price: null, offer_price: '9.90', track_stock: null, stock_quantity: undefined, stock_alert_threshold: null },
    { name: 'Y', description: '<b>a</b>', price: 5, category_id: 'c', is_available: true, is_featured: true, display_order: 0, image_url: 'u', button_text: 'Pedir', image_gallery: ['1'], is_on_offer: true, original_price: 5, offer_price: 4, track_stock: true, stock_quantity: 0, stock_alert_threshold: 2 },
  ];
  for (const r of rows) assert.deepEqual(productFormValuesFromRow(r), ref.reset(r));
});

test('descrição com HTML abre no editor com formatação', () => {
  assert.equal(descriptionHasHtml('<p>oi</p>'), true);
  assert.equal(descriptionHasHtml('preço < 10 e > 5'), false);
});

test('variações salvas viram estado da tela com preço numérico', () => {
  assert.deepEqual(variantsFromRows([{ id: 'v', name: 'M', price: '7.5', is_default: true, extra: 1 }]), [{ id: 'v', name: 'M', price: 7.5, is_default: true }]);
});

test('categorias de adicionais sem repetição e sem vazios', () => {
  assert.deepEqual(addonCategoryIdsOf([{ category_id: 'a' }, { category_id: null }, { category_id: 'a' }, { category_id: 'b' }]), ['a', 'b']);
});

test('variações enviadas à função do banco mantêm o id das existentes e a ordem da tela', () => {
  const v = [
    { id: 'v1', name: 'Pequena', price: 10, is_default: true },
    { name: 'Grande', price: 15, is_default: false },
  ];
  assert.deepEqual(buildVariantPayload(v), [
    { id: 'v1', name: 'Pequena', price: 10, is_default: true },
    { id: null, name: 'Grande', price: 15, is_default: false },
  ]);
});
