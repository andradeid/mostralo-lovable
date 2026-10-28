/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { rememberPrinted, shouldPrint } from './printRules';

test('ao chegar imprime pedido novo uma vez só', () => {
  assert.equal(shouldPrint({ id: 'a', status: 'entrada' }, 'arrive', new Set()), true);
  assert.equal(shouldPrint({ id: 'a', status: 'entrada' }, 'arrive', new Set(['a'])), false);
  assert.equal(shouldPrint({ id: 'b', status: 'aguardando_pagamento' }, 'arrive', new Set()), false);
  assert.equal(shouldPrint({ id: 'c', status: 'cancelado' }, 'arrive', new Set()), false);
});

test('ao aceitar só imprime depois de sair de entrada', () => {
  assert.equal(shouldPrint({ id: 'a', status: 'entrada' }, 'accept', new Set()), false);
  assert.equal(shouldPrint({ id: 'a', status: 'em_preparo' }, 'accept', new Set()), true);
  assert.equal(shouldPrint({ id: 'a', status: 'confirmado' }, 'accept', new Set()), true);
});

test('lista de impressos tem limite', () => {
  let l: string[] = [];
  for (let i = 0; i < 10; i++) l = rememberPrinted(l, String(i), 5);
  assert.deepEqual(l, ['5', '6', '7', '8', '9']);
});
