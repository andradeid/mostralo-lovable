import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domainHelpLink, isManagedDomain, rootOf } from './customDomain';

test('rootOf tira www, protocolo e caminho', () => {
  assert.equal(rootOf('www.loja.com.br'), 'loja.com.br');
  assert.equal(rootOf('https://WWW.Loja.com.br/x'), 'loja.com.br');
  assert.equal(rootOf(''), '');
  assert.equal(rootOf(null), '');
});

test('managed: verificado e gravado sem www', () => {
  assert.equal(isManagedDomain('uninkimpressoras.com.br', true), true);
  assert.equal(isManagedDomain('www.unaquerencia.com.br', true), false);
  assert.equal(isManagedDomain('uninkimpressoras.com.br', false), false);
  assert.equal(isManagedDomain('', true), false);
});

test('link de ajuda cita o domínio sem www', () => {
  const url = domainHelpLink('www.loja.com.br');
  assert.ok(url.startsWith('https://wa.me/5561994009368?text='));
  assert.ok(decodeURIComponent(url).includes('loja.com.br (sem www)'));
});
