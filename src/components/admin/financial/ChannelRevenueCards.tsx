import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Store, UtensilsCrossed, Calendar, Tablet } from 'lucide-react';
import { ChannelRevenue } from '@/hooks/useRevenueByChannel';

interface ChannelRevenueCardsProps {
  channels: ChannelRevenue[];
  isLoading?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  Tablet,
  Store,
  UtensilsCrossed,
  Calendar,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ChannelRevenueCards({ channels, isLoading }: ChannelRevenueCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-full mb-3" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {channels.map((channel) => {
        const IconComponent = iconMap[channel.icon] || ShoppingCart;
        
        return (
          <Card 
            key={channel.categoryName} 
            className="relative overflow-hidden"
          >
            <CardContent className="p-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${channel.color}20` }}
              >
                <IconComponent 
                  className="h-5 w-5" 
                  style={{ color: channel.color }} 
                />
              </div>
              
              <p className="text-sm text-muted-foreground font-medium">
                {channel.channel}
              </p>
              
              <p 
                className="text-xl md:text-2xl font-bold mt-1"
                style={{ color: channel.color }}
              >
                {formatCurrency(channel.total)}
              </p>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="font-medium" style={{ color: channel.color }}>
                  {channel.percentage.toFixed(1)}%
                </span>
                <span>•</span>
                <span>{channel.count} {channel.count === 1 ? 'transação' : 'transações'}</span>
              </div>
              
              {/* Barra de progresso */}
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(channel.percentage, 100)}%`,
                    backgroundColor: channel.color 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
