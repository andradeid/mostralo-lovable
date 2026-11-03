// Modos de tela do PDV e a escolha por computador. Funções puras (testadas em layout.test.ts).

export const PDV_LAYOUTS = ['grid', 'list', 'mixed'] as const;
export type PDVLayout = (typeof PDV_LAYOUTS)[number];

export const PDV_LAYOUT_LABEL: Record<PDVLayout, string> = {
  grid: 'Grade',
  list: 'Lista (supermercado)',
  mixed: 'Misto (padaria)',
};

export const PDV_LAYOUT_HINT: Record<PDVLayout, string> = {
  grid: 'Fotos dos produtos e carrinho ao lado (como sempre foi).',
  list: 'Leitor de código: último item em destaque, tabela da venda e atalhos F2/F3/F4.',
  mixed: 'Botões grandes de atalho e produtos por quilo com o peso digitado.',
};

export function isPdvLayout(value: unknown): value is PDVLayout {
  return typeof value === 'string' && (PDV_LAYOUTS as readonly string[]).includes(value);
}

/** Chave do localStorage do modo escolhido neste computador. */
export function deviceLayoutKey(storeId: string): string {
  return `mostralo:pdv-layout:${storeId}`;
}

/** Modo em uso: o deste computador (se válido), senão o padrão da loja, senão grade. */
export function resolvePdvLayout(storeDefault: unknown, deviceOverride: unknown): PDVLayout {
  if (isPdvLayout(deviceOverride)) return deviceOverride;
  if (isPdvLayout(storeDefault)) return storeDefault;
  return 'grid';
}
