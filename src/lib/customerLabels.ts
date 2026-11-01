/**
 * Regras das etiquetas de cliente no painel (sem dependências: testável com node).
 * Etiquetas de canal (label_type 'channel': Delivery, Totem, WhatsApp, iFood...) são
 * colocadas automaticamente pelo sistema conforme o cliente compra por aquele canal —
 * a equipe vê, mas não põe nem tira à mão (senão a etiqueta deixaria de dizer a verdade
 * sobre o canal, e uma posta à mão não poderia mais ser removida).
 * As demais (personalizadas e as de origem do sistema) a equipe marca e desmarca.
 */

export interface LabelLike {
  id: string;
  name: string;
  label_type?: string | null;
  is_system?: boolean | null;
}

export const isChannelLabel = (l: Pick<LabelLike, 'label_type'>) => l.label_type === 'channel';

/** A equipe pode marcar/desmarcar esta etiqueta no cliente? */
export const canToggleLabel = (l: Pick<LabelLike, 'label_type'>) => !isChannelLabel(l);

/**
 * O que gravar: etiquetas a atribuir e a remover, a partir do que está salvo e do que
 * foi marcado na tela. Etiquetas de canal nunca entram nem saem por aqui.
 */
export function labelChanges(
  labels: LabelLike[],
  savedIds: Iterable<string>,
  selectedIds: Iterable<string>,
): { toAdd: string[]; toRemove: string[] } {
  const saved = new Set(savedIds);
  const selected = new Set(selectedIds);
  const editable = new Set(labels.filter(canToggleLabel).map(l => l.id));
  const toAdd = [...selected].filter(id => editable.has(id) && !saved.has(id));
  const toRemove = [...saved].filter(id => editable.has(id) && !selected.has(id));
  return { toAdd, toRemove };
}

/** Nome de etiqueta nova: aparado, 1 a 40 caracteres, sem repetir (sem diferenciar maiúsculas). */
export function validateNewLabelName(name: string, existing: Pick<LabelLike, 'name'>[]): string | null {
  const n = name.trim();
  if (!n) return 'Informe o nome da etiqueta';
  if (n.length > 40) return 'Use até 40 caracteres';
  if (existing.some(l => l.name.trim().toLowerCase() === n.toLowerCase())) return 'Já existe uma etiqueta com esse nome';
  return null;
}

export const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

export const isHexColor = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);
