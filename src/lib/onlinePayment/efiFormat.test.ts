import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAccountNumber,
  formatCNPJ,
  formatCPF,
  formatCurrency,
  formatDisplayDocument,
  formatDocumentByType,
} from './efiFormat.ts';

test('máscara de CPF e CNPJ enquanto digita (corta no tamanho máximo)', () => {
  assert.equal(formatCPF('12345678901'), '123.456.789-01');
  assert.equal(formatCPF('123.456.789-0199'), '123.456.789-01');
  assert.equal(formatCPF('1234'), '123.4');
  assert.equal(formatCNPJ('12345678000199'), '12.345.678/0001-99');
  assert.equal(formatDocumentByType('12345678901', 'cpf'), '123.456.789-01');
  assert.equal(formatDocumentByType('12345678000199', 'cnpj'), '12.345.678/0001-99');
});

test('documento salvo para exibição', () => {
  assert.equal(formatDisplayDocument(null, 'cpf'), 'Não informado');
  assert.equal(formatDisplayDocument('12345678901', null), '123.456.789-01');
  assert.equal(formatDisplayDocument('12345678000199', 'cnpj'), '12.345.678/0001-99');
});

test('número da conta: só dígitos, até 10', () => {
  assert.equal(formatAccountNumber('ab12-345.678 9012'), '1234567890');
});

test('valor do PIX de teste em reais (aceita vírgula)', () => {
  assert.equal(formatCurrency('abc'), 'R$ 0,00');
  assert.equal(formatCurrency('1,5').replace(/\s/g, ' '), 'R$ 1,50');
  assert.equal(formatCurrency('10.00').replace(/\s/g, ' '), 'R$ 10,00');
});
