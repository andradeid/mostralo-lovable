import { deepStrictEqual as assertEquals, ok as assert } from "node:assert";
import {
  buildNfcePayload, buildNfePayload, buildRef, cancelCheck, cfopForDestination, interpretFocusResponse,
  mapFocusStatus, parseFocusDocument, paymentCode, presenceForOrder, resolveFocusToken, saleFromComanda,
  saleFromOrder, secretMatches, HOMOLOG_FIRST_ITEM, HOMOLOG_RECIPIENT_NAME, type FiscalSettings,
} from "./focus-nfe.ts";
import { allocate, classifyDocument, decimal, isValidGtin, isoWithOffset } from "./fiscal-doc.ts";

const settings = (o: Partial<FiscalSettings> = {}): FiscalSettings => ({
  environment: "producao", nfce_enabled: true, nfe_enabled: true,
  cnpj: "11.222.333/0001-81", inscricao_estadual: "0734567890012", regime_tributario: 1, uf: "DF",
  default_ncm: "21069090", default_cfop: "5102", default_icms_origem: 0, default_icms_situacao: "102",
  default_pis_cst: "49", default_cofins_cst: "49", default_unidade: "UN", pix_payment_code: "17",
  ...o,
});
const now = new Date("2026-11-03T15:00:00Z");
const CPF = "529.982.247-25";
const CNPJ = "11.444.777/0001-61";

const comanda = { discount: 3, service_fee: 2, payment_method: "dinheiro", payment_details: { received_amount: 50, change: 19 } };
const comandaItems = [
  { product_id: "p1", product_name: "X-Burger", quantity: 2, total_price: 25 },
  { product_id: "p2", product_name: "Refri", quantity: 1, total_price: 7 },
];
const products = { p1: { barcode: "7891000315507", fiscal: { ncm: "16025000" } }, p2: { barcode: "123", fiscal: null } };

Deno.test("comanda vira venda: desconto, taxa de serviço e troco no dinheiro", () => {
  const sale = saleFromComanda(comanda, comandaItems, products);
  assertEquals(sale.discount, 3);
  assertEquals(sale.other, 2);
  assertEquals(sale.payments, [{ method: "dinheiro", amount: 50, change: 19 }]); // total 31 (32 - 3 + 2) + troco 19
});

Deno.test("NFC-e: itens, rateio do desconto, troco e códigos de pagamento", () => {
  const sale = saleFromComanda(comanda, comandaItems, products);
  const r = buildNfcePayload(sale, settings(), { document: CPF }, { now, timeZone: "America/Sao_Paulo" });
  assert(r.ok, JSON.stringify(!r.ok && r.errors));
  if (!r.ok) return;
  const p = r.payload as Record<string, any>;
  assertEquals(p.cnpj_emitente, "11222333000181");
  assertEquals(p.data_emissao, "2026-11-03T12:00:00-03:00");
  assertEquals(p.cpf_destinatario, "52998224725");
  assertEquals(p.items[0].codigo_ncm, "16025000");
  assertEquals(p.items[1].codigo_ncm, "21069090"); // padrão da loja
  assertEquals(p.items[0].valor_unitario_comercial, "12.50");
  assertEquals(p.items[0].codigo_barras_comercial, "7891000315507");
  assertEquals(p.items[1].codigo_barras_comercial, undefined); // "123" não é GTIN
  // desconto 3,00 rateado 25/32 e 7/32 (soma exata)
  assertEquals(Number(p.items[0].valor_desconto) + Number(p.items[1].valor_desconto), 3);
  assertEquals(Number(p.items[0].valor_outras_despesas) + Number(p.items[1].valor_outras_despesas), 2);
  assertEquals(p.formas_pagamento, [{ forma_pagamento: "01", valor_pagamento: "50.00", troco: "19.00" }]);
  assertEquals(r.total, 31);
});

Deno.test("NFC-e: homologação troca nome e 1º item pelos textos da SEFAZ", () => {
  const sale = saleFromComanda({ ...comanda, discount: 0, service_fee: 0, payment_method: "pix" }, comandaItems, products);
  const r = buildNfcePayload(sale, settings({ environment: "homologacao" }), { document: CPF, name: "Fulano" }, { now });
  assert(r.ok);
  if (!r.ok) return;
  const p = r.payload as Record<string, any>;
  assertEquals(p.items[0].descricao, HOMOLOG_FIRST_ITEM);
  assertEquals(p.items[1].descricao, "Refri");
  assertEquals(p.nome_destinatario, HOMOLOG_RECIPIENT_NAME);
  assertEquals(p.formas_pagamento[0].forma_pagamento, "17");
});

Deno.test("NFC-e: recusa CNPJ, produto sem NCM, loja sem CNPJ e CSOSN fora do Simples", () => {
  const sale = saleFromComanda({ payment_method: "credito" }, comandaItems, { p1: {}, p2: {} });
  const r = buildNfcePayload(sale, settings({ cnpj: null, default_ncm: null, regime_tributario: 3 }), { document: CNPJ }, { now });
  assertEquals(r.ok, false);
  if (r.ok) return;
  const all = r.errors.join("\n");
  assert(all.includes("CNPJ desde 05/01/2026"));
  assert(all.includes("CNPJ válido da loja"));
  assert(all.includes('"X-Burger" está sem NCM'));
  assert(all.includes("Regime Normal"));
});

Deno.test("NFC-e sem identificação e cupom sem CPF passam", () => {
  const sale = saleFromComanda({ payment_method: "debito" }, comandaItems, products);
  const r = buildNfcePayload(sale, settings(), { document: "" }, { now });
  assert(r.ok);
  if (!r.ok) return;
  assertEquals((r.payload as any).cpf_destinatario, undefined);
  assertEquals((r.payload as any).formas_pagamento[0], { forma_pagamento: "04", valor_pagamento: "32.00", tipo_integracao: "2" });
});

Deno.test("NF-e de pedido: frete rateado, interestadual vira CFOP 6xxx e CNPJ contribuinte", () => {
  const sale = saleFromOrder(
    { delivery_fee: 8, promotion_discount: 5, payment_method: "card", payment_details: { card_type: "credit" } },
    [{ product_id: "p1", product_name: "X-Burger", quantity: 2, subtotal: 50 }],
    products,
  );
  const r = buildNfePayload(sale, settings(), {
    document: CNPJ, name: "Empresa Cliente LTDA", ie_indicator: "1", inscricao_estadual: "123456789",
    logradouro: "Rua A", numero: "10", bairro: "Centro", municipio: "Goiânia", uf: "GO", cep: "74000-000",
  }, { now, presence: presenceForOrder("whatsapp_chat") });
  assert(r.ok, JSON.stringify(!r.ok && r.errors));
  if (!r.ok) return;
  const p = r.payload as Record<string, any>;
  assertEquals(p.local_destino, "2");
  assertEquals(p.items[0].cfop, "6102");
  assertEquals(p.consumidor_final, "0");
  assertEquals(p.cnpj_destinatario, "11444777000161");
  assertEquals(p.modalidade_frete, "0");
  assertEquals(p.items[0].valor_frete, "8.00");
  assertEquals(p.items[0].valor_desconto, "5.00");
  assertEquals(p.presenca_comprador, "3");
  assertEquals(p.formas_pagamento[0].valor_pagamento, "53.00");
});

Deno.test("NF-e: destinatário incompleto dá erros claros", () => {
  const sale = saleFromOrder({ payment_method: "pix" }, [{ product_id: "p1", product_name: "X", quantity: 1, subtotal: 10 }], products);
  const r = buildNfePayload(sale, settings(), { document: "123", name: "A", logradouro: "", numero: "", bairro: "", municipio: "", uf: "XX" }, { now });
  assertEquals(r.ok, false);
  if (r.ok) return;
  assert(r.errors.some((e) => e.includes("CPF/CNPJ do destinatário inválido")));
  assert(r.errors.some((e) => e.includes("estado (UF) do destinatário")));
});

Deno.test("status da Focus e resposta", () => {
  assertEquals(mapFocusStatus("autorizado"), "autorizado");
  assertEquals(mapFocusStatus("erro_autorizacao"), "erro");
  assertEquals(mapFocusStatus("processando_autorizacao"), "processando");
  const ok = interpretFocusResponse(201, { status: "autorizado", chave_nfe: "NFe5326", numero: "12", caminho_xml_nota_fiscal: "/arquivos/x.xml" }, "nfce", "producao");
  assertEquals(ok.kind, "document");
  if (ok.kind === "document") {
    assertEquals(ok.doc.chave, "5326");
    assertEquals(ok.doc.danfe_url, "https://api.focusnfe.com.br/notas_fiscais_consumidor/NFe5326.html");
    assertEquals(ok.doc.xml_url, "https://api.focusnfe.com.br/arquivos/x.xml");
  }
  const queued = interpretFocusResponse(202, { cnpj_emitente: "1" }, "nfe", "homologacao");
  assertEquals(queued.kind === "document" && queued.doc.status, "processando");
  const rejected = parseFocusDocument({ status: "erro_autorizacao", mensagem_sefaz: "Rejeicao: NCM inexistente" }, "nfce", "producao");
  assertEquals(rejected.error_message, "Rejeicao: NCM inexistente");
  assertEquals(interpretFocusResponse(422, { codigo: "already_processed", mensagem: "x" }, "nfe", "producao").kind, "already_used");
  assertEquals(interpretFocusResponse(422, { mensagem: "Referência já utilizada" }, "nfe", "producao").kind, "already_used");
  const rate = interpretFocusResponse(429, {}, "nfe", "producao");
  assertEquals(rate.kind === "error" && rate.retryable, true);
});

Deno.test("ref, token, cancelamento e segredo", () => {
  assertEquals(buildRef("nfce", "producao", "0b6f-AA", 2), "nfcep0b6faav2");
  assertEquals(resolveFocusToken("producao", { focus_token_producao: " tp " }, { global: "g" }), "tp");
  assertEquals(resolveFocusToken("homologacao", null, { global: "g", homologacao: "h" }), "h");
  assertEquals(resolveFocusToken("producao", {}, { global: "" }), null);
  const doc = { doc_type: "nfce" as const, status: "autorizado" as const, authorized_at: "2026-11-03T14:40:00Z" };
  assertEquals(cancelCheck(doc, "curto", now).ok, false);
  assertEquals(cancelCheck(doc, "Cliente desistiu da compra", now).ok, true);
  assertEquals(cancelCheck({ ...doc, authorized_at: "2026-11-03T14:00:00Z" }, "Cliente desistiu da compra", now).ok, false);
  assertEquals(secretMatches("abc", "abc"), true);
  assertEquals(secretMatches("abd", "abc"), false);
  assertEquals(secretMatches("", ""), false);
});

Deno.test("helpers: rateio, decimais, documentos, GTIN, fuso, CFOP e pagamento", () => {
  assertEquals(allocate(1, [1, 1, 1]), [0.33, 0.33, 0.34]);
  assertEquals(allocate(0, [5, 5]), [0, 0]);
  assertEquals(decimal(12.5, 10, 2), "12.50");
  assertEquals(decimal(1 / 3, 10, 2), "0.3333333333");
  assertEquals(decimal(2, 4), "2");
  assertEquals(classifyDocument(CPF), "cpf");
  assertEquals(classifyDocument(CNPJ), "cnpj");
  assertEquals(classifyDocument("111.111.111-11"), "invalid");
  assertEquals(isValidGtin("7891000315507"), true);
  assertEquals(isValidGtin("7891000315508"), false);
  assertEquals(isoWithOffset(now, "America/Manaus"), "2026-11-03T11:00:00-04:00");
  assertEquals(cfopForDestination("5405", true), "6405");
  assertEquals(cfopForDestination("5102", false), "5102");
  assertEquals(paymentCode("pix", "20").code, "20");
  assertEquals(paymentCode("outros").description, "Outros");
});

Deno.test("webhook/consulta fora de ordem não rebaixam o status", async () => {
  const { shouldApplyStatus, documentPatch } = await import("./focus-nfe.ts");
  assertEquals(shouldApplyStatus("autorizado", "processando"), false);
  assertEquals(shouldApplyStatus("cancelado", "autorizado"), false);
  assertEquals(shouldApplyStatus("processando", "autorizado"), true);
  assertEquals(shouldApplyStatus("erro", "processando"), false);
  assertEquals(shouldApplyStatus("autorizado", "cancelado"), true);
  const parsed = parseFocusDocument({ status: "autorizado", numero: "5" }, "nfe", "producao");
  const patch = documentPatch({ status: "processando", authorized_at: null }, parsed, { status: "autorizado" }, now);
  assertEquals(patch?.status, "autorizado");
  assertEquals(patch?.numero, "5");
  assertEquals(patch?.authorized_at, now.toISOString());
  assertEquals("chave" in (patch ?? {}), false); // não apaga a chave que já tinha
  assertEquals(documentPatch({ status: "cancelado" }, parsed, {}, now), null);
});

Deno.test("pedido de emissão do painel", async () => {
  const { parseEmitRequest } = await import("./focus-nfe.ts");
  const id = "0b6f1c2e-1111-4222-8333-444455556666";
  assertEquals(parseEmitRequest({ store_id: id, tipo: "nfce", comanda_id: id }).ok, true);
  assertEquals(parseEmitRequest({ store_id: id, tipo: "nfce" }).ok, false);
  assertEquals(parseEmitRequest({ store_id: id, tipo: "nfce", comanda_id: id, order_id: id }).ok, false);
  assertEquals(parseEmitRequest({ store_id: id, tipo: "nfe", order_id: id }).ok, false); // sem destinatário
  assertEquals(parseEmitRequest({ store_id: "x", tipo: "nfce", comanda_id: id }).ok, false);
});
