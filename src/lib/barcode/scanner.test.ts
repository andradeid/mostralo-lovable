/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  DEFAULT_SCANNER_CONFIG,
  EMPTY_BUFFER,
  classifyFocus,
  feedKey,
  isScan,
  scanAllowed,
  type ScanBuffer,
} from './scanner.ts';

/** Digita `text` com os intervalos dados (um número = intervalo fixo) e aperta `end` depois de `endGap` ms. */
function type(text: string, gaps: number | number[], { end = 'Enter', endGap = 10, start = 1000 } = {}) {
  let buffer: ScanBuffer = EMPTY_BUFFER;
  let t = start;
  const codes: (string | null)[] = [];
  [...text].forEach((key, i) => {
    if (i > 0) t += Array.isArray(gaps) ? gaps[i - 1] : gaps;
    const r = feedKey(buffer, { key, time: t });
    buffer = r.buffer;
    codes.push(r.code);
  });
  const r = feedKey(buffer, { key: end, time: t + endGap });
  return { code: r.code, buffer: r.buffer, codesBefore: codes };
}

test('rajada rápida terminada em Enter = leitura (EAN-13)', () => {
  assert.equal(type('7891234567895', 8).code, '7891234567895');
});

test('Tab também termina a leitura', () => {
  assert.equal(type('7891234567895', 5, { end: 'Tab' }).code, '7891234567895');
});

test('nada é emitido antes do Enter e o acumulado zera depois', () => {
  const r = type('7891234567895', 8);
  assert.ok(r.codesBefore.every((c) => c === null));
  assert.deepEqual(r.buffer, EMPTY_BUFFER);
});

test('digitação humana (80 ms ou mais entre teclas) não é leitura', () => {
  assert.equal(type('7891234567895', 80).code, null);
  assert.equal(type('7891234567895', 150).code, null);
  assert.equal(type('12345678', [90, 120, 100, 85, 140, 95, 110]).code, null);
});

test('limite do intervalo entre teclas: 50 ms passa, 51 ms não', () => {
  assert.equal(type('12345678', DEFAULT_SCANNER_CONFIG.maxGapMs).code, '12345678');
  assert.equal(type('12345678', DEFAULT_SCANNER_CONFIG.maxGapMs + 1).code, null);
});

test('uma pausa no meio recomeça a rajada; o que sobra curto não é leitura', () => {
  // "789" devagar e "12345" rápido: sobram 5 caracteres
  assert.equal(type('78912345', [200, 200, 300, 10, 10, 10, 10]).code, null);
  // pessoa apertou uma tecla antes e o leitor leu em seguida: vale só a rajada
  assert.equal(type('x7891234567895', [400, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]).code, '7891234567895');
});

test('Enter muito depois da última tecla não é leitura', () => {
  assert.equal(type('7891234567895', 8, { endGap: 100 }).code, '7891234567895');
  assert.equal(type('7891234567895', 8, { endGap: 101 }).code, null);
});

test('tamanho: 6 a 20 caracteres', () => {
  assert.equal(type('12345', 5).code, null);
  assert.equal(type('123456', 5).code, '123456');
  assert.equal(type('12345678901234567890', 5).code, '12345678901234567890');
  assert.equal(type('123456789012345678901', 5).code, null);
  assert.equal(type('1'.repeat(60), 5).code, null);
});

test('códigos internos com letras passam; sem número ou com espaço não', () => {
  assert.equal(type('CX-0012', 6).code, 'CX-0012');
  assert.equal(type('ABCDEFG', 6).code, null);
  assert.equal(type('123 456', 6).code, null);
});

test('Shift (letras maiúsculas do leitor) não quebra a rajada; Ctrl e outras teclas zeram', () => {
  let b: ScanBuffer = EMPTY_BUFFER;
  b = feedKey(b, { key: 'A', time: 0 }).buffer;
  b = feedKey(b, { key: 'Shift', time: 5 }).buffer;
  b = feedKey(b, { key: 'B', time: 10 }).buffer;
  assert.equal(b.chars, 'AB');
  assert.deepEqual(feedKey(b, { key: 'c', time: 15, ctrlKey: true }).buffer, EMPTY_BUFFER);
  assert.deepEqual(feedKey(b, { key: 'Backspace', time: 15 }).buffer, EMPTY_BUFFER);
});

test('isScan direto: acumulado vazio não é leitura', () => {
  assert.equal(isScan(EMPTY_BUFFER, 0), false);
});

test('foco: busca de produto, campos de texto e o resto', () => {
  assert.equal(classifyFocus(null), 'other');
  assert.equal(classifyFocus({ tagName: 'BODY' }), 'other');
  assert.equal(classifyFocus({ tagName: 'BUTTON' }), 'other');
  assert.equal(classifyFocus({ tagName: 'INPUT', type: 'text', isProductSearch: true }), 'search');
  assert.equal(classifyFocus({ tagName: 'INPUT', type: 'text' }), 'editable');
  assert.equal(classifyFocus({ tagName: 'INPUT', type: 'number' }), 'editable');
  assert.equal(classifyFocus({ tagName: 'INPUT' }), 'editable');
  assert.equal(classifyFocus({ tagName: 'INPUT', type: 'checkbox' }), 'other');
  assert.equal(classifyFocus({ tagName: 'TEXTAREA' }), 'editable');
  assert.equal(classifyFocus({ tagName: 'DIV', isContentEditable: true }), 'editable');
  assert.equal(classifyFocus({ tagName: 'BUTTON', role: 'combobox' }), 'editable'); // select do Radix
});

test('diálogos: sem zona só sem diálogo aberto; com zona só no diálogo de cima dela', () => {
  assert.equal(scanAllowed(undefined, []), true);
  assert.equal(scanAllowed(undefined, [null]), false);
  assert.equal(scanAllowed('novo-pedido', []), false);
  assert.equal(scanAllowed('novo-pedido', ['novo-pedido']), true);
  // cadastro rápido (ou cliente) aberto por cima do Novo pedido
  assert.equal(scanAllowed('novo-pedido', ['novo-pedido', null]), false);
});
