import { Promotion } from '@/types/promotions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Tag, PartyPopper } from 'lucide-react';

interface PromotionSummaryProps {
  promotion: Promotion;
  discount: number;
  onRemove: () => void;
}

export const PromotionSummary = ({
  promotion,
  discount,
  onRemove
}: PromotionSummaryProps) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-green-900 dark:text-green-100">
              Promoção Aplicada!
            </h4>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {promotion.name}
            </p>
            
            {promotion.description && (
              <p className="text-xs text-green-700 dark:text-green-300">
                {promotion.description}
              </p>
            )}

            {promotion.code && (
              <div className="flex items-center gap-2 mt-2">
                <Tag className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-mono font-bold text-green-700 dark:text-green-300">
                  {promotion.code}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="bg-green-600 text-white dark:bg-green-500">
              Economia: R$ {discount.toFixed(2)}
            </Badge>
          </div>
        </div>

        <Button
          onClick={onRemove}
          variant="ghost"
          size="icon"
          className="shrink-0 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
