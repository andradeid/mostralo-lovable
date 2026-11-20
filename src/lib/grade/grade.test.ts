import { test } from 'node:test';
import assert from 'node:assert';
import {
  buildGradeVariants, combinationName, findVariant, gradeCombinations, initialSelection, normalizeGrade,
  pickerOptions, selectValue, sizeRange, totalGradeStock, type Grade, type GradeVariant,
} from './grade.ts';
import { barcodeSvg, code128Modules, ean13CheckDigit, ean13Modules, fillMissingBarcodes, internalEan13, isValidEan13 } from './barcodeLabel.ts';

const grade: Grade = {
  attributes: [
    { name: 'Cor', values: [{ value: 'Preto', hex: '#000' }, { value: 'Branco', hex: '#fff' }] },
    { name: 'Tamanho', values: [{ value: '37' }, { value: '38' }] },
  ],
};

const v = (cor: string, tam: string, qty: number, id = `${cor}-${tam}`): GradeVariant => ({
  id, name: `${cor} / ${tam}`, price: 100, attributes: { Cor: cor, Tamanho: tam }, track_stock: true, stock_quantity: qty,
});

test('normalizeGrade limpa nomes vazios, repetidos e limita a 2 características', () => {
  const g = normalizeGrade({ attributes: [
    { name: ' Cor ', values: ['Preto', 'preto', '', { value: 'Azul', hex: '#00f' }] },
    { name: '', values: ['x'] },
    { name: 'Tamanho', values: ['37'] },
    { name: 'Extra', values: ['a'] },
  ] });
  assert.deepStrictEqual(g, { attributes: [
    { name: 'Cor', values: [{ value: 'Preto' }, { value: 'Azul', hex: '#00f' }] },
    { name: 'Tamanho', values: [{ value: '37' }] },
  ] });
  assert.strictEqual(normalizeGrade(null), null);
  assert.strictEqual(normalizeGrade({ attributes: [{ name: 'Cor', values: [] }] }), null);
});

test('combinações na ordem da grade e nome "Preto / 37"', () => {
  const combos = gradeCombinations(grade);
  assert.strictEqual(combos.length, 4);
  assert.deepStrictEqual(combos[0], { Cor: 'Preto', Tamanho: '37' });
  assert.deepStrictEqual(combos[3], { Cor: 'Branco', Tamanho: '38' });
  assert.strictEqual(combinationName(grade, combos[1]), 'Preto / 38');
});

test('buildGradeVariants mantém id, estoque e código das combinações existentes', () => {
  const existing = [{ ...v('Preto', '38', 5, 'abc'), barcode: '7891234567895' }, v('Verde', '37', 9, 'old')];
  const out = buildGradeVariants(grade, existing, 199.9);
  assert.strictEqual(out.length, 4);
  const p38 = out.find((x) => x.name === 'Preto / 38')!;
  assert.strictEqual(p38.id, 'abc');
  assert.strictEqual(p38.stock_quantity, 5);
  assert.strictEqual(p38.barcode, '7891234567895');
  assert.strictEqual(p38.price, 199.9);
  const novo = out.find((x) => x.name === 'Branco / 37')!;
  assert.strictEqual(novo.id, undefined);
  assert.strictEqual(novo.stock_quantity, 0);
  assert.strictEqual(out[0].is_default, true);
  assert.ok(!out.some((x) => x.id === 'old'), 'combinação que saiu da grade some');
  assert.strictEqual(totalGradeStock(out), 5);
});

test('loja: tamanho esgotado na cor escolhida fica indisponível, não some', () => {
  const variants = [v('Preto', '37', 2), v('Preto', '38', 0), v('Branco', '37', 0), v('Branco', '38', 1)];
  const opts = pickerOptions(grade, variants, { Cor: 'Preto' });
  const tam = opts.find((o) => o.name === 'Tamanho')!.options;
  assert.deepStrictEqual(tam.map((o) => [o.value, o.available, o.stock]), [['37', true, 2], ['38', false, 0]]);
  const cores = pickerOptions(grade, variants, {}).find((o) => o.name === 'Cor')!.options;
  assert.ok(cores.every((c) => c.available));
});

test('seleção inicial pega a primeira combinação com estoque; trocar de cor limpa tamanho esgotado', () => {
  const variants = [v('Preto', '37', 0), v('Preto', '38', 3), v('Branco', '37', 1), v('Branco', '38', 0)];
  assert.deepStrictEqual(initialSelection(grade, variants), { Cor: 'Preto', Tamanho: '38' });
  assert.deepStrictEqual(selectValue(grade, variants, { Cor: 'Preto', Tamanho: '38' }, 'Cor', 'Branco'), { Cor: 'Branco' });
  assert.deepStrictEqual(selectValue(grade, variants, { Cor: 'Preto', Tamanho: '38' }, 'Tamanho', '38'), { Cor: 'Preto', Tamanho: '38' });
  assert.strictEqual(findVariant(grade, variants, { Cor: 'Branco', Tamanho: '37' })?.id, 'Branco-37');
  assert.strictEqual(findVariant(grade, variants, { Cor: 'Branco' }), null);
  assert.deepStrictEqual(initialSelection(grade, [v('Preto', '37', 0)]), {});
});

test('sizeRange', () => {
  assert.deepStrictEqual(sizeRange(34, 37), ['34', '35', '36', '37']);
  assert.deepStrictEqual(sizeRange(40, 34), []);
});

test('EAN-13: dígito, validação, interno começa com 2 e preenchimento sem repetir', () => {
  assert.strictEqual(ean13CheckDigit('789123456789'), 5);
  assert.ok(isValidEan13('7891234567895'));
  assert.ok(!isValidEan13('7891234567894'));
  const code = internalEan13(() => 0.5);
  assert.ok(code.startsWith('2') && isValidEan13(code));
  const seq = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  let i = 0;
  const rnd = () => seq[i++ % seq.length];
  const filled = fillMissingBarcodes([{ barcode: '' }, { barcode: 'X1' }], [], rnd);
  assert.ok(isValidEan13(filled[0].barcode!));
  assert.strictEqual(filled[1].barcode, 'X1');
});

test('barras: EAN-13 e Code 128 conferidos com biblioteca de referência', () => {
  assert.strictEqual(ean13Modules('2000000000015'),
    '10100011010001101010011101001110001101010011101010111001011100101110010111001011001101001110101');
  assert.strictEqual(code128Modules('TCC-PRE-37'),
    '1101001000011011100010100010001101000100011010011011100111011101101100010111010001101000100110111001100101110011101101110110100010001100011101011');
  assert.ok(barcodeSvg('2000000000015').startsWith('<svg'));
});
