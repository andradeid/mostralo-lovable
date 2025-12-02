import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, CheckCircle2, Rss, FileSpreadsheet, Bot, ShoppingCart, Instagram, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

export default function ProductFeedsGuidePage() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      if (!profile?.id) return;

      try {
        const { data: store, error } = await supabase
          .from('stores')
          .select('slug, name')
          .eq('owner_id', profile.id)
          .single();

        if (store && !error) {
          setStoreSlug(store.slug);
          setStoreName(store.name);
        }
      } catch (error) {
        console.error('Erro ao buscar loja:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [profile]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mostralo.com.br';
  
  const feeds = [
    {
      name: 'Google Shopping',
      description: 'Feed XML para Google Merchant Center',
      url: `${baseUrl}/loja/${storeSlug}/feed.xml`,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      name: 'Instagram / Meta Commerce',
      description: 'Feed CSV para Instagram Shopping e Facebook Shop',
      url: `${baseUrl}/loja/${storeSlug}/feed.csv`,
      icon: Instagram,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      name: 'XML para IA / Chatbots',
      description: 'Feed XML completo para integração com assistentes de IA',
      url: `${baseUrl}/loja/${storeSlug}/info.xml`,
      icon: Bot,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `URL do ${label} copiada para a área de transferência`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!storeSlug) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Você precisa ter uma loja configurada para acessar os feeds de produtos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Rss className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Feeds de Produtos</h1>
          <p className="text-muted-foreground">
            URLs para integrar seus produtos com Google Shopping, Instagram e assistentes de IA
          </p>
        </div>
      </div>

      {/* Loja Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Sua Loja</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{storeName}</Badge>
            <span className="text-muted-foreground text-sm">({storeSlug})</span>
          </div>
        </CardContent>
      </Card>

      {/* Feeds URLs */}
      <div className="grid gap-4">
        {feeds.map((feed) => (
          <Card key={feed.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feed.bgColor}`}>
                    <feed.icon className={`h-5 w-5 ${feed.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feed.name}</CardTitle>
                    <CardDescription>{feed.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm break-all">{feed.url}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(feed.url, feed.name)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(feed.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Guia Google Merchant Center */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Como configurar no Google Merchant Center</CardTitle>
              <CardDescription>Passo a passo para adicionar seu feed ao Google Shopping</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Acesse o Google Merchant Center</p>
                <p className="text-sm text-muted-foreground">
                  Vá para{' '}
                  <a 
                    href="https://merchants.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    merchants.google.com
                  </a>
                  {' '}e faça login com sua conta Google
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Adicione um novo feed</p>
                <p className="text-sm text-muted-foreground">
                  Vá em Produtos → Feeds → Adicionar feed principal
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Selecione "Busca programada"</p>
                <p className="text-sm text-muted-foreground">
                  Escolha a opção de URL e cole o link do feed XML da sua loja
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">4</Badge>
              <div>
                <p className="font-medium">Configure a frequência de atualização</p>
                <p className="text-sm text-muted-foreground">
                  Recomendamos atualização diária para manter preços e estoque sincronizados
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guia Meta Commerce */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Instagram className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <CardTitle>Como configurar no Instagram / Facebook Shop</CardTitle>
              <CardDescription>Passo a passo para adicionar seu catálogo ao Meta Commerce Manager</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Acesse o Gerenciador de Comércio</p>
                <p className="text-sm text-muted-foreground">
                  Vá para{' '}
                  <a 
                    href="https://business.facebook.com/commerce" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    business.facebook.com/commerce
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Crie um novo catálogo</p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Criar Catálogo" e selecione a categoria do seu negócio
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Adicione uma fonte de dados</p>
                <p className="text-sm text-muted-foreground">
                  Escolha "Feed de dados" → "Feed agendado" → Cole o URL do feed CSV
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">4</Badge>
              <div>
                <p className="font-medium">Vincule ao Instagram Shopping</p>
                <p className="text-sm text-muted-foreground">
                  Nas configurações do catálogo, vincule sua conta do Instagram Business
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Requisitos para aprovação dos feeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Produtos devem ter imagens de alta qualidade (mínimo 100x100px)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Preços devem estar sempre atualizados</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Descrições claras e sem caracteres especiais problemáticos</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Produtos indisponíveis aparecem como "out_of_stock" automaticamente</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
