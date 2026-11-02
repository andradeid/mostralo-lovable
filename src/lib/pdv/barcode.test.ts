/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  barcodeForSave,
  barcodeKind,
  findByBarcode,
  hasValidGtinCheckDigit,
  isScannerBurst,
  looksLikeBarcode,
  nameOrBarcodeFilter,
  normalizeBarcode,
  pushKeyTime,
} from './barcode.ts';

test('normaliza espaços e quebras de linha do leitor', () => {
  assert.equal(normalizeBarcode(' 789 1234 56789 0\n'), '7891234567890');
  assert.equal(normalizeBarcode(null), '');
  assert.equal(barcodeForSave('   '), null);
  assert.equal(barcodeForSave(' CX-12 '), 'CX-12');
});

test('reconhece EAN-8, UPC-12, EAN-13 e GTIN-14 pelo dígito verificador', () => {
  assert.equal(barcodeKind('96385074'), 'ean8');
  assert.equal(barcodeKind('036000291452'), 'upc12');
  assert.equal(barcodeKind('7891000315507'), 'ean13');
  assert.equal(barcodeKind('17891000315504'), 'gtin14');
  assert.equal(hasValidGtinCheckDigit('7891000315508'), false);
});

test('códigos internos e EAN com dígito errado viram "interno"', () => {
  assert.equal(barcodeKind('000123'), 'interno');
  assert.equal(barcodeKind('CX-12'), 'interno');
  assert.equal(barcodeKind('7891000315508'), 'interno');
});

test('parece código: sem espaço, com dígito, de 3 a 48 caracteres', () => {
  assert.equal(looksLikeBarcode('7891000315507'), true);
  assert.equal(looksLikeBarcode('CX-12'), true);
  assert.equal(looksLikeBarcode('coca lata'), false);
  assert.equal(looksLikeBarcode('coca'), false);
  assert.equal(looksLikeBarcode('12'), false);
});

test('busca exata pelo código (normalizado), sem casar pedaço', () => {
  const produtos = [
    { id: 'a', barcode: '7891000315507' },
    { id: 'b', barcode: null },
    { id: 'c', barcode: 'CX-12' },
  ];
  assert.equal(findByBarcode(produtos, ' 7891000315507 ')?.id, 'a');
  assert.equal(findByBarcode(produtos, 'CX-12')?.id, 'c');
  assert.equal(findByBarcode(produtos, '789100031550'), null);
  assert.equal(findByBarcode(produtos, ''), null);
});

test('filtro nome OU código só quando o termo é seguro para o .or()', () => {
  assert.equal(nameOrBarcodeFilter('7891000315507'), 'name.ilike.%7891000315507%,barcode.eq.7891000315507');
  assert.equal(
    nameOrBarcodeFilter('pizza', ['description']),
    'name.ilike.%pizza%,description.ilike.%pizza%,barcode.eq.pizza',
  );
  assert.equal(nameOrBarcodeFilter('coca, lata'), null);
  assert.equal(nameOrBarcodeFilter('pão (grande)'), null);
  assert.equal(nameOrBarcodeFilter('  '), null);
});

test('leitor USB: muitas teclas em sequência rápida', () => {
  const leitor = [0, 8, 15, 22, 30, 38, 45, 52, 60, 68, 75, 82, 90];
  const pessoa = [0, 150, 310, 420, 600, 760, 900, 1100];
  assert.equal(isScannerBurst(leitor), true);
  assert.equal(isScannerBurst(pessoa), false);
  assert.equal(isScannerBurst([0, 5, 10]), false); // curto demais
});

test('teclas recentes recomeçam depois de uma pausa', () => {
  let t: number[] = [];
  t = pushKeyTime(t, 0);
  t = pushKeyTime(t, 10);
  assert.deepEqual(t, [0, 10]);
  t = pushKeyTime(t, 500);
  assert.deepEqual(t, [500]);
});
