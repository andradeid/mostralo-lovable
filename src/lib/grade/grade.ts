// Grade de estoque (cor × tamanho): regras puras usadas pelo painel, pela loja e pelo PDV.
// products.grade guarda a definição; cada combinação é uma linha de product_variants com
// `attributes` ({"Cor":"Preto","Tamanho":"37"}), estoque e código de barras próprios.

export interface GradeValue {
  value: string;
  /** Cor da bolinha (só para atributos de cor). */
  hex?: string | null;
}

export interface GradeAttribute {
  name: string;
  values: GradeValue[];
}

export interface Grade {
  attributes: GradeAttribute[];
}

export type Combination = Record<string, string>;

/** Linha de product_variants vista pela grade. */
export interface GradeVariant {
  id?: string;
  name: string;
  price: number;
  is_default?: boolean;
  attributes?: Combination | null;
  barcode?: string | null;
  track_stock?: boolean | null;
  stock_quantity?: number | null;
}

export const MAX_GRADE_ATTRIBUTES = 2;

/** Grade válida: 1 ou 2 características, cada uma com pelo menos um valor. */
export function normalizeGrade(raw: unknown): Grade | null {
  if (!raw || typeof raw !== 'object') return null;
  const attrs = (raw as { attributes?: unknown }).attributes;
  if (!Array.isArray(attrs)) return null;
  const attributes: GradeAttribute[] = [];
  for (const a of attrs) {
    if (attributes.length >= MAX_GRADE_ATTRIBUTES) break;
    const name = typeof a?.name === 'string' ? a.name.trim() : '';
    if (!name) continue;
    const seen = new Set<string>();
    const values: GradeValue[] = [];
    for (const v of Array.isArray(a.values) ? a.values : []) {
      const value = (typeof v === 'string' ? v : typeof v?.value === 'string' ? v.value : '').trim();
      if (!value || seen.has(value.toLowerCase())) continue;
      seen.add(value.toLowerCase());
      values.push(typeof v === 'object' && v?.hex ? { value, hex: String(v.hex) } : { value });
    }
    if (values.length) attributes.push({ name, values });
  }
  return attributes.length ? { attributes } : null;
}

/** Variações da grade (têm `attributes`). */
export function isGradeVariant(v: { attributes?: unknown }): boolean {
  return !!v.attributes && typeof v.attributes === 'object';
}

/** "Preto / 37" — na ordem das características da grade. */
export function combinationName(grade: Grade, combo: Combination): string {
  return grade.attributes.map((a) => combo[a.name]).filter(Boolean).join(' / ');
}

function comboKey(grade: Grade, combo: Combination | null | undefined): string {
  return grade.attributes.map((a) => (combo?.[a.name] ?? '').toLowerCase()).join('\u0001');
}

/** Todas as combinações, na ordem da grade (1ª característica nas linhas). */
export function gradeCombinations(grade: Grade): Combination[] {
  let out: Combination[] = [{}];
  for (const attr of grade.attributes) {
    const next: Combination[] = [];
    for (const partial of out) for (const v of attr.values) next.push({ ...partial, [attr.name]: v.value });
    out = next;
  }
  return out;
}

/**
 * Monta as variações a partir da grade, mantendo id, estoque e código das combinações que já existiam
 * (mesmo valor em cada característica). Combinação nova nasce com estoque 0.
 */
export function buildGradeVariants(grade: Grade, existing: GradeVariant[], price: number): (GradeVariant & { is_default: boolean })[] {
  const byKey = new Map<string, GradeVariant>();
  for (const v of existing) if (isGradeVariant(v)) byKey.set(comboKey(grade, v.attributes), v);
  return gradeCombinations(grade).map((combo, i) => {
    const old = byKey.get(comboKey(grade, combo));
    return {
      id: old?.id,
      name: combinationName(grade, combo),
      price,
      is_default: i === 0,
      attributes: combo,
      barcode: old?.barcode ?? null,
      track_stock: true,
      stock_quantity: Math.max(0, Number(old?.stock_quantity ?? 0) || 0),
    };
  });
}

/** Estoque da combinação (sem controle = ilimitado). */
export function variantStock(v: GradeVariant): number {
  if (!v.track_stock || v.stock_quantity == null) return Number.POSITIVE_INFINITY;
  return Math.max(0, Number(v.stock_quantity) || 0);
}

export function totalGradeStock(variants: GradeVariant[]): number {
  return variants.reduce((s, v) => s + (isGradeVariant(v) ? Math.max(0, Number(v.stock_quantity) || 0) : 0), 0);
}

/** Combinação escolhida (todas as características marcadas) ou null. */
export function findVariant<T extends GradeVariant>(grade: Grade, variants: T[], selection: Combination): T | null {
  if (grade.attributes.some((a) => !selection[a.name])) return null;
  const key = comboKey(grade, selection);
  return variants.find((v) => isGradeVariant(v) && comboKey(grade, v.attributes) === key) ?? null;
}

export interface PickerOption {
  value: string;
  hex?: string | null;
  selected: boolean;
  /** Existe combinação com estoque para este valor, dado o que já foi escolhido nas outras características. */
  available: boolean;
  /** Estoque da combinação exata (só quando todas as outras estão escolhidas). */
  stock: number | null;
}

/** Opções de cada característica para a loja/PDV: esgotado fica marcado, não some. */
export function pickerOptions(grade: Grade, variants: GradeVariant[], selection: Combination): { name: string; options: PickerOption[] }[] {
  return grade.attributes.map((attr) => {
    const others = grade.attributes.filter((a) => a.name !== attr.name);
    const options = attr.values.map((val) => {
      const matches = variants.filter((v) => {
        if (!isGradeVariant(v) || v.attributes?.[attr.name] !== val.value) return false;
        return others.every((o) => !selection[o.name] || v.attributes?.[o.name] === selection[o.name]);
      });
      const available = matches.some((v) => variantStock(v) > 0);
      const exact = others.every((o) => selection[o.name]) && matches.length === 1 ? variantStock(matches[0]) : null;
      return {
        value: val.value,
        hex: val.hex ?? null,
        selected: selection[attr.name] === val.value,
        available,
        stock: exact === null || exact === Number.POSITIVE_INFINITY ? null : exact,
      };
    });
    return { name: attr.name, options };
  });
}

/** Seleção inicial: primeira combinação com estoque (ou nada, se tudo esgotado). */
export function initialSelection(grade: Grade, variants: GradeVariant[]): Combination {
  const first = variants.find((v) => isGradeVariant(v) && variantStock(v) > 0);
  if (!first?.attributes) return {};
  const sel: Combination = {};
  for (const a of grade.attributes) if (first.attributes[a.name]) sel[a.name] = first.attributes[a.name];
  return sel;
}

/** Ao escolher um valor, limpa o que deixou de existir com estoque. */
export function selectValue(grade: Grade, variants: GradeVariant[], selection: Combination, attr: string, value: string): Combination {
  const next: Combination = { ...selection, [attr]: value };
  for (const a of grade.attributes) {
    if (a.name === attr || !next[a.name]) continue;
    const exists = findVariant(grade, variants, { ...next });
    if (exists && variantStock(exists) <= 0) delete next[a.name];
  }
  return next;
}

/** Característica de cor (mostra bolinhas). */
export function isColorAttribute(attr: GradeAttribute): boolean {
  return /^(cor|cores|color|colour)$/i.test(attr.name.trim()) || attr.values.some((v) => !!v.hex);
}

/** Tamanhos numéricos em sequência (ex.: 34 a 44). */
export function sizeRange(from: number, to: number): string[] {
  const out: string[] = [];
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from || to - from > 60) return out;
  for (let n = from; n <= to; n++) out.push(String(n));
  return out;
}

/** Pode ir para o carrinho: combinação escolhida e com estoque. */
export function gradeReadyToAdd(grade: unknown, variant: GradeVariant | null): boolean {
  if (!normalizeGrade(grade)) return true;
  if (!variant) return false;
  return !variant.track_stock || variant.stock_quantity == null || Number(variant.stock_quantity) > 0;
}
