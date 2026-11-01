/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { canToggleLabel, isHexColor, labelChanges, validateNewLabelName } from './customerLabels.ts';

const labels = [
  { id: 'vip', name: 'VIP', label_type: 'custom', is_system: false },
  { id: 'origem', name: 'Agendamento Online', label_type: 'origin', is_system: true },
  { id: 'totem', name: 'Totem', label_type: 'channel', is_system: true },
  { id: 'delivery', name: 'Delivery', label_type: 'channel', is_system: true },
];

test('etiqueta de canal não pode ser marcada nem desmarcada à mão', () => {
  assert.equal(canToggleLabel(labels[2]), false);
  assert.equal(canToggleLabel(labels[0]), true);
  assert.equal(canToggleLabel(labels[1]), true); // do sistema, mas não é de canal
});

test('calcula o que atribuir e remover, ignorando canal', () => {
  const r = labelChanges(labels, ['totem', 'origem'], ['vip', 'delivery']);
  assert.deepEqual(r, { toAdd: ['vip'], toRemove: ['origem'] });
});

test('sem mudança: nada a gravar', () => {
  assert.deepEqual(labelChanges(labels, ['vip', 'totem'], ['vip', 'totem']), { toAdd: [], toRemove: [] });
});

test('etiqueta salva que não está mais na lista da loja não é removida', () => {
  assert.deepEqual(labelChanges(labels, ['de-outra-loja'], []), { toAdd: [], toRemove: [] });
});

test('nome de etiqueta nova', () => {
  assert.equal(validateNewLabelName('  ', labels), 'Informe o nome da etiqueta');
  assert.equal(validateNewLabelName('vip', labels), 'Já existe uma etiqueta com esse nome');
  assert.equal(validateNewLabelName('x'.repeat(41), labels), 'Use até 40 caracteres');
  assert.equal(validateNewLabelName(' Aniversariante ', labels), null);
});

test('cor', () => {
  assert.equal(isHexColor('#22c55e'), true);
  assert.equal(isHexColor('red'), false);
});
