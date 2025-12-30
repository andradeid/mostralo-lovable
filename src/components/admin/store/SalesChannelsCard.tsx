import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Smartphone, Tablet, UtensilsCrossed, Store } from 'lucide-react';
import { useSalesChannels } from '@/hooks/useSalesChannels';

interface SalesChannelsCardProps {
  storeId: string;
}

interface ChannelConfig {
  key: 'delivery_enabled' | 'ifood_enabled' | 'totem_enabled' | 'mesa_enabled' | 'pdv_enabled';
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgActive: string;
  bgInactive: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    key: 'delivery_enabled',
    name: 'Delivery',
    description: 'Vendas pelo cardápio online',
    icon: Truck,
    color: 'text-green-600',
    bgActive: 'bg-green-50 dark:bg-green-950/30',
    bgInactive: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    key: 'ifood_enabled',
    name: 'iFood',
    description: 'Integração com marketplace iFood',
    icon: Smartphone,
    color: 'text-[#ea1d2c]',
    bgActive: 'bg-red-50 dark:bg-red-950/30',
    bgInactive: 'bg-gray-50 dark:bg-gray-950/30',
  },
  {
    key: 'totem_enabled',
    name: 'Totem',
    description: 'Autoatendimento no ponto de venda',
    icon: Tablet,
    color: 'text-orange-500',
    bgActive: 'bg-orange-50 dark:bg-orange-950/30',
    bgInactive: 'bg-gray-50 dark:bg-gray-950/30',
  },
  {
    key: 'mesa_enabled',
    name: 'Mesa',
    description: 'Cardápio digital nas mesas',
    icon: UtensilsCrossed,
    color: 'text-purple-600',
    bgActive: 'bg-purple-50 dark:bg-purple-950/30',
    bgInactive: 'bg-gray-50 dark:bg-gray-950/30',
  },
  {
    key: 'pdv_enabled',
    name: 'PDV/Balcão',
    description: 'Vendas no balcão e caixa',
    icon: Store,
    color: 'text-blue-600',
    bgActive: 'bg-blue-50 dark:bg-blue-950/30',
    bgInactive: 'bg-gray-50 dark:bg-gray-950/30',
  },
];

export function SalesChannelsCard({ storeId }: SalesChannelsCardProps) {
  const { channels, loading, updating, updateChannel } = useSalesChannels(storeId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Canais de Vendas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Canais de Vendas</CardTitle>
        <CardDescription>Ative ou desative os canais de atendimento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const isEnabled = channels?.[channel.key] ?? true;

          return (
            <div
              key={channel.key}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isEnabled ? channel.bgActive : channel.bgInactive
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background/80 ${channel.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{channel.name}</span>
                    <Badge
                      variant={isEnabled ? 'default' : 'secondary'}
                      className={`text-xs px-1.5 py-0 ${
                        isEnabled 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isEnabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(value) => updateChannel(channel.key, value)}
                disabled={updating}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
