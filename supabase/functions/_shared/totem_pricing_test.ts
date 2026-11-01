import { deepStrictEqual as assertEquals } from "node:assert";
import { priceTotemCart } from "./totem-pricing.ts";

const S = "store-1";
const products = [
  { id: "p1", store_id: S, name: "X-Burger", price: 25.9, is_available: true },
  { id: "p2", store_id: S, name: "Refri", price: 6, is_available: true },
  { id: "p3", store_id: S, name: "Fora", price: 10, is_available: false },
  { id: "p4", store_id: "outra", name: "De outra loja", price: 1, is_available: true },
];
const addons = [
  { id: "a1", store_id: S, name: "Bacon", price: 4.5 },
  { id: "a2", store_id: "outra", name: "Barato", price: 0.01 },
];

Deno.test("total pelo catálogo: produto + adicionais x quantidade", () => {
  const r = priceTotemCart([{ product_id: "p1", quantity: 2, addon_ids: ["a1"] }, { product_id: "p2", quantity: 1 }], S, products, addons);
  assertEquals(r.ok, true);
  if (r.ok) {
    assertEquals(r.total, 66.8); // (25,90 + 4,50) x 2 + 6,00
    assertEquals(r.lines[0].unit_price, 30.4);
    assertEquals(r.lines[0].subtotal, 60.8);
  }
});

Deno.test("recusa produto indisponível, de outra loja e adicional de outra loja", () => {
  assertEquals(priceTotemCart([{ product_id: "p3", quantity: 1 }], S, products, addons).ok, false);
  assertEquals(priceTotemCart([{ product_id: "p4", quantity: 1 }], S, products, addons).ok, false);
  assertEquals(priceTotemCart([{ product_id: "p1", quantity: 1, addon_ids: ["a2"] }], S, products, addons).ok, false);
});

Deno.test("recusa quantidade inválida", () => {
  for (const q of [0, -1, 1.5, 100]) {
    assertEquals(priceTotemCart([{ product_id: "p1", quantity: q }], S, products, addons).ok, false);
  }
});
