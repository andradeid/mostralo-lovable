// Edição da categoria: pizza com mais de um sabor (meio a meio).
// Os tamanhos vêm das variações dos produtos da categoria (mesmo nome em todos os sabores).
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

export interface MultiFlavorValue {
  enabled: boolean;
  pricing: 'average' | 'highest';
  max: Record<string, number>;
}

interface Props {
  categoryId: string;
  value: MultiFlavorValue;
  onChange: (v: MultiFlavorValue) => void;
  onLoaded: (v: MultiFlavorValue) => void;
}

export function CategoryMultiFlavorSection({ categoryId, value, onChange, onLoaded }: Props) {
  const [sizes, setSizes] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: cat }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('multi_flavor_enabled, multi_flavor_pricing, multi_flavor_max' as any).eq('id', categoryId).maybeSingle(),
        supabase.from('products').select('id').eq('category_id', categoryId),
      ]);
      const ids = (prods ?? []).map((p: any) => p.id);
      const { data: vars } = ids.length
        ? await supabase.from('product_variants').select('name, display_order').in('product_id', ids).order('display_order')
        : { data: [] as any[] };
      if (!alive) return;
      const seen = new Map<string, string>();
      for (const v of vars ?? []) {
        const k = String((v as any).name ?? '').trim();
        if (k && !seen.has(k.toLowerCase())) seen.set(k.toLowerCase(), k);
      }
      setSizes([...seen.values()]);
      const c = (cat ?? {}) as any;
      onLoaded({
        enabled: !!c.multi_flavor_enabled,
        pricing: c.multi_flavor_pricing === 'highest' ? 'highest' : 'average',
        max: (c.multi_flavor_max && typeof c.multi_flavor_max === 'object') ? c.multi_flavor_max : {},
      });
    })();
    return () => { alive = false; };
  }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = sizes.length ? sizes : ['*'];
  const maxOf = (k: string) => {
    const hit = Object.entries(value.max).find(([key]) => key.trim().toLowerCase() === k.toLowerCase());
    return hit ? Number(hit[1]) : (value.max['*'] ?? 2);
  };
  const setMax = (k: string, n: number) => onChange({ ...value, max: { ...value.max, [k]: n } });

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor="multi_flavor" className="text-sm font-semibold">Pizza com mais de um sabor (meio a meio)</Label>
          <p className="text-xs text-muted-foreground">O cliente monta a pizza com sabores desta categoria.</p>
        </div>
        <Switch id="multi_flavor" checked={value.enabled} onCheckedChange={(enabled) => onChange({ ...value, enabled })} />
      </div>

      {value.enabled && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Até quantos sabores{sizes.length ? ', por tamanho' : ''}</p>
            {!sizes.length && (
              <p className="text-xs text-muted-foreground">Os produtos desta categoria não têm tamanhos (variações): vale um limite só.</p>
            )}
            {rows.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-sm w-24 truncate">{k === '*' ? 'Todas' : k}</span>
                <div className="flex gap-1" role="group" aria-label={`Sabores no tamanho ${k === '*' ? 'único' : k}`}>
                  {[1, 2, 3, 4].map((n) => {
                    const on = maxOf(k) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setMax(k, n)}
                        className={`h-10 w-10 rounded-md border text-sm ${on ? 'border-primary bg-primary/10 font-bold text-primary' : ''}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Como cobrar</p>
            <label className={`flex gap-2 rounded-md border p-2 text-sm ${value.pricing === 'average' ? 'border-primary bg-primary/5' : ''}`}>
              <input type="radio" name="mf_pricing" checked={value.pricing === 'average'} onChange={() => onChange({ ...value, pricing: 'average' })} />
              <span><strong>Média dos sabores</strong> (recomendado). Ex.: R$ 49,90 + R$ 59,90 = R$ 54,90.</span>
            </label>
            <label className={`flex gap-2 rounded-md border p-2 text-sm ${value.pricing === 'highest' ? 'border-primary bg-primary/5' : ''}`}>
              <input type="radio" name="mf_pricing" checked={value.pricing === 'highest'} onChange={() => onChange({ ...value, pricing: 'highest' })} />
              <span>
                <strong>Sabor mais caro</strong>. Ex.: R$ 49,90 + R$ 59,90 = R$ 59,90.
                <span className="block text-xs text-amber-700">Alguns Procons e leis municipais consideram essa cobrança abusiva. Confira a regra da sua cidade.</span>
              </span>
            </label>
          </div>

          <p className="text-xs text-muted-foreground">Borda e extras: valem para a pizza inteira, pelos adicionais do 1º sabor, cobrados uma vez.</p>
        </>
      )}
    </div>
  );
}
