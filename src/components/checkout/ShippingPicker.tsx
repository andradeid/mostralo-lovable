// Checkout › "Receber em casa (Correios ou transportadora)": CEP → endereço (ViaCEP) → opções de frete.
// A cotação vem da função shipping-quote; o servidor refaz a cotação ao gravar o pedido.
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { brl } from '@/lib/brl';
import { safeLocalStorage as safeStorage } from '@/lib/safeStorage';
import {
  cartLineForQuote, deliveryDaysText, formatCep, lookupCep, normalizeCep, optionLabel, parseShippingAddress, quoteShipping,
  type ShippingAddress, type ShippingOption,
} from '@/lib/shipping/shippingClient';

export interface ShippingSelection {
  address: ShippingAddress | null;
  option: ShippingOption | null;
}

interface Props {
  storeId: string;
  items: { id: string; quantity: number }[];
  primaryColor: string;
  onChange: (value: ShippingSelection) => void;
  /** Muda para forçar nova cotação (ex.: servidor disse que o preço mudou). */
  refreshKey?: number;
}

interface Fields { cep: string; street: string; number: string; complement: string; district: string; city: string; state: string }
const EMPTY: Fields = { cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' };

export function ShippingPicker({ storeId, items, primaryColor, onChange, refreshKey = 0 }: Props) {
  const storageKey = `shipping_address_${storeId}`;
  const [f, setF] = useState<Fields>(() => {
    try {
      const raw = safeStorage.getItem(storageKey);
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch { return EMPTY; }
  });
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'found' | 'manual'>('idle');
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const lastCep = useRef<string | null>(null);

  const cep = normalizeCep(f.cep);
  const itemsKey = items.map((i) => `${i.id}:${i.quantity}`).join('|');

  // Endereço pelo CEP
  useEffect(() => {
    if (!cep || cep === lastCep.current) return;
    lastCep.current = cep;
    let alive = true;
    setCepStatus('loading');
    lookupCep(cep).then((a) => {
      if (!alive) return;
      if (a) {
        setF((prev) => ({ ...prev, street: a.street || prev.street, district: a.district || prev.district, city: a.city, state: a.state }));
        setCepStatus(a.street ? 'found' : 'manual');
      } else {
        setCepStatus('manual');
      }
    });
    return () => { alive = false; };
  }, [cep]);

  // Cotação (CEP válido + carrinho)
  useEffect(() => {
    if (!cep || !items.length) { setOptions([]); return; }
    let alive = true;
    setQuoting(true);
    setQuoteError(null);
    quoteShipping({ storeId, postalCode: cep, items: items.map(cartLineForQuote) }).then((r) => {
      if (!alive) return;
      setQuoting(false);
      if (r.ok === true) {
        setOptions(r.options);
        setSelectedId((cur) => (cur && r.options.some((o) => o.service_id === cur) ? cur : r.options[0]?.service_id ?? null));
      } else {
        setOptions([]);
        setSelectedId(null);
        setQuoteError((r as { message: string }).message);
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, itemsKey, storeId, refreshKey]);

  // Devolve a seleção e guarda o endereço no aparelho
  useEffect(() => {
    const address = parseShippingAddress({ postal_code: f.cep, street: f.street, number: f.number, complement: f.complement, district: f.district, city: f.city, state: f.state });
    const option = options.find((o) => o.service_id === selectedId) ?? null;
    onChange({ address, option });
    try { safeStorage.setItem(storageKey, JSON.stringify(f)); } catch { /* sem armazenamento */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, options, selectedId]);

  const set = (patch: Partial<Fields>) => setF((prev) => ({ ...prev, ...patch }));
  const showAddress = cepStatus === 'found' || cepStatus === 'manual' || !!f.street;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="ship-cep">CEP</Label>
        <Input
          id="ship-cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={f.cep}
          onChange={(e) => set({ cep: e.target.value })}
          onBlur={() => cep && set({ cep: formatCep(cep) })}
          className="max-w-[200px]"
        />
        {cepStatus === 'loading' && <p className="text-xs text-muted-foreground">Buscando endereço…</p>}
        {cepStatus === 'found' && <p className="text-xs text-muted-foreground">{f.street}{f.district ? `, ${f.district}` : ''} · {f.city} - {f.state}</p>}
        {f.cep && !cep && <p className="text-xs text-destructive">CEP com 8 números.</p>}
      </div>

      {showAddress && (
        <div className="grid grid-cols-2 gap-2">
          {cepStatus !== 'found' && (
            <>
              <div className="col-span-2 space-y-1"><Label htmlFor="ship-street">Rua</Label>
                <Input id="ship-street" autoComplete="address-line1" value={f.street} onChange={(e) => set({ street: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="ship-district">Bairro</Label>
                <Input id="ship-district" value={f.district} onChange={(e) => set({ district: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="ship-city">Cidade / UF</Label>
                <div className="flex gap-1">
                  <Input id="ship-city" autoComplete="address-level2" value={f.city} onChange={(e) => set({ city: e.target.value })} />
                  <Input aria-label="UF" maxLength={2} className="w-14 uppercase" value={f.state} onChange={(e) => set({ state: e.target.value.toUpperCase() })} />
                </div></div>
            </>
          )}
          <div className="space-y-1"><Label htmlFor="ship-number">Número</Label>
            <Input id="ship-number" inputMode="numeric" value={f.number} onChange={(e) => set({ number: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="ship-comp">Complemento</Label>
            <Input id="ship-comp" placeholder="Opcional" value={f.complement} onChange={(e) => set({ complement: e.target.value })} /></div>
        </div>
      )}

      {cep && (
        <div className="space-y-2" role="radiogroup" aria-label="Opções de frete">
          <p className="text-sm font-semibold">Escolha o frete</p>
          {quoting && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Calculando frete…</p>}
          {!quoting && quoteError && <p className="text-sm text-destructive">{quoteError}</p>}
          {!quoting && options.map((o) => {
            const selected = o.service_id === selectedId;
            return (
              <Button
                key={o.service_id}
                type="button"
                role="radio"
                aria-checked={selected}
                variant="outline"
                onClick={() => setSelectedId(o.service_id)}
                className="w-full h-auto min-h-12 justify-between gap-3 py-2 px-3 font-normal"
                style={{ borderWidth: 2, borderColor: selected ? primaryColor : undefined }}
              >
                <span className="flex items-center gap-3 text-left">
                  <span className="h-4 w-4 rounded-full border-2 shrink-0" style={{ borderColor: selected ? primaryColor : undefined, borderWidth: selected ? 5 : 2 }} />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{optionLabel(o)}</span>
                    <span className="text-xs text-muted-foreground">Chega em {deliveryDaysText(o.delivery_days)}</span>
                  </span>
                </span>
                <span className="text-sm font-semibold">{o.free ? 'Grátis' : brl(o.price)}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
