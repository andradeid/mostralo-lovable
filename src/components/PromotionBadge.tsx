import { Badge } from '@/components/ui/badge';
import { Promotion } from '@/types/promotions';
import { Percent, Tag, TruckIcon, Gift } from 'lucide-react';

interface PromotionBadgeProps {
  promotion: Promotion;
  className?: string;
}

export const PromotionBadge = ({ promotion, className }: PromotionBadgeProps) => {
  const getBadgeContent = () => {
    switch (promotion.type) {
      case 'percentage':
        return {
          icon: <Percent className="w-3 h-3 mr-1" />,
          text: `${promotion.discount_percentage}% OFF`,
          variant: 'default' as const
        };
      case 'fixed_amount':
        return {
          icon: <Tag className="w-3 h-3 mr-1" />,
          text: `R$ ${promotion.discount_amount} OFF`,
          variant: 'default' as const
        };
      case 'free_delivery':
        return {
          icon: <TruckIcon className="w-3 h-3 mr-1" />,
          text: 'FRETE GRÁTIS',
          variant: 'secondary' as const
        };
      case 'bogo':
        return {
          icon: <Gift className="w-3 h-3 mr-1" />,
          text: `${promotion.bogo_buy_quantity}x${promotion.bogo_get_quantity}`,
          variant: 'destructive' as const
        };
      case 'first_order':
        return {
          icon: <Gift className="w-3 h-3 mr-1" />,
          text: '1ª COMPRA',
          variant: 'secondary' as const
        };
      default:
        return {
          icon: <Tag className="w-3 h-3 mr-1" />,
          text: 'PROMOÇÃO',
          variant: 'default' as const
        };
    }
  };

  const { icon, text, variant } = getBadgeContent();

  return (
    <Badge 
      variant={variant} 
      className={`flex items-center font-semibold ${className}`}
    >
      {icon}
      {text}
    </Badge>
  );
};
