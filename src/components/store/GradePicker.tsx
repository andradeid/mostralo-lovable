// Escolha de cor e tamanho na loja (página do produto e janela do produto).
// Esgotado fica riscado e desabilitado, não some. Avisa "Últimas N unidades".
import { useEffect, useMemo, useState } from 'react';
import {
  findVariant, initialSelection, isColorAttribute, normalizeGrade, pickerOptions, selectValue,
  type Combination, type GradeVariant,
} from '@/lib/grade/grade';

interface Props<V extends GradeVariant> {
  grade: unknown;
  variants: V[];
  onChange: (variant: V | null) => void;
  primaryColor?: string;
}

export function GradePicker<V extends GradeVariant>({ grade: rawGrade, variants, onChange, primaryColor = '#111827' }: Props<V>) {
  const grade = useMemo(() => normalizeGrade(rawGrade), [rawGrade]);
  const [selection, setSelection] = useState<Combination>({});

  useEffect(() => {
    if (grade) setSelection(initialSelection(grade, variants));
  }, [grade, variants]);

  const chosen = grade ? findVariant(grade, variants, selection) : null;
  useEffect(() => {
    onChange(chosen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.id, chosen?.name]);

  if (!grade) return null;
  const groups = pickerOptions(grade, variants, selection);
  const stock = chosen && chosen.track_stock && chosen.stock_quantity != null ? Math.max(0, Number(chosen.stock_quantity)) : null;
  const missing = grade.attributes.filter((a) => !selection[a.name]).map((a) => a.name.toLowerCase());

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const attr = grade.attributes.find((a) => a.name === g.name)!;
        const color = isColorAttribute(attr);
        return (
          <fieldset key={g.name} className="space-y-2">
            <legend className="text-sm font-semibold mb-2">
              {g.name}{selection[g.name] && <span className="font-normal text-muted-foreground">: {selection[g.name]}</span>}
            </legend>
            <div className={color ? 'flex flex-wrap gap-3' : 'flex flex-wrap gap-2'}>
              {g.options.map((o) => {
                const pick = () => o.available && setSelection(selectValue(grade, variants, selection, g.name, o.value));
                if (color) {
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={pick}
                      disabled={!o.available}
                      aria-pressed={o.selected}
                      aria-label={`${g.name} ${o.value}${o.available ? '' : ' (esgotado)'}`}
                      title={o.value}
                      className={`relative w-11 h-11 rounded-full border transition ${o.available ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                      style={{
                        background: o.hex || '#e5e7eb',
                        outline: o.selected ? `2px solid ${primaryColor}` : 'none',
                        outlineOffset: 3,
                      }}
                    >
                      {!o.hex && <span className="text-[10px] font-semibold text-gray-700">{o.value.slice(0, 3)}</span>}
                      {!o.available && <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true"><span className="block w-full h-px bg-gray-500 rotate-45" /></span>}
                    </button>
                  );
                }
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={pick}
                    disabled={!o.available}
                    aria-pressed={o.selected}
                    aria-label={`${g.name} ${o.value}${o.available ? '' : ' (esgotado)'}`}
                    className={`min-w-11 h-11 px-3 rounded-lg border text-sm font-semibold transition ${
                      o.selected ? 'text-white' : o.available ? 'bg-background hover:border-foreground/50' : 'bg-muted text-muted-foreground line-through cursor-not-allowed'
                    }`}
                    style={o.selected ? { background: primaryColor, borderColor: primaryColor } : undefined}
                  >
                    {o.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      <p className={`text-sm ${stock !== null && stock > 0 && stock <= 3 ? 'text-orange-700 dark:text-orange-400 font-medium' : 'text-muted-foreground'}`}>
        {missing.length
          ? `Escolha ${missing.join(' e ')}`
          : stock === 0
            ? 'Esgotado nesta combinação'
            : stock !== null && stock <= 3
              ? `Últimas ${stock} unidade${stock > 1 ? 's' : ''}`
              : 'Em estoque'}
      </p>
    </div>
  );
}
