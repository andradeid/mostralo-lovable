// Escolha de sabores (meio a meio) na página do produto.
import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { PizzaFlavorsApi } from '@/hooks/usePizzaFlavors';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function PizzaIcon({ parts }: { parts: number }) {
  const lines = Array.from({ length: parts > 1 ? parts : 0 }, (_, i) => {
    const a = (-90 + (360 / parts) * i) * (Math.PI / 180);
    return { x: 13 + 11 * Math.cos(a), y: 13 + 11 * Math.sin(a) };
  });
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      {lines.map((p, i) => (
        <line key={i} x1="13" y1="13" x2={p.x} y2={p.y} stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

interface Props {
  pf: PizzaFlavorsApi;
  mainName: string;
  sizeName: string | null;
  primaryColor: string;
}

export function PizzaFlavorPicker({ pf, mainName, sizeName, primaryColor }: Props) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? pf.options.filter((o) => o.name.toLowerCase().includes(q)) : pf.options;
  }, [pf.options, search]);

  if (!pf.enabled) return null;
  const counts = Array.from({ length: pf.max }, (_, i) => i + 1);
  const fraction = pf.count > 1 ? `1/${pf.count} ` : '';

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Quantos sabores?</h3>
      <div className="flex gap-2">
        {counts.map((n) => {
          const selected = pf.count === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => pf.chooseCount(n)}
              aria-pressed={selected}
              className="flex-1 min-h-[64px] rounded-xl border flex flex-col items-center justify-center gap-1 text-sm transition-colors"
              style={selected ? { borderColor: primaryColor, borderWidth: 2, color: primaryColor, fontWeight: 700 } : undefined}
            >
              <PizzaIcon parts={n} />
              {n === 1 ? '1 sabor' : `${n} sabores`}
            </button>
          );
        })}
      </div>

      {pf.active && (
        <div className="rounded-xl border bg-card divide-y">
          <div className="flex items-center justify-between p-3 text-sm">
            <span className="font-medium">{fraction}{mainName}</span>
            {pf.mainPrice !== null && <span className="text-muted-foreground">{brl(pf.mainPrice)}</span>}
          </div>
          {pf.others.map((id, slot) => {
            const opt = pf.chosen[slot];
            return (
              <button
                key={slot}
                type="button"
                onClick={() => { setSearch(''); setOpenSlot(slot); }}
                className="w-full flex items-center justify-between p-3 text-sm min-h-[48px] text-left"
              >
                {opt ? (
                  <>
                    <span className="font-medium">{fraction}{opt.name}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">{brl(opt.sizePrice)} <ChevronRight className="h-4 w-4" /></span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold" style={{ color: primaryColor }}>Escolher o {slot + 2}º sabor</span>
                    <ChevronRight className="h-4 w-4" style={{ color: primaryColor }} />
                  </>
                )}
              </button>
            );
          })}
          {pf.price !== null && (
            <div className="p-3 text-sm space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>Pizza{sizeName ? ` ${sizeName}` : ''}</span>
                <span>{brl(pf.price)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {pf.pricing === 'highest' ? 'Cobrado pelo sabor mais caro.' : 'Cobrado pela média dos sabores.'}
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={openSlot !== null} onOpenChange={(o) => !o && setOpenSlot(null)}>
        <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Escolha o {openSlot !== null ? openSlot + 2 : ''}º sabor</DialogTitle>
            <DialogDescription>
              {sizeName ? `Preço de cada sabor no tamanho ${sizeName}.` : 'Preço de cada sabor.'}
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="busca-sabor" className="sr-only">Buscar sabor</label>
          <Input id="busca-sabor" placeholder="Buscar sabor" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="overflow-y-auto space-y-2 pr-1">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { if (openSlot !== null) pf.chooseFlavor(openSlot, o.id); setOpenSlot(null); }}
                className="w-full flex items-center gap-3 p-2 rounded-lg border text-left min-h-[56px] hover:bg-muted/50"
              >
                {o.image_url ? (
                  <img src={o.image_url} alt="" className="w-11 h-11 rounded-md object-cover flex-none" loading="lazy" />
                ) : (
                  <div className="w-11 h-11 rounded-md bg-muted flex-none" />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-sm">{o.name}</span>
                  {o.description && <span className="block text-xs text-muted-foreground line-clamp-1">{o.description.replace(/<[^>]*>/g, ' ')}</span>}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">{brl(o.sizePrice)}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground p-2">Nenhum sabor encontrado.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
