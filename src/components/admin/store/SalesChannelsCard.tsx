import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, UtensilsCrossed, Store, Copy, Check, Link2 } from 'lucide-react';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Link } from 'react-router-dom';

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

const CHANNEL_MODULE_KEY: Record<ChannelConfig['key'], string> = {
  delivery_enabled: 'delivery',
  ifood_enabled: 'ifood_integration',
  totem_enabled: 'self_service_totem',
  mesa_enabled: 'self_service_table',
  pdv_enabled: 'pdv_comandas',
};

export function SalesChannelsCard({ storeId, storeSlug }: SalesChannelsCardProps) {
  const { channels, loading, updating, updateChannel } = useSalesChannels(storeId);
  const { loading: modulesLoading, hasModule } = useStoreModules(storeId);
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

  if (loading || modulesLoading) {
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

  const visibleChannels = CHANNELS.filter((channel) => {
    const moduleKey = CHANNEL_MODULE_KEY[channel.key];
    if (!moduleKey) return true;
    return hasModule(moduleKey);
  });

  const hiddenCount = CHANNELS.length - visibleChannels.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Canais de Vendas</CardTitle>
        <CardDescription>Ative ou desative os canais de atendimento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hiddenCount > 0 && (
          <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Alguns canais não estão disponíveis no seu plano.</p>
              <p className="text-xs text-muted-foreground">
                Faça upgrade para liberar todos os recursos.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link to="/dashboard/subscription">Ver planos</Link>
            </Button>
          </div>
        )}

        {visibleChannels.length === 0 ? (
          <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            Nenhum canal disponível para o seu plano no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleChannels.map((channel) => {
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg bg-background/80 ${channel.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{channel.name}</span>
                      <Badge
                        variant={isEnabled ? 'default' : 'secondary'}
                        className={`text-[10px] px-1 py-0 ${
                          isEnabled 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isEnabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{channel.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(value) => updateChannel(channel.key, value)}
                  disabled={updating}
                  className="data-[state=checked]:bg-green-500 shrink-0"
                />
              </div>

              {/* Link copiável */}
              {channelUrl && (
                <div className="mt-2 ml-7">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 flex items-center gap-1 bg-background/60 rounded px-1.5 py-0.5 text-[10px] min-w-0">
                      <Link2 className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">
                        {window.location.origin}{channelUrl}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(channel.key, channelUrl)}
                      className="h-6 w-6 p-0"
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {channel.urlNote && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 italic">
                      ⓘ {channel.urlNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
