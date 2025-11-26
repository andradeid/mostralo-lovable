import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePageSEO } from '@/hooks/useSEO';
import { StoreConfigurationForm } from "@/components/admin/store-config/StoreConfigurationForm";

interface StoreWithConfig {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'suspended' | 'inactive';
  logo_url: string | null;
  cover_url: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  responsible_phone: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_requested_at: string | null;
  created_at: string;
  configuration?: {
    id: string;
    primary_color: string;
    secondary_color: string;
    product_display_layout: string;
    delivery_zones?: any[];
    delivery_times?: any;
    online_payment_enabled?: boolean;
    pix_key?: string;
    mercado_pago_token?: string;
    qr_code_enabled?: boolean;
    qr_code_url?: string;
    google_analytics_id?: string;
    facebook_pixel_id?: string;
  };
}

export default function StoreConfigurationPage() {
  usePageSEO({
    title: 'Configurações da Loja - Mostralo | Personalização Avançada',
    description: 'Configure todas as funcionalidades da sua loja: cores, layout, pagamentos, delivery e muito mais. Personalize sua presença digital.',
    keywords: 'configurações loja, personalização loja, cores tema, pagamentos, delivery, configuração avançada'
  });

  const [stores, setStores] = useState<StoreWithConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreWithConfig | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchStores = async () => {
    try {
      setLoading(true);
      
      // Buscar lojas com suas configurações (filtrado por owner_id para store_admin)
      let query = supabase
        .from('stores')
        .select(`
          *,
          store_configurations(
            id,
            primary_color,
            secondary_color,
            product_display_layout,
            delivery_zones,
            delivery_times,
            accept_outside_delivery_zone,
            online_payment_enabled,
            pix_key,
            mercado_pago_token,
            qr_code_enabled,
            qr_code_url,
            google_analytics_id,
            facebook_pixel_id,
            delivery_button_text,
            pickup_button_text
          )
        `)
        .order('created_at', { ascending: false });

      // 🔒 SEGURANÇA: Store admins só veem sua própria loja
      if (profile?.user_type === 'store_admin' && profile?.id) {
        query = query.eq('owner_id', profile.id);
      }

      const { data: storesData, error: storesError } = await query;

      if (storesError) {
        throw storesError;
      }

      console.log('🔍 storesData carregados:', storesData);
      
      setStores(storesData.map(store => {
        console.log('📊 store individual:', store);
        console.log('🔧 store_configurations:', store.store_configurations);
        
        // store_configurations pode vir como objeto ou array
        const config = Array.isArray(store.store_configurations) 
          ? store.store_configurations[0] 
          : store.store_configurations;
          
        console.log('✅ config processada:', config);
        
        return {
          ...store,
          configuration: config || undefined
        };
      }));
    } catch (error: any) {
      console.error('Erro ao carregar lojas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as lojas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativa', variant: 'default' as const, color: 'bg-green-500' };
      case 'suspended':
        return { label: 'Suspensa', variant: 'secondary' as const, color: 'bg-yellow-500' };
      case 'inactive':
        return { label: 'Inativa', variant: 'outline' as const, color: 'bg-red-500' };
      default:
        return { label: status, variant: 'outline' as const, color: 'bg-gray-500' };
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfigureStore = (store: StoreWithConfig) => {
    setSelectedStore(store);
    setShowConfigForm(true);
  };

  const handleCloseConfigForm = () => {
    setSelectedStore(null);
    setShowConfigForm(false);
    fetchStores(); // Recarregar dados após alterações
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showConfigForm && selectedStore) {
    return (
      <StoreConfigurationForm
        store={selectedStore}
        onClose={handleCloseConfigForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Lojas</h1>
          <p className="text-muted-foreground mt-2">
            Configure as lojas dos clientes - aparência, pagamentos, entrega e muito mais
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stores.filter(store => store.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stores.filter(store => store.configuration).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Config.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stores.length > 0 ? Math.round((stores.filter(store => store.configuration).length / stores.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, slug, descrição ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Settings className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma loja encontrada</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? "Tente ajustar os termos de busca." : "Nenhuma loja cadastrada no sistema."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => {
            const statusInfo = getStatusInfo(store.status);
            
            return (
              <Card key={store.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1">{store.name}</h3>
                      <p className="text-sm text-muted-foreground">@{store.slug}</p>
                    </div>
                    <Badge variant={statusInfo.variant} className="shrink-0">
                      <div className={`w-2 h-2 rounded-full ${statusInfo.color} mr-1`} />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  
                  {store.logo_url && (
                    <div className="w-full h-32 bg-muted rounded-md overflow-hidden">
                      <img
                        src={store.logo_url}
                        alt={`Logo ${store.name}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {store.description}
                    </p>
                  )}
                  
                  {store.responsible_name && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Responsável:</p>
                      <p className="text-sm text-muted-foreground">{store.responsible_name}</p>
                      {store.responsible_email && (
                        <p className="text-xs text-muted-foreground">{store.responsible_email}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {store.configuration ? (
                        <span className="text-green-600 font-medium">✓ Configurada</span>
                      ) : (
                        <span className="text-orange-600 font-medium">⚠ Não configurada</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleConfigureStore(store)}
                      className="shrink-0"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}