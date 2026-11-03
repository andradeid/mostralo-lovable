// Módulo fiscal (Focus NFe): regras puras, sem fetch. Usado pelas funções fiscal-* e pelos testes.
// - Normaliza a venda (comanda do PDV ou pedido) em FiscalSale.
// - Monta o JSON da NFC-e (modelo 65, síncrona) e da NF-e (modelo 55, assíncrona).
// - Interpreta a resposta da Focus e traduz para o nosso status.
// Pesquisa da API: mostralo-docs/focus-nfe-api.md. Tudo que é suposição está marcado com
// "CONFERIR NA FOCUS:" e deve ser validado em homologação antes de ligar produção.
import {
  allocate, classifyDocument, decimal, isValidCnpj, isValidCpf, isValidGtin, isValidUf, isoWithOffset,
  money, onlyDigits, round2,
} from "./fiscal-doc.ts";

export type FiscalEnvironment = "homologacao" | "producao";
export type FiscalDocType = "nfce" | "nfe";
export type FiscalStatus = "processando" | "autorizado" | "erro" | "cancelado" | "denegado";

export const FOCUS_BASE_URL: Record<FiscalEnvironment, string> = {
  homologacao: "https://homologacao.focusnfe.com.br",
  producao: "https://api.focusnfe.com.br",
};
export const focusBaseUrl = (env: FiscalEnvironment) => FOCUS_BASE_URL[env] ?? FOCUS_BASE_URL.homologacao;

/** Textos que a SEFAZ exige em homologação (exemplos oficiais da Focus). */
export const HOMOLOG_RECIPIENT_NAME = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL";
export const HOMOLOG_FIRST_ITEM = "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL";

// ── Entradas ──
export interface FiscalSettings {
  environment: FiscalEnvironment;
  nfce_enabled: boolean;
  nfe_enabled: boolean;
  cnpj: string | null;
  inscricao_estadual: string | null;
  regime_tributario: number; // 1 Simples, 2 Simples excesso, 3 Normal, 4 MEI
  uf: string | null;
  nfce_natureza_operacao?: string | null;
  nfe_natureza_operacao?: string | null;
  default_ncm?: string | null;
  default_cfop?: string | null;
  default_icms_origem?: number | null;
  default_icms_situacao?: string | null;
  default_pis_cst?: string | null;
  default_cofins_cst?: string | null;
  default_unidade?: string | null;
  pix_payment_code?: string | null; // '17' dinâmico | '20' estático
  include_service_fee?: boolean | null;
}

export interface ProductFiscal {
  ncm?: string | null;
  cfop?: string | null;
  cest?: string | null;
  icms_origem?: number | null;
  icms_situacao?: string | null;
  pis_cst?: string | null;
  cofins_cst?: string | null;
  unidade?: string | null;
}

export interface SaleItem {
  product_id: string | null;
  name: string;
  quantity: number;
  /** Valor do item já com adicionais (quantidade × unitário), antes de desconto. */
  total: number;
  barcode?: string | null;
  fiscal?: ProductFiscal | null;
}

export type SalePaymentMethod = "dinheiro" | "credito" | "debito" | "pix" | "cartao" | "outros";
export interface SalePayment {
  method: SalePaymentMethod;
  /** Valor recebido nesta forma (no dinheiro pode ser maior que o total: a diferença é o troco). */
  amount: number;
  change?: number;
}

export interface FiscalSale {
  items: SaleItem[];
  discount: number; // rateado nos itens (valor_desconto)
  other: number;    // taxa de serviço → valor_outras_despesas
  freight: number;  // taxa de entrega → valor_frete
  payments: SalePayment[];
}

export interface ProductLookup {
  barcode?: string | null;
  fiscal?: ProductFiscal | null;
}

// ── Normalização: comanda do PDV e pedido ──
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function paymentFromComanda(method: string | null | undefined, details: Record<string, unknown> | null | undefined, total: number): SalePayment {
  const m = String(method ?? "").toLowerCase();
  const known: SalePaymentMethod[] = ["dinheiro", "credito", "debito", "pix", "outros"];
  const pm = (known as string[]).includes(m) ? (m as SalePaymentMethod) : "outros";
  if (pm === "dinheiro") {
    const received = num(details?.received_amount);
    if (received > total) return { method: pm, amount: round2(received), change: round2(received - total) };
  }
  return { method: pm, amount: round2(total) };
}

export function paymentFromOrder(method: string | null | undefined, details: Record<string, unknown> | null | undefined, total: number): SalePayment {
  const m = String(method ?? "");
  if (m === "cash") {
    // "Troco para R$ X" (mesmas chaves que o recibo térmico lê)
    const changeFor = num(details?.change_for ?? details?.troco ?? details?.changeFor);
    const change = changeFor > total ? round2(changeFor - total) : 0;
    return change > 0 ? { method: "dinheiro", amount: round2(total + change), change } : { method: "dinheiro", amount: round2(total) };
  }
  if (m === "pix") return { method: "pix", amount: round2(total) };
  if (m === "card") {
    const t = String(details?.card_type ?? "");
    return { method: t === "credit" ? "credito" : t === "debit" ? "debito" : "cartao", amount: round2(total) };
  }
  return { method: "outros", amount: round2(total) };
}

export interface ComandaLike {
  discount?: number | string | null;
  service_fee?: number | string | null;
  total?: number | string | null;
  payment_method?: string | null;
  payment_details?: Record<string, unknown> | null;
}
export interface ComandaItemLike {
  product_id: string | null;
  product_name: string;
  quantity: number | string;
  total_price: number | string;
}

export function saleFromComanda(
  comanda: ComandaLike, items: ComandaItemLike[], products: Record<string, ProductLookup>, includeServiceFee = true,
): FiscalSale {
  const saleItems = items.map((it) => ({
    product_id: it.product_id,
    name: it.product_name,
    quantity: num(it.quantity),
    total: round2(num(it.total_price)),
    barcode: it.product_id ? products[it.product_id]?.barcode ?? null : null,
    fiscal: it.product_id ? products[it.product_id]?.fiscal ?? null : null,
  }));
  const gross = saleItems.reduce((s, i) => s + i.total, 0);
  const discount = round2(num(comanda.discount));
  const other = includeServiceFee ? round2(num(comanda.service_fee)) : 0;
  const total = round2(gross - discount + other);
  return {
    items: saleItems,
    discount,
    other,
    freight: 0,
    payments: [paymentFromComanda(comanda.payment_method, comanda.payment_details, total)],
  };
}

export interface OrderLike {
  delivery_fee?: number | string | null;
  promotion_discount?: number | string | null;
  payment_method?: string | null;
  payment_details?: Record<string, unknown> | null;
}
export interface OrderItemLike {
  product_id: string | null;
  product_name: string;
  quantity: number | string;
  subtotal: number | string;
}

export function saleFromOrder(order: OrderLike, items: OrderItemLike[], products: Record<string, ProductLookup>): FiscalSale {
  const saleItems = items.map((it) => ({
    product_id: it.product_id,
    name: it.product_name,
    quantity: num(it.quantity),
    total: round2(num(it.subtotal)),
    barcode: it.product_id ? products[it.product_id]?.barcode ?? null : null,
    fiscal: it.product_id ? products[it.product_id]?.fiscal ?? null : null,
  }));
  const gross = saleItems.reduce((s, i) => s + i.total, 0);
  const discount = round2(num(order.promotion_discount));
  const freight = round2(num(order.delivery_fee));
  const total = round2(gross - discount + freight);
  return {
    items: saleItems,
    discount,
    other: 0,
    freight,
    payments: [paymentFromOrder(order.payment_method, order.payment_details, total)],
  };
}

export const saleTotal = (sale: FiscalSale) =>
  round2(sale.items.reduce((s, i) => s + i.total, 0) - sale.discount + sale.other + sale.freight);

// ── Pagamento (tPag) ──
// Códigos da tabela FormaPagamentoXML. Os exemplos oficiais mandam sem zero à esquerda ("1", "4");
// a referência de campos lista "01", "04". CONFERIR NA FOCUS: qual formato a homologação aceita.
export function paymentCode(method: SalePaymentMethod, pixCode = "17"): { code: string; description?: string } {
  switch (method) {
    case "dinheiro": return { code: "01" };
    case "credito": return { code: "03" };
    case "debito": return { code: "04" };
    case "pix": return { code: pixCode === "20" ? "20" : "17" };
    case "cartao": return { code: "99", description: "Cartao" };
    default: return { code: "99", description: "Outros" };
  }
}

function buildPayments(sale: FiscalSale, pixCode: string) {
  return sale.payments.map((p) => {
    const { code, description } = paymentCode(p.method, pixCode);
    const out: Record<string, string> = { forma_pagamento: code, valor_pagamento: money(p.amount) };
    if (description) out.descricao_pagamento = description;
    // CONFERIR NA FOCUS: grupo de cartão/PIX. Mandamos "2" (POS, não integrado), que dispensa
    // CNPJ da credenciadora e autorização; alguns estados exigem esse grupo para 03/04/17.
    if (["03", "04", "17"].includes(code)) out.tipo_integracao = "2";
    // CONFERIR NA FOCUS: "troco" só aparece no exemplo oficial em Python, dentro do pagamento.
    if (p.change && p.change > 0) out.troco = money(p.change);
    return out;
  });
}

// ── Itens ──
const CSOSN_SUPPORTED = ["102", "103", "300", "400", "500"];
const CST_SUPPORTED = ["40", "41", "50", "60"];
const CSOSN_NEEDS_CEST = ["500", "201", "202", "203"];
const CST_NEEDS_CEST = ["10", "30", "60", "70"];
const PIS_COFINS_SUPPORTED = ["04", "05", "06", "07", "08", "09", "49", "99"];
const PIS_COFINS_OTHER = ["49", "99"]; // "outras operações": vai com base e alíquota zero

/** Venda para outro estado: CFOP 5xxx vira 6xxx. */
export function cfopForDestination(cfop: string, interstate: boolean): string {
  if (!interstate || !/^5\d{3}$/.test(cfop)) return cfop;
  return `6${cfop.slice(1)}`;
}

export interface ItemContext {
  settings: FiscalSettings;
  docType: FiscalDocType;
  interstate: boolean;
  homologacao: boolean;
}

export function buildItems(sale: FiscalSale, ctx: ItemContext): { items: Record<string, string>[]; errors: string[] } {
  const errors: string[] = [];
  const s = ctx.settings;
  const simples = s.regime_tributario !== 3;
  const weights = sale.items.map((i) => i.total);
  const discounts = allocate(sale.discount, weights);
  const others = allocate(sale.other, weights);
  const freights = allocate(sale.freight, weights);

  const items = sale.items.map((it, idx) => {
    const label = `"${it.name}"`;
    const f = it.fiscal ?? {};
    const ncm = onlyDigits(f.ncm || s.default_ncm || "");
    const cfopBase = onlyDigits(f.cfop || s.default_cfop || "");
    const origem = f.icms_origem ?? s.default_icms_origem ?? 0;
    const situacao = onlyDigits(f.icms_situacao || s.default_icms_situacao || "");
    const pis = onlyDigits(f.pis_cst || s.default_pis_cst || "");
    const cofins = onlyDigits(f.cofins_cst || s.default_cofins_cst || "");
    const unidade = String(f.unidade || s.default_unidade || "UN").trim().toUpperCase();
    const cest = onlyDigits(f.cest || "");

    if (!(it.quantity > 0)) errors.push(`O item ${label} está com quantidade zero.`);
    if (!(it.total > 0)) errors.push(`O item ${label} está sem valor. A nota não aceita item com valor zero.`);
    if (ncm.length !== 8) {
      errors.push(`O produto ${label} está sem NCM (8 dígitos). Preencha em Produtos › Dados fiscais ou um NCM padrão nas configurações fiscais.`);
    }
    if (!/^[56]\d{3}$/.test(cfopBase)) errors.push(`O produto ${label} está com CFOP inválido (use 4 dígitos de saída, ex.: 5102).`);
    if (!(Number.isInteger(origem) && origem >= 0 && origem <= 8)) errors.push(`O produto ${label} está com origem inválida (0 a 8).`);
    if (simples) {
      if (situacao.length !== 3) errors.push(`O produto ${label} precisa de CSOSN (3 dígitos) porque a loja é do Simples Nacional.`);
      else if (!CSOSN_SUPPORTED.includes(situacao)) {
        errors.push(`O CSOSN ${situacao} do produto ${label} ainda não é aceito pelo Mostralo (use 102, 103, 300, 400 ou 500).`);
      }
    } else if (situacao.length !== 2) {
      errors.push(`O produto ${label} precisa de CST de ICMS (2 dígitos) porque a loja é do Regime Normal.`);
    } else if (!CST_SUPPORTED.includes(situacao)) {
      errors.push(`O CST ${situacao} do produto ${label} ainda não é aceito pelo Mostralo (use 40, 41, 50 ou 60).`);
    }
    const needsCest = simples ? CSOSN_NEEDS_CEST.includes(situacao) : CST_NEEDS_CEST.includes(situacao);
    if (needsCest && cest.length !== 7) errors.push(`O produto ${label} tem substituição tributária e precisa do CEST (7 dígitos).`);
    if (cest && cest.length !== 7) errors.push(`O CEST do produto ${label} precisa ter 7 dígitos.`);
    for (const [name, cst] of [["PIS", pis], ["COFINS", cofins]] as const) {
      if (!cst) errors.push(`Falta o CST de ${name} do produto ${label} (peça ao contador; preencha no produto ou nas configurações fiscais).`);
      else if (!PIS_COFINS_SUPPORTED.includes(cst)) {
        errors.push(`O CST de ${name} ${cst} do produto ${label} ainda não é aceito pelo Mostralo (use 04 a 09, 49 ou 99).`);
      }
    }
    if (!unidade || unidade.length > 6) errors.push(`A unidade do produto ${label} precisa ter de 1 a 6 letras (ex.: UN, KG).`);

    const descricao = idx === 0 && ctx.homologacao && ctx.docType === "nfce"
      ? HOMOLOG_FIRST_ITEM
      : it.name.trim().slice(0, 120);
    const unit = it.quantity > 0 ? it.total / it.quantity : 0;
    const item: Record<string, string> = {
      numero_item: String(idx + 1),
      codigo_produto: (onlyDigits(it.barcode) || (it.product_id ?? `ITEM${idx + 1}`).replace(/-/g, "").slice(0, 12)).slice(0, 60),
      descricao,
      codigo_ncm: ncm,
      cfop: cfopForDestination(cfopBase, ctx.interstate),
      unidade_comercial: unidade,
      quantidade_comercial: decimal(it.quantity, 4),
      valor_unitario_comercial: decimal(unit, 10, 2),
      valor_bruto: money(it.total),
      icms_origem: String(origem),
      icms_situacao_tributaria: situacao,
      pis_situacao_tributaria: pis,
      cofins_situacao_tributaria: cofins,
    };
    if (PIS_COFINS_OTHER.includes(pis)) {
      // CONFERIR NA FOCUS: CST 49/99 (PISOutr) pede base e alíquota; mandamos zero (Simples não destaca).
      Object.assign(item, { pis_base_calculo: "0.00", pis_aliquota_porcentual: "0.00", pis_valor: "0.00" });
    }
    if (PIS_COFINS_OTHER.includes(cofins)) {
      Object.assign(item, { cofins_base_calculo: "0.00", cofins_aliquota_porcentual: "0.00", cofins_valor: "0.00" });
    }
    if (cest) item.cest = cest;
    if (isValidGtin(it.barcode)) item.codigo_barras_comercial = onlyDigits(it.barcode);
    if (discounts[idx] > 0) item.valor_desconto = money(discounts[idx]);
    // CONFERIR NA FOCUS: nomes valor_outras_despesas / valor_frete no item (campos do ItemNotaFiscalXML).
    if (others[idx] > 0) item.valor_outras_despesas = money(others[idx]);
    if (freights[idx] > 0) item.valor_frete = money(freights[idx]);
    return item;
  });
  return { items, errors };
}

// ── Emitente e venda ──
function emitterErrors(s: FiscalSettings, docType: FiscalDocType): string[] {
  const errors: string[] = [];
  if (docType === "nfce" && !s.nfce_enabled) errors.push("A NFC-e (cupom fiscal) não está habilitada nas configurações fiscais da loja.");
  if (docType === "nfe" && !s.nfe_enabled) errors.push("A NF-e não está habilitada nas configurações fiscais da loja.");
  if (!isValidCnpj(s.cnpj)) errors.push("Cadastre um CNPJ válido da loja nas configurações fiscais.");
  if (!onlyDigits(s.inscricao_estadual) && String(s.inscricao_estadual ?? "").trim().toUpperCase() !== "ISENTO") {
    errors.push("Informe a inscrição estadual da loja (no DF, o CF/DF) nas configurações fiscais.");
  }
  if (!isValidUf(s.uf)) errors.push("Informe o estado (UF) do endereço fiscal da loja.");
  if (![1, 2, 3, 4].includes(Number(s.regime_tributario))) errors.push("Escolha o regime tributário da loja.");
  return errors;
}

function saleErrors(sale: FiscalSale): string[] {
  const errors: string[] = [];
  if (!sale.items.length) errors.push("A venda não tem itens.");
  const gross = round2(sale.items.reduce((s, i) => s + i.total, 0));
  if (sale.discount < 0 || sale.discount >= gross) errors.push("O desconto precisa ser menor que o valor dos itens.");
  const total = saleTotal(sale);
  const paid = round2(sale.payments.reduce((s, p) => s + p.amount - (p.change ?? 0), 0));
  if (Math.abs(paid - total) > 0.01) errors.push("A soma dos pagamentos não bate com o total da venda.");
  return errors;
}

export interface BuildOptions {
  now: Date;
  timeZone?: string | null;
}

export type BuildResult =
  | { ok: true; payload: Record<string, unknown>; total: number; recipientDocument: string | null; recipientName: string | null }
  | { ok: false; errors: string[] };

export interface NfceRecipient {
  document?: string | null; // CPF (opcional)
  name?: string | null;
}

export function buildNfcePayload(sale: FiscalSale, s: FiscalSettings, recipient: NfceRecipient, opts: BuildOptions): BuildResult {
  const errors = [...emitterErrors(s, "nfce"), ...saleErrors(sale)];
  const kind = classifyDocument(recipient.document);
  if (kind === "cnpj") errors.push("Cupom fiscal (NFC-e) não pode ser emitido para CNPJ desde 05/01/2026. Para empresa, emita uma NF-e.");
  if (kind === "invalid") errors.push("CPF na nota inválido. Confira os 11 dígitos ou deixe em branco.");
  const homologacao = s.environment !== "producao";
  const built = buildItems(sale, { settings: s, docType: "nfce", interstate: false, homologacao });
  errors.push(...built.errors);
  if (errors.length) return { ok: false, errors: unique(errors) };

  const payload: Record<string, unknown> = {
    cnpj_emitente: onlyDigits(s.cnpj),
    data_emissao: isoWithOffset(opts.now, opts.timeZone || "America/Sao_Paulo"),
    natureza_operacao: (s.nfce_natureza_operacao || "VENDA AO CONSUMIDOR").slice(0, 60),
    tipo_documento: "1",
    finalidade_emissao: "1",
    presenca_comprador: "1",
    consumidor_final: "1",
    modalidade_frete: "9",
    local_destino: "1",
    regime_tributario_emitente: String(s.regime_tributario),
    items: built.items,
    formas_pagamento: buildPayments(sale, s.pix_payment_code || "17"),
  };
  let recipientDocument: string | null = null;
  let recipientName: string | null = null;
  if (kind === "cpf") {
    recipientDocument = onlyDigits(recipient.document);
    payload.cpf_destinatario = recipientDocument;
    const name = homologacao ? HOMOLOG_RECIPIENT_NAME : String(recipient.name ?? "").trim().slice(0, 60);
    if (name.length >= 2) {
      payload.nome_destinatario = name;
      recipientName = name;
    }
  }
  return { ok: true, payload, total: saleTotal(sale), recipientDocument, recipientName };
}

export interface NfeRecipient {
  document: string;
  name: string;
  /** 1 = contribuinte de ICMS; 2 = isento; 9 = não contribuinte (CPF é sempre 9) */
  ie_indicator?: "1" | "2" | "9" | null;
  inscricao_estadual?: string | null;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  municipio: string;
  uf: string;
  cep?: string | null;
  codigo_municipio?: string | null;
  email?: string | null;
}

export function recipientErrors(r: Partial<NfeRecipient> | null | undefined): string[] {
  const errors: string[] = [];
  if (!r) return ["Informe os dados do destinatário da NF-e."];
  const kind = classifyDocument(r.document);
  if (kind === "empty") errors.push("Informe o CPF ou CNPJ do destinatário.");
  if (kind === "invalid") errors.push("CPF/CNPJ do destinatário inválido.");
  const name = String(r.name ?? "").trim();
  if (name.length < 2 || name.length > 60) errors.push("O nome do destinatário precisa ter de 2 a 60 letras.");
  if (!String(r.logradouro ?? "").trim()) errors.push("Informe a rua do destinatário.");
  if (!String(r.numero ?? "").trim()) errors.push("Informe o número do endereço do destinatário (ou S/N).");
  if (!String(r.bairro ?? "").trim()) errors.push("Informe o bairro do destinatário.");
  if (!String(r.municipio ?? "").trim()) errors.push("Informe a cidade do destinatário.");
  if (!isValidUf(r.uf)) errors.push("Informe o estado (UF) do destinatário.");
  if (r.cep && onlyDigits(r.cep).length !== 8) errors.push("O CEP do destinatário precisa ter 8 dígitos.");
  if (kind === "cnpj" && r.ie_indicator === "1" && !onlyDigits(r.inscricao_estadual)) {
    errors.push("Destinatário contribuinte de ICMS: informe a inscrição estadual dele.");
  }
  return errors;
}

/** Presença do comprador na NF-e de pedido: loja online = 2 (internet), WhatsApp = 3 (teleatendimento). */
export function presenceForOrder(source: string | null | undefined, deliveryType?: string | null): string {
  const s = String(source ?? "").toLowerCase();
  if (s.includes("whatsapp")) return "3";
  if (["manual", "pdv", "totem", "balcao"].includes(s)) return deliveryType === "delivery" ? "9" : "1";
  return "2";
}

export function buildNfePayload(
  sale: FiscalSale, s: FiscalSettings, r: NfeRecipient, opts: BuildOptions & { presence?: string },
): BuildResult {
  const errors = [...emitterErrors(s, "nfe"), ...saleErrors(sale), ...recipientErrors(r)];
  const homologacao = s.environment !== "producao";
  const recipientUf = String(r?.uf ?? "").toUpperCase();
  const interstate = isValidUf(recipientUf) && isValidUf(s.uf) && recipientUf !== String(s.uf).toUpperCase();
  const built = buildItems(sale, { settings: s, docType: "nfe", interstate, homologacao });
  errors.push(...built.errors);
  if (errors.length) return { ok: false, errors: unique(errors) };

  const doc = onlyDigits(r.document);
  const isCnpj = doc.length === 14;
  const ieIndicator = isCnpj ? (r.ie_indicator || "9") : "9";
  const name = homologacao ? HOMOLOG_RECIPIENT_NAME : r.name.trim().slice(0, 60);
  const payload: Record<string, unknown> = {
    cnpj_emitente: onlyDigits(s.cnpj),
    data_emissao: isoWithOffset(opts.now, opts.timeZone || "America/Sao_Paulo"),
    natureza_operacao: (s.nfe_natureza_operacao || "Venda de mercadoria").slice(0, 60),
    tipo_documento: "1",
    finalidade_emissao: "1",
    local_destino: interstate ? "2" : "1",
    // Contribuinte de ICMS compra para revenda/insumo; os outros são consumidor final.
    // CONFERIR NA FOCUS: venda interestadual a consumidor final não contribuinte pode exigir DIFAL.
    consumidor_final: ieIndicator === "1" ? "0" : "1",
    presenca_comprador: opts.presence || "2",
    // CONFERIR NA FOCUS: com taxa de entrega usamos 0 (frete por conta do emitente, cobrado na nota).
    modalidade_frete: sale.freight > 0 ? "0" : "9",
    regime_tributario_emitente: String(s.regime_tributario),
    nome_destinatario: name,
    [isCnpj ? "cnpj_destinatario" : "cpf_destinatario"]: doc,
    indicador_inscricao_estadual_destinatario: ieIndicator,
    logradouro_destinatario: r.logradouro.trim().slice(0, 60),
    numero_destinatario: r.numero.trim().slice(0, 60),
    bairro_destinatario: r.bairro.trim().slice(0, 60),
    municipio_destinatario: r.municipio.trim().slice(0, 60),
    uf_destinatario: recipientUf,
    items: built.items,
    formas_pagamento: buildPayments(sale, s.pix_payment_code || "17"),
  };
  // CONFERIR NA FOCUS: nome do campo da IE do destinatário (não encontrado na pesquisa).
  if (ieIndicator === "1") payload.inscricao_estadual_destinatario = onlyDigits(r.inscricao_estadual);
  if (r.complemento?.trim()) payload.complemento_destinatario = r.complemento.trim().slice(0, 60);
  if (r.cep && onlyDigits(r.cep).length === 8) payload.cep_destinatario = onlyDigits(r.cep);
  if (r.codigo_municipio && onlyDigits(r.codigo_municipio).length === 7) payload.codigo_municipio_destinatario = onlyDigits(r.codigo_municipio);
  if (r.email?.trim()) payload.email_destinatario = r.email.trim();
  return { ok: true, payload, total: saleTotal(sale), recipientDocument: doc, recipientName: name };
}

const unique = (list: string[]) => [...new Set(list)];

// ── Pedido de emissão vindo do painel (fiscal-emit) ──
export interface EmitRequest {
  store_id: string;
  tipo: FiscalDocType;
  comanda_id: string | null;
  order_id: string | null;
  cpf_cnpj: string | null;
  nome: string | null;
  destinatario: NfeRecipient | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseEmitRequest(body: unknown): { ok: true; req: EmitRequest } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (!UUID_RE.test(String(b.store_id ?? ""))) return { ok: false, error: "Loja inválida." };
  const tipo = String(b.tipo ?? "");
  if (tipo !== "nfce" && tipo !== "nfe") return { ok: false, error: "Tipo de nota inválido (use nfce ou nfe)." };
  const comanda = b.comanda_id ? String(b.comanda_id) : null;
  const order = b.order_id ? String(b.order_id) : null;
  if ((comanda ? 1 : 0) + (order ? 1 : 0) !== 1) return { ok: false, error: "Informe a venda (comanda_id) ou o pedido (order_id)." };
  if ((comanda && !UUID_RE.test(comanda)) || (order && !UUID_RE.test(order))) return { ok: false, error: "Venda inválida." };
  const d = b.destinatario && typeof b.destinatario === "object" ? (b.destinatario as NfeRecipient) : null;
  if (tipo === "nfe" && !d) return { ok: false, error: "Informe os dados do destinatário da NF-e." };
  return {
    ok: true,
    req: {
      store_id: String(b.store_id), tipo, comanda_id: comanda, order_id: order,
      cpf_cnpj: b.cpf_cnpj ? String(b.cpf_cnpj) : null,
      nome: b.nome ? String(b.nome).slice(0, 60) : null,
      destinatario: d,
    },
  };
}

// ── Ref (identificador da nota na Focus: só letras e números, única por token) ──
// CONFERIR NA FOCUS: tamanho máximo da ref (não encontrado). A nossa tem 39-40 caracteres.
export function buildRef(docType: FiscalDocType, env: FiscalEnvironment, sourceId: string, attempt: number): string {
  const id = String(sourceId).toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${docType}${env === "producao" ? "p" : "h"}${id}v${Math.max(1, Math.floor(attempt))}`;
}

/** Token da empresa (por ambiente) ou, sem ele, o token global configurado nos secrets. */
export function resolveFocusToken(
  env: FiscalEnvironment,
  store: { focus_token_homologacao?: string | null; focus_token_producao?: string | null } | null | undefined,
  vars: { global?: string | null; homologacao?: string | null },
): string | null {
  const own = env === "producao" ? store?.focus_token_producao : store?.focus_token_homologacao;
  if (own && own.trim()) return own.trim();
  if (env === "homologacao" && vars.homologacao?.trim()) return vars.homologacao.trim();
  return vars.global?.trim() || null;
}

/** HTTP Basic com o token como usuário e senha vazia. */
export const focusAuthHeader = (token: string) => `Basic ${btoa(`${token}:`)}`;

export const focusPath = (docType: FiscalDocType, ref?: string) =>
  `/v2/${docType}${ref ? `/${encodeURIComponent(ref)}` : ""}`;

// ── Resposta da Focus ──
export function mapFocusStatus(status: unknown): FiscalStatus {
  switch (String(status ?? "")) {
    case "autorizado": return "autorizado";
    case "erro_autorizacao": return "erro";
    case "cancelado": return "cancelado";
    case "denegado": return "denegado";
    case "processando_autorizacao": return "processando";
    default: return "processando";
  }
}

export interface ParsedFocusDocument {
  status: FiscalStatus;
  focus_status: string | null;
  status_sefaz: string | null;
  mensagem_sefaz: string | null;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  protocolo: string | null;
  danfe_url: string | null;
  xml_url: string | null;
  qrcode_url: string | null;
  contingencia: boolean;
  error_message: string | null;
}

const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
const absolute = (base: string, path: unknown) => {
  const p = str(path);
  if (!p) return null;
  return /^https?:\/\//i.test(p) ? p : `${base}${p.startsWith("/") ? "" : "/"}${p}`;
};

export function parseFocusDocument(body: Record<string, unknown> | null | undefined, docType: FiscalDocType, env: FiscalEnvironment): ParsedFocusDocument {
  const b = body ?? {};
  const base = focusBaseUrl(env);
  const status = mapFocusStatus(b.status);
  const chave = str(b.chave_nfe ?? b.chave)?.replace(/^NFe/, "") ?? null;
  // CONFERIR NA FOCUS: nomes dos caminhos (caminho_danfe, caminho_xml_nota_fiscal) e do protocolo.
  let danfe = absolute(base, b.caminho_danfe ?? b.caminho_danfe_html ?? b.url_danfe);
  if (!danfe && docType === "nfce" && chave && status === "autorizado") {
    // URL observada em produção na pesquisa (mostralo-docs/focus-nfe-api.md §3.2)
    danfe = `${base}/notas_fiscais_consumidor/NFe${chave}.html`;
  }
  const mensagem = str(b.mensagem_sefaz);
  return {
    status,
    focus_status: str(b.status),
    status_sefaz: str(b.status_sefaz),
    mensagem_sefaz: mensagem,
    numero: str(b.numero),
    serie: str(b.serie),
    chave,
    protocolo: str(b.protocolo ?? b.protocolo_nota_fiscal ?? b.numero_protocolo),
    danfe_url: danfe,
    xml_url: absolute(base, b.caminho_xml_nota_fiscal ?? b.caminho_xml),
    qrcode_url: str(b.qrcode_url),
    contingencia: b.contingencia_offline === true || b.contingencia_offline === "true",
    error_message: status === "erro" || status === "denegado"
      ? (mensagem || str(b.mensagem) || "A SEFAZ recusou a nota.")
      : null,
  };
}

export type EmitOutcome =
  | { kind: "document"; doc: ParsedFocusDocument }
  | { kind: "already_used" } // ref já existe na Focus: consultar em vez de reenviar
  | { kind: "error"; message: string; code: string; retryable: boolean };

/** Lê a resposta HTTP de emissão/consulta/cancelamento da Focus. */
export function interpretFocusResponse(
  httpStatus: number, body: Record<string, unknown> | null | undefined, docType: FiscalDocType, env: FiscalEnvironment,
): EmitOutcome {
  const b = body ?? {};
  const codigo = String(b.codigo ?? "");
  const mensagem = String(b.mensagem ?? b.mensagem_sefaz ?? "");
  if (httpStatus >= 200 && httpStatus < 300 && (b.status || httpStatus === 202)) {
    return { kind: "document", doc: parseFocusDocument(httpStatus === 202 && !b.status ? { ...b, status: "processando_autorizacao" } : b, docType, env) };
  }
  // CONFERIR NA FOCUS: códigos exatos de "referência já utilizada" / "em processamento".
  if (httpStatus === 422 && (/ja_processad|ja_utilizad|em_processamento|already/i.test(codigo) || /refer[eê]ncia.*(utilizada|processamento)/i.test(mensagem))) {
    return { kind: "already_used" };
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return { kind: "error", code: "focus_auth", retryable: false, message: "A Focus recusou o token da loja. Confira o token nas configurações fiscais." };
  }
  if (httpStatus === 404) return { kind: "error", code: "focus_not_found", retryable: false, message: "Nota não encontrada na Focus." };
  if (httpStatus === 429) {
    return { kind: "error", code: "focus_rate_limit", retryable: true, message: "Muitas notas ao mesmo tempo. Aguarde 1 minuto e tente de novo." };
  }
  if (httpStatus >= 500 || httpStatus === 0) {
    return { kind: "error", code: "focus_unavailable", retryable: true, message: "A Focus NFe não respondeu. Tente de novo em instantes." };
  }
  if (/csc/i.test(mensagem) || /csc/i.test(codigo)) {
    return { kind: "error", code: "focus_csc", retryable: false, message: "CSC da NFC-e não configurado na Focus. Cadastre o CSC e o ID do token da SEFAZ na empresa." };
  }
  if (/empresa|ambiente/i.test(mensagem) && /configurad|habilitad/i.test(mensagem)) {
    return { kind: "error", code: "focus_company", retryable: false, message: `Empresa não configurada na Focus para este ambiente: ${mensagem}` };
  }
  return {
    kind: "error", code: codigo || "focus_error", retryable: false,
    message: mensagem ? `Focus NFe: ${mensagem}` : `A Focus NFe recusou a solicitação (HTTP ${httpStatus}).`,
  };
}

// ── Cancelamento ──
/** Prazo da Focus: NFC-e 30 min; NF-e 24 h (alguns estados aceitam mais). */
export const CANCEL_WINDOW_MINUTES: Record<FiscalDocType, number> = { nfce: 30, nfe: 24 * 60 };

export function cancelCheck(
  doc: { doc_type: FiscalDocType; status: FiscalStatus; authorized_at?: string | null; created_at?: string | null },
  justificativa: string, now: Date,
): { ok: true; justificativa: string } | { ok: false; error: string } {
  if (doc.status !== "autorizado") return { ok: false, error: "Só nota autorizada pode ser cancelada." };
  const j = String(justificativa ?? "").trim().replace(/\s+/g, " ");
  if (j.length < 15) return { ok: false, error: "Escreva o motivo do cancelamento com pelo menos 15 letras." };
  if (j.length > 255) return { ok: false, error: "O motivo do cancelamento pode ter no máximo 255 letras." };
  const from = Date.parse(doc.authorized_at || doc.created_at || "");
  if (Number.isFinite(from)) {
    const limit = from + CANCEL_WINDOW_MINUTES[doc.doc_type] * 60_000;
    if (now.getTime() > limit) {
      return {
        ok: false,
        error: doc.doc_type === "nfce"
          ? "Passou o prazo de 30 minutos para cancelar o cupom fiscal. Fale com o contador."
          : "Passou o prazo de 24 horas para cancelar a NF-e. Fale com o contador.",
      };
    }
  }
  return { ok: true, justificativa: j };
}

/**
 * Webhook e consulta podem chegar fora de ordem: nunca voltar de autorizado para processando,
 * nem de cancelado/denegado para outro status.
 */
export function shouldApplyStatus(current: FiscalStatus, next: FiscalStatus): boolean {
  if (current === next) return true;
  if (current === "cancelado" || current === "denegado") return false;
  if (current === "autorizado") return next === "cancelado";
  if (next === "processando") return current === "processando";
  return true;
}

/** Campos a gravar em fiscal_documents a partir da resposta (não apaga o que já tinha). */
export function documentPatch(
  current: { status: FiscalStatus; authorized_at?: string | null },
  parsed: ParsedFocusDocument, raw: unknown, now: Date,
): Record<string, unknown> | null {
  if (!shouldApplyStatus(current.status, parsed.status)) return null;
  const patch: Record<string, unknown> = { status: parsed.status, response_payload: raw ?? null };
  const keep = ["focus_status", "status_sefaz", "mensagem_sefaz", "numero", "serie", "chave", "protocolo", "danfe_url", "xml_url", "qrcode_url"] as const;
  for (const k of keep) if (parsed[k] !== null) patch[k] = parsed[k];
  patch.contingencia = parsed.contingencia;
  patch.error_message = parsed.error_message;
  if (parsed.status === "autorizado" && !current.authorized_at) patch.authorized_at = now.toISOString();
  if (parsed.status === "cancelado") patch.cancelled_at = now.toISOString();
  return patch;
}

/** Comparação de segredo em tempo constante (webhook). */
export function secretMatches(provided: string | null | undefined, expected: string | null | undefined): boolean {
  const a = String(provided ?? "");
  const b = String(expected ?? "");
  if (!a || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export { isValidCpf, isValidCnpj };
