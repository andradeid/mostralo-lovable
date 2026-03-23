import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Store, UtensilsCrossed, Calendar, Tablet, Smartphone, TrendingUp, TrendingDown, Medal } from 'lucide-react';
import { ChannelRevenue } from '@/hooks/useRevenueByChannel';
import { cn } from '@/lib/utils';

interface ChannelRevenueCardsProps {
  channels: ChannelRevenue[];
  isLoading?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, Smartphone, Tablet, Store, UtensilsCrossed, Calendar,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const MEDAL_STYLES = [
  'text-yellow-500', // 🥇
  'text-gray-400',   // 🥈
  'text-amber-600',  // 🥉
];

export function ChannelRevenueCards({ channels, isLoading }: ChannelRevenueCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-full mb-3" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Sort by total descending for ranking
  const sorted = [...channels].sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map((channel, idx) => {
        const IconComponent = iconMap[channel.icon] || ShoppingCart;
        const isTop3 = idx < 3 && channel.total > 0;
        const isFirst = idx === 0 && channel.total > 0;

        return (
          <Card
            key={channel.categoryName}
            className={cn(
              'relative overflow-hidden transition-shadow hover:shadow-md',
              isFirst && 'border-primary/30 bg-primary/[0.02]'
            )}
          >
            <CardContent className="p-4">
              {/* Header: icon + medal */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${channel.color}15` }}
                >
                  <IconComponent className="h-4 w-4" style={{ color: channel.color }} />
                </div>
                {isTop3 && (
                  <Medal className={cn('h-4 w-4', MEDAL_STYLES[idx])} />
                )}
              </div>

              {/* Channel name */}
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {channel.channel}
              </p>

              {/* Value - main highlight */}
              <p
                className="text-xl font-bold leading-none mb-2"
                style={{ color: channel.total > 0 ? channel.color : undefined }}
              >
                {formatCurrency(channel.total)}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                <span className="font-semibold" style={{ color: channel.total > 0 ? channel.color : undefined }}>
                  {channel.percentage.toFixed(1)}%
                </span>
                <span>•</span>
                <span>{channel.count} {channel.count === 1 ? 'transação' : 'transações'}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(channel.percentage, 100)}%`,
                    background: channel.total > 0
                      ? `linear-gradient(90deg, ${channel.color}90, ${channel.color})`
                      : 'transparent',
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
