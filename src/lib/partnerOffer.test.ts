/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { founderOfferApplies, normalizeCoupon, partnerPageUrl } from './partnerOffer';

test('normaliza o cupom digitado', () => {
  assert.equal(normalizeCoupon(' ju-liana 10 '), 'JULIANA10');
  assert.equal(normalizeCoupon('joão'), 'JOAO');
  assert.equal(normalizeCoupon('abcdefghijklmnopqrst').length, 15);
});

test('monta o link da página em minúsculas', () => {
  assert.equal(partnerPageUrl('https://mostralo.com.br', 'JULIANA'), 'https://mostralo.com.br/parceiro/juliana');
});

test('sócio fundador só no Agenda, com parceiro e vaga', () => {
  assert.equal(founderOfferApplies({ hasPartner: true, planName: 'Agenda', remaining: 1 }), true);
  assert.equal(founderOfferApplies({ hasPartner: true, planName: 'Completo', remaining: 1 }), false);
  assert.equal(founderOfferApplies({ hasPartner: true, planName: 'Agenda', remaining: 0 }), false);
  assert.equal(founderOfferApplies({ hasPartner: false, planName: 'Agenda', remaining: 5 }), false);
});
