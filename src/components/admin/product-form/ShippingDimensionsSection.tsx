// Peso e medidas para envio (Melhor Envio). Só aparece quando o envio para todo o Brasil está ligado.
// Vazio = embalagem padrão da loja. Vale para todas as cores e tamanhos da grade.
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { fetchShippingSettings, type StoreShippingSettings } from '@/lib/shipping/shippingClient';
import type { ProductFormApi } from './types';

type Field = 'shipping_weight_kg' | 'shipping_height_cm' | 'shipping_width_cm' | 'shipping_length_cm';

const show = (v: number | null | undefined) => (typeof v === 'number' && v > 0 ? String(v).replace('.', ',') : '');
const parse = (s: string) => {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

function DimInput({ form, name, label, placeholder }: { form: ProductFormApi; name: Field; label: string; placeholder: string }) {
  const value = form.watch(name);
  const [text, setText] = useState(show(value));
  useEffect(() => { setText((t) => (parse(t) === (value ?? null) ? t : show(value))); }, [value]);
  const error = form.formState.errors[name]?.message;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          form.setValue(name, parse(e.target.value), { shouldDirty: true, shouldValidate: true });
        }}
      />
      {error && <p className="text-xs text-destructive">{String(error)}</p>}
    </div>
  );
}

export function ShippingDimensionsSection({ form, storeId }: { form: ProductFormApi; storeId?: string }) {
  const [settings, setSettings] = useState<StoreShippingSettings | null>(null);
  useEffect(() => {
    if (!storeId) return;
    let alive = true;
    fetchShippingSettings(storeId).then((s) => alive && setSettings(s));
    return () => { alive = false; };
  }, [storeId]);

  if (!settings?.enabled) return null;
  const fmt = (n: number | string) => String(Number(n)).replace('.', ',');
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Peso e medidas para envio</h3>
          <p className="text-sm text-muted-foreground">
            Medidas da caixa já embalada. Deixe em branco para usar a embalagem padrão da loja
            ({fmt(settings.default_length_cm)} × {fmt(settings.default_width_cm)} × {fmt(settings.default_height_cm)} cm, {fmt(settings.default_weight_kg)} kg).
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DimInput form={form} name="shipping_weight_kg" label="Peso (kg)" placeholder={fmt(settings.default_weight_kg)} />
          <DimInput form={form} name="shipping_length_cm" label="Comprimento (cm)" placeholder={fmt(settings.default_length_cm)} />
          <DimInput form={form} name="shipping_width_cm" label="Largura (cm)" placeholder={fmt(settings.default_width_cm)} />
          <DimInput form={form} name="shipping_height_cm" label="Altura (cm)" placeholder={fmt(settings.default_height_cm)} />
        </div>
      </div>
    </>
  );
}
