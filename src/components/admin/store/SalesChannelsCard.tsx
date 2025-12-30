import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, UtensilsCrossed, Store, Copy, Check, Link2 } from 'lucide-react';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface SalesChannelsCardProps {
  storeId: string;
  storeSlug: string;
}

interface ChannelConfig {
  key: 'delivery_enabled' | 'ifood_enabled' | 'totem_enabled' | 'mesa_enabled' | 'pdv_enabled';
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgActive: string;
  bgInactive: string;
  getUrl?: (slug: string) => string;
  urlNote?: string;
}

const CHANNELS: ChannelConfig[] = [
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
    getUrl: (slug: string) => `/totem/${slug}`,
  },
  {
    key: 'mesa_enabled',
    name: 'Mesa',
    description: 'Cardápio digital nas mesas',
    icon: UtensilsCrossed,
    color: 'text-purple-600',
    bgActive: 'bg-purple-50 dark:bg-purple-950/30',
    bgInactive: 'bg-gray-50 dark:bg-gray-950/30',
    getUrl: (slug: string) => `/mesa/${slug}/{numero}`,
    urlNote: 'Substitua {numero} pelo número da mesa',
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

export function SalesChannelsCard({ storeId, storeSlug }: SalesChannelsCardProps) {
  const { channels, loading, updating, updateChannel } = useSalesChannels(storeId);
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (channelKey: string, url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedKey(channelKey);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

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

          const channelUrl = channel.getUrl ? channel.getUrl(storeSlug) : null;
          const isCopied = copiedKey === channel.key;

          return (
            <div
              key={channel.key}
              className={`p-3 rounded-lg transition-colors ${
                isEnabled ? channel.bgActive : channel.bgInactive
              }`}
            >
              <div className="flex items-center justify-between">
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

              {/* Link copiável */}
              {channelUrl && (
                <div className="mt-2 ml-11">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1.5 bg-background/60 rounded px-2 py-1 text-xs">
                      <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">
                        {window.location.origin}{channelUrl}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(channel.key, channelUrl)}
                      className="h-7 px-2 text-xs"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  {channel.urlNote && (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                      ⓘ {channel.urlNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
