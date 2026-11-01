import { Gift, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { GiftOption } from '@/hooks/storeCheckout/useCheckoutPromotion';

export interface CheckoutGift {
  options: GiftOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Brinde da promoção no checkout: mostra o que o cliente ganha e, se houver mais de um, deixa escolher. */
export function GiftPicker({ gift, primaryColor = '#FF9500' }: { gift?: CheckoutGift; primaryColor?: string }) {
  if (!gift || gift.options.length === 0) return null;
  const single = gift.options.length === 1;
  return (
    <Card className="border-2 p-4 space-y-3" style={{ borderColor: primaryColor }}>
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5" style={{ color: primaryColor }} />
        <p className="font-semibold text-sm">
          {single ? `Brinde grátis: ${gift.options[0].name}` : 'Escolha seu brinde grátis'}
        </p>
      </div>
      {!single && (
        <div className="grid gap-2" role="radiogroup" aria-label="Brinde">
          {gift.options.map((o) => {
            const on = gift.selectedId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => gift.onSelect(o.id)}
                className="flex items-center gap-3 rounded-lg border p-2 text-left min-h-[48px] transition-colors"
                style={on ? { borderColor: primaryColor, borderWidth: 2 } : undefined}
              >
                {o.image_url ? (
                  <img src={o.image_url} alt="" className="w-10 h-10 rounded-md object-cover flex-none" loading="lazy" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted flex-none" />
                )}
                <span className="flex-1 text-sm font-medium">{o.name}</span>
                {on && <Check className="w-4 h-4" style={{ color: primaryColor }} />}
              </button>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Vai junto com o seu pedido, sem custo.</p>
    </Card>
  );
}

/** Nome do brinde escolhido (para o resumo do pedido). */
export function selectedGiftName(gift?: CheckoutGift): string | null {
  if (!gift) return null;
  return gift.options.find((o) => o.id === gift.selectedId)?.name ?? null;
}
