import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, FileText, CreditCard, Grid3X3, Tag, MessageSquare, Lock, Image, Smartphone, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useStoreModules } from '@/hooks/useStoreModules';
import { DownloadButtons } from '@/components/share/DownloadButtons';
import { StoreFlyer } from '@/components/store-marketing/StoreFlyer';
import { StoreBusinessCard } from '@/components/store-marketing/StoreBusinessCard';
import { StoreMiniQR } from '@/components/store-marketing/StoreMiniQR';
import { StoreCoupon } from '@/components/store-marketing/StoreCoupon';
import { StoreWhatsAppSticker } from '@/components/store-marketing/StoreWhatsAppSticker';
import { StoreMenuTemplate } from '@/components/store-marketing/StoreMenuTemplate';
import { StoreSocialBanner } from '@/components/store-marketing/StoreSocialBanner';
import { StoreInstagramStory } from '@/components/store-marketing/StoreInstagramStory';
import { StoreInstagramPost } from '@/components/store-marketing/StoreInstagramPost';

interface StoreData {
  name: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  city?: string;
  state?: string;
  primaryColor?: string;
  secondaryColor?: string;
  menuUrl: string;
  acceptsCash?: boolean;
  acceptsCard?: boolean;
  acceptsPix?: boolean;
  deliveryFee?: number;
  minOrderValue?: number;
}

interface Category {
  id: string;
  name: string;
  products: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    isOnOffer?: boolean;
    offerPrice?: number;
  }>;
}

interface Promotion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  endDate?: string;
}

export default function StoreMarketingPage() {
  const { profile } = useAuth();
  const { storeId, isLoading: storeAccessLoading } = useStoreAccess();
  const { hasModule, loading: modulesLoading } = useStoreModules(storeId);
  
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedTab, setSelectedTab] = useState('flyer');

  const flyerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const miniQrRef = useRef<HTMLDivElement>(null);
  const couponRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const socialBannerRef = useRef<HTMLDivElement>(null);
  const instagramStoryRef = useRef<HTMLDivElement>(null);
  const instagramPostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storeId && !storeAccessLoading) {
      loadStoreData();
    }
  }, [storeId, storeAccessLoading]);

  const loadStoreData = async () => {
    if (!storeId) return;

    setLoading(true);
    try {
      // Buscar dados da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;

      // Buscar configurações
      const { data: configData } = await supabase
        .from('store_configurations')
        .select('*')
        .eq('store_id', storeId)
        .single();

      const config = configData as any;
      const socialMedia = config?.social_media as any;
      const baseUrl = window.location.origin;
      
      const storeDataFormatted: StoreData = {
        name: store.name,
        description: store.description || undefined,
        logoUrl: store.logo_url || undefined,
        phone: store.phone || undefined,
        whatsapp: socialMedia?.whatsapp || store.phone || undefined,
        instagram: socialMedia?.instagram || undefined,
        address: store.address || undefined,
        city: store.city || undefined,
        state: store.state || undefined,
        primaryColor: config?.primary_color || '#f97316',
        secondaryColor: config?.secondary_color || undefined,
        menuUrl: `${baseUrl}/loja/${store.slug}`,
        acceptsCash: true,
        acceptsCard: true,
        acceptsPix: config?.pix_key ? true : false,
        deliveryFee: 0,
        minOrderValue: 0,
      };

      setStoreData(storeDataFormatted);

      // Buscar categorias e produtos
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`id, name, products (id, name, description, price, is_on_offer, offer_price, is_available)`)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const formattedCategories: Category[] = (categoriesData || [])
        .filter(cat => cat.products && cat.products.length > 0)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          products: (cat.products || [])
            .filter((p: any) => p.is_available !== false)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || undefined,
              price: p.price,
              isOnOffer: p.is_on_offer || false,
              offerPrice: p.offer_price || undefined,
            })),
        }));

      setCategories(formattedCategories);

      // Buscar promoções ativas
      const { data: promotionsData } = await supabase
        .from('promotions')
        .select('id, name, code, description, discount_percentage, discount_amount, end_date')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .limit(5);

      if (promotionsData) {
        setPromotions(promotionsData.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code || undefined,
          description: p.description || undefined,
          discountPercentage: p.discount_percentage || undefined,
          discountAmount: p.discount_amount || undefined,
          endDate: p.end_date || undefined,
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRef = () => {
    switch (selectedTab) {
      case 'flyer': return flyerRef;
      case 'card': return cardRef;
      case 'mini-qr': return miniQrRef;
      case 'coupon': return couponRef;
      case 'whatsapp': return whatsappRef;
      case 'menu': return menuRef;
      case 'social-banner': return socialBannerRef;
      case 'instagram-story': return instagramStoryRef;
      case 'instagram-post': return instagramPostRef;
      default: return flyerRef;
    }
  };

  const getFilename = () => {
    const storeName = storeData?.name?.toLowerCase().replace(/\s+/g, '-') || 'loja';
    return `${storeName}-${selectedTab}`;
  };

  if (!modulesLoading && !hasModule('marketing_material')) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Módulo Bloqueado
            </CardTitle>
            <CardDescription>
              O módulo de Material de Marketing não está disponível para sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Entre em contato com o suporte para liberar este recurso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || storeAccessLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível carregar os dados da loja.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-7 w-7 text-primary" />
            Material de Marketing
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie materiais de divulgação personalizados para sua loja
          </p>
        </div>
        <Badge variant="outline" className="w-fit">{storeData.name}</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Dados da Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{storeData.name}</p></div>
            <div><span className="text-muted-foreground">Telefone:</span><p className="font-medium">{storeData.phone || '-'}</p></div>
            <div><span className="text-muted-foreground">WhatsApp:</span><p className="font-medium">{storeData.whatsapp || '-'}</p></div>
            <div><span className="text-muted-foreground">Instagram:</span><p className="font-medium">{storeData.instagram ? `@${storeData.instagram}` : '-'}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escolha um Template</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-4">
              <TabsTrigger value="flyer" className="flex-1 min-w-[80px] gap-1"><FileText className="h-4 w-4" />Flyer</TabsTrigger>
              <TabsTrigger value="menu" className="flex-1 min-w-[80px] gap-1"><FileText className="h-4 w-4" />Cardápio</TabsTrigger>
              <TabsTrigger value="card" className="flex-1 min-w-[80px] gap-1"><CreditCard className="h-4 w-4" />Cartão</TabsTrigger>
              <TabsTrigger value="mini-qr" className="flex-1 min-w-[80px] gap-1"><Grid3X3 className="h-4 w-4" />Mini QR</TabsTrigger>
              {promotions.length > 0 && <TabsTrigger value="coupon" className="flex-1 min-w-[80px] gap-1"><Tag className="h-4 w-4" />Cupom</TabsTrigger>}
              <TabsTrigger value="whatsapp" className="flex-1 min-w-[80px] gap-1"><MessageSquare className="h-4 w-4" />WhatsApp</TabsTrigger>
              <TabsTrigger value="social-banner" className="flex-1 min-w-[80px] gap-1"><Image className="h-4 w-4" />Banner</TabsTrigger>
              <TabsTrigger value="instagram-story" className="flex-1 min-w-[80px] gap-1"><Smartphone className="h-4 w-4" />Story</TabsTrigger>
              <TabsTrigger value="instagram-post" className="flex-1 min-w-[80px] gap-1"><Square className="h-4 w-4" />Post</TabsTrigger>
            </TabsList>

            <div className="flex justify-center mb-6">
              <DownloadButtons targetRef={getCurrentRef()} filename={getFilename()} />
            </div>

            <div className="border rounded-lg bg-muted/30 overflow-auto max-h-[700px]">
              <TabsContent value="flyer" className="m-0"><StoreFlyer ref={flyerRef} storeData={storeData} /></TabsContent>
              <TabsContent value="menu" className="m-0"><StoreMenuTemplate ref={menuRef} storeData={storeData} categories={categories} /></TabsContent>
              <TabsContent value="card" className="m-0"><StoreBusinessCard ref={cardRef} storeData={storeData} /></TabsContent>
              <TabsContent value="mini-qr" className="m-0"><StoreMiniQR ref={miniQrRef} storeData={storeData} /></TabsContent>
              {promotions.length > 0 && <TabsContent value="coupon" className="m-0"><StoreCoupon ref={couponRef} storeData={storeData} promotion={promotions[0]} /></TabsContent>}
              <TabsContent value="whatsapp" className="m-0"><StoreWhatsAppSticker ref={whatsappRef} storeData={storeData} /></TabsContent>
              <TabsContent value="social-banner" className="m-0"><StoreSocialBanner ref={socialBannerRef} storeData={storeData} /></TabsContent>
              <TabsContent value="instagram-story" className="m-0"><StoreInstagramStory ref={instagramStoryRef} storeData={storeData} /></TabsContent>
              <TabsContent value="instagram-post" className="m-0"><StoreInstagramPost ref={instagramPostRef} storeData={storeData} /></TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}