// Estado vazio da lista de cupons (sem cupons ou nenhum nos filtros).
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Plus } from 'lucide-react';
import type { Coupon } from '@/lib/coupons/adminCoupons';

interface Props {
  coupons: Coupon[];
  onNew: () => void;
}

export function CouponsEmptyState({ coupons, onNew: handleNew }: Props) {
  return (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {coupons.length === 0 ? 'Nenhum cupom encontrado' : 'Nenhum cupom corresponde aos filtros'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {coupons.length === 0
                ? 'Crie seu primeiro cupom promocional para atrair mais clientes.'
                : 'Tente ajustar os filtros para ver mais resultados.'
              }
            </p>
            {coupons.length === 0 && (
              <Button onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Cupom
              </Button>
            )}
          </CardContent>
        </Card>
  );
}
