// Página do produto: "Calcular frete e prazo" pelo CEP (só quando a loja tem envio por transportadora ligado).
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { brl } from '@/lib/brl';
import { safeLocalStorage } from '@/lib/safeStorage';
import { useStoreShippingSettings } from '@/hooks/storeCheckout/useStoreShippingSettings';
import { deliveryDaysText, normalizeCep, optionLabel, quoteShipping, type ShippingOption } from '@/lib/shipping/shippingClient';

interface Props {
  storeId: string;
  productId: string;
  variantId?: string | null;
  quantity?: number;
  allowsPickup?: boolean;
}

export function ShippingCalculator({ storeId, productId, variantId = null, quantity = 1, allowsPickup = false }: Props) {
  const settings = useStoreShippingSettings(storeId);
  const [cep, setCep] = useState(() => safeLocalStorage.getItem('last_shipping_cep') ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ options?: ShippingOption[]; error?: string } | null>(null);

  if (!settings?.enabled) return null;

  const calc = async () => {
    const c = normalizeCep(cep);
    if (!c) { setResult({ error: 'CEP com 8 números.' }); return; }
    safeLocalStorage.setItem('last_shipping_cep', cep);
    setLoading(true);
    const r = await quoteShipping({ storeId, postalCode: c, items: [{ product_id: productId, variant_id: variantId, quantity }] });
    setResult(r.ok === true ? { options: r.options } : { error: (r as { message: string }).message });
    setLoading(false);
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <label htmlFor="calc-cep" className="block text-sm font-medium">Calcular frete e prazo</label>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); calc(); }}>
        <Input id="calc-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} className="max-w-[180px]" />
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
        </Button>
      </form>
      {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
      {result?.options && (
        <ul className="space-y-1.5 text-sm">
          {result.options.map((o) => (
            <li key={o.service_id} className="flex justify-between gap-3">
              <span>{optionLabel(o)} · {deliveryDaysText(o.delivery_days)}</span>
              <strong>{o.free ? 'Grátis' : brl(o.price)}</strong>
            </li>
          ))}
          {allowsPickup && (
            <li className="flex justify-between gap-3 text-muted-foreground"><span>Retirar na loja</span><strong>Grátis</strong></li>
          )}
        </ul>
      )}
      <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-xs underline text-muted-foreground">
        Não sei meu CEP
      </a>
    </div>
  );
}
