import { test } from 'node:test';
import assert from 'node:assert';
import { storagePathFrom, storageRefFrom, storageRefUrl, isImageFile, isStorageFile } from './privateFiles';

const BASE = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const B = 'subscription-receipts';

test('URL pública antiga vira caminho', () => {
  assert.strictEqual(
    storagePathFrom(`${BASE}/storage/v1/object/public/${B}/loja-1/fat-123.png`, B),
    'loja-1/fat-123.png',
  );
});

test('URL assinada antiga vira caminho (sem o token)', () => {
  assert.strictEqual(
    storagePathFrom(`${BASE}/storage/v1/object/sign/${B}/loja-1/fat%20x.pdf?token=abc.def`, B),
    'loja-1/fat x.pdf',
  );
});

test('caminho puro volta igual', () => {
  assert.strictEqual(storagePathFrom('loja-1/fat-123.png', B), 'loja-1/fat-123.png');
  assert.strictEqual(storagePathFrom('/loja-1/fat-123.png', B), 'loja-1/fat-123.png');
  assert.strictEqual(storagePathFrom(`${B}/loja-1/fat-123.png`, B), 'loja-1/fat-123.png');
});

test('texto livre, vazio e URL externa não são arquivo', () => {
  assert.strictEqual(storagePathFrom('PIX confirmado via webhook - EndToEndId: E123', B), null);
  assert.strictEqual(storagePathFrom('', B), null);
  assert.strictEqual(storagePathFrom(null, B), null);
  assert.strictEqual(storagePathFrom('https://exemplo.com/a.png', B), null);
  assert.strictEqual(storagePathFrom('../outra/a.png', B), null);
  assert.strictEqual(isStorageFile('PIX confirmado', B), false);
});

test('URL de outro bucket: storagePathFrom recusa, storageRefFrom identifica', () => {
  const url = `${BASE}/storage/v1/object/public/payment-proofs/loja-1/renewal-1.jpg`;
  assert.strictEqual(storagePathFrom(url, B), null);
  assert.deepStrictEqual(storageRefFrom(url, B), { bucket: 'payment-proofs', path: 'loja-1/renewal-1.jpg' });
});

test('referência com bucket faz ida e volta', () => {
  const ref = { bucket: 'payment-proofs', path: 'loja 1/renewal-1.jpg' };
  assert.deepStrictEqual(storageRefFrom(storageRefUrl(ref, BASE), B), ref);
});

test('imagem pela extensão, ignorando token', () => {
  assert.strictEqual(isImageFile('a/b.JPG?token=x'), true);
  assert.strictEqual(isImageFile('a/b.pdf'), false);
});
