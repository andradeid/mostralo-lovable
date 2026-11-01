// Variações do produto (tamanhos/opções) com o preço de cada uma.
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/productPage/pricing';
import type { ProductVariant } from '@/lib/productPage/types';

interface Props {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  setSelectedVariant: (variant: ProductVariant) => void;
}

export function ProductVariantsList({ variants, selectedVariant, setSelectedVariant }: Props) {
  if (!(variants.length > 0)) return null;
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Opções disponíveis:</h3>
      <div className="grid gap-2">
        {variants.map((variant) => (
          <Card
            key={variant.id}
            className={`cursor-pointer transition-colors ${
              selectedVariant?.id === variant.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedVariant(variant)}
          >
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{variant.name}</p>
                  {variant.description && (
                    <p className="text-sm text-muted-foreground">
                      {variant.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatPrice(variant.price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
