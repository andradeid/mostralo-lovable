/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  emptyFiscalForm, fiscalReadiness, formFromRow, rowFromForm, validateFiscalForm, icmsOptionsFor,
} from './settingsForm.ts';
import {
  emptyProductFiscal, isProductFiscalEmpty, productFiscalFromRow, productFiscalToRow, sameProductFiscal, validateProductFiscal,
} from './productFiscal.ts';
import {
  canEmit, cancelMinutesLeft, currentDocument, emptyRecipient, formatMinutes, nfceDocumentHint, recipientErrors,
  recipientPayload, type FiscalDocument,
} from './documents.ts';
import { notifyFiscalSaleClosed, onFiscalSaleClosed } from './saleEvents.ts';

const filled = () => ({
  ...emptyFiscalForm(),
  nfce_enabled: true,
  cnpj: '11.222.333/0001-81', inscricao_estadual: '07.345.678/001-23', razao_social: 'Loja Teste LTDA',
  logradouro: 'Rua 1', numero: '10', bairro: 'Centro', municipio: 'Brasília', uf: 'df', cep: '70000-000',
  default_pis_cst: '49', default_cofins_cst: '49',
});

test('configuração: sem notas ligadas não exige empresa; ligada exige', () => {
  assert.deepEqual(validateFiscalForm(emptyFiscalForm()), {});
  const e = validateFiscalForm({ ...emptyFiscalForm(), nfce_enabled: true });
  assert.ok(e.cnpj && e.inscricao_estadual && e.uf && e.cep);
  assert.deepEqual(validateFiscalForm(filled()), {});
  assert.equal(validateFiscalForm({ ...filled(), cnpj: '11.222.333/0001-80' }).cnpj, 'CNPJ inválido');
});

test('configuração: CSOSN x CST conforme o regime', () => {
  assert.equal(validateFiscalForm({ ...filled(), regime_tributario: '3' }).default_icms_situacao, 'Escolha um CST');
  assert.equal(icmsOptionsFor('3')[0].value, '40');
  assert.equal(icmsOptionsFor('1')[0].value, '102');
});

test('configuração: linha gravada só com dígitos e padrões', () => {
  const row = rowFromForm(filled(), 'store-1');
  assert.equal(row.cnpj, '11222333000181');
  assert.equal(row.uf, 'DF');
  assert.equal(row.cep, '70000000');
  assert.equal(row.nfce_serie, null);
  assert.equal(row.default_cfop, '5102');
  assert.equal(rowFromForm({ ...filled(), inscricao_estadual: 'isento' }, 's').inscricao_estadual, 'ISENTO');
  const back = formFromRow(row as unknown as Record<string, unknown>);
  assert.equal(back.cnpj, '11222333000181');
  assert.equal(back.pix_payment_code, '17');
});

test('o que falta: token e CSC do ambiente escolhido', () => {
  const none = fiscalReadiness(filled(), null);
  assert.equal(none.find((i) => i.key === 'company')?.done, true);
  assert.equal(none.find((i) => i.key === 'token')?.done, false);
  assert.ok(none.find((i) => i.key === 'csc'));
  const ok = fiscalReadiness(filled(), { token_homologacao: true, token_producao: false, csc_homologacao: true, csc_producao: false });
  assert.ok(ok.every((i) => i.done));
  const prod = fiscalReadiness({ ...filled(), environment: 'producao' }, { token_homologacao: true, token_producao: false, csc_homologacao: true, csc_producao: false });
  assert.equal(prod.find((i) => i.key === 'token')?.done, false);
});

test('produto: validação, vazio = padrão da loja e comparação', () => {
  assert.deepEqual(validateProductFiscal(emptyProductFiscal()), {});
  const e = validateProductFiscal({ ...emptyProductFiscal(), ncm: '123', cfop: '1102', cest: '12', unidade: 'PACOTES' });
  assert.ok(e.ncm && e.cfop && e.cest && e.unidade);
  const row = productFiscalToRow({ ...emptyProductFiscal(), ncm: '2106.90.90', icms_origem: '0', unidade: 'kg' });
  assert.equal(row.ncm, '21069090');
  assert.equal(row.icms_origem, 0);
  assert.equal(row.unidade, 'KG');
  assert.equal(isProductFiscalEmpty(productFiscalToRow(emptyProductFiscal())), true);
  assert.equal(sameProductFiscal(row, productFiscalToRow(productFiscalFromRow(row))), true);
});

const doc = (o: Partial<FiscalDocument>): FiscalDocument => ({
  id: 'd', store_id: 's', doc_type: 'nfce', environment: 'homologacao', comanda_id: 'c', order_id: null, ref: 'r', attempt: 1,
  status: 'autorizado', status_sefaz: null, mensagem_sefaz: null, numero: '1', serie: '1', chave: null, protocolo: null,
  danfe_url: null, xml_url: null, contingencia: false, error_message: null, total: 10, recipient_document: null,
  recipient_name: null, cancel_justificativa: null, created_at: '2026-11-03T12:00:00Z', updated_at: '2026-11-03T12:00:00Z',
  authorized_at: '2026-11-03T12:00:00Z', cancelled_at: null, ...o,
});

test('documentos: nota vigente, emitir de novo e prazo de cancelamento', () => {
  const docs = [
    doc({ id: 'a', status: 'cancelado', created_at: '2026-11-03T11:00:00Z' }),
    doc({ id: 'b', status: 'autorizado', created_at: '2026-11-03T12:00:00Z' }),
  ];
  assert.equal(currentDocument(docs, 'nfce')?.id, 'b');
  assert.equal(currentDocument(docs, 'nfe'), null);
  assert.equal(canEmit(null), true);
  assert.equal(canEmit(docs[1]), false);
  assert.equal(canEmit(doc({ status: 'erro' })), true);
  assert.equal(cancelMinutesLeft(docs[1], new Date('2026-11-03T12:10:00Z')), 20);
  assert.equal(cancelMinutesLeft(docs[1], new Date('2026-11-03T12:31:00Z')), null);
  assert.equal(cancelMinutesLeft(doc({ doc_type: 'nfe' }), new Date('2026-11-03T13:00:00Z')), 23 * 60);
  assert.equal(formatMinutes(90), '1 h 30 min');
});

test('CPF/CNPJ no PDV e destinatário da NF-e', () => {
  assert.equal(nfceDocumentHint('').kind, 'empty');
  assert.equal(nfceDocumentHint('529.982.247-25').kind, 'cpf');
  assert.equal(nfceDocumentHint('11.444.777/0001-61').kind, 'cnpj');
  assert.equal(nfceDocumentHint('5299').message, 'Continue digitando…');
  const r = recipientPayload(emptyRecipient({
    document: '529.982.247-25', name: 'Maria', ie_indicator: '1', logradouro: 'Rua A', bairro: 'Centro', municipio: 'Goiânia', uf: 'go',
  }));
  assert.equal(r.ie_indicator, '9'); // CPF nunca é contribuinte
  assert.equal(r.numero, 'S/N');
  assert.equal(r.uf, 'GO');
  assert.deepEqual(recipientErrors(r), []);
  assert.ok(recipientErrors({ ...r, document: '' }).length > 0);
});

test('aviso de venda fechada chega a quem está ouvindo', () => {
  const got: string[] = [];
  const off = onFiscalSaleClosed((id) => got.push(id));
  notifyFiscalSaleClosed('c1');
  notifyFiscalSaleClosed(null);
  off();
  notifyFiscalSaleClosed('c2');
  assert.deepEqual(got, ['c1']);
});
