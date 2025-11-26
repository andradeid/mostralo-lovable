import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  Store, 
  Search, 
  Plus,
  Phone,
  MapPin,
  Calendar,
  User,
  Activity,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface StoreData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  owner_id: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

const StoresPage = () => {
  usePageSEO({
    title: 'Lojas - Mostralo | Gerenciar Lojas',
    description: 'Visualize e gerencie todas as lojas da plataforma Mostralo. Acompanhe status, informações e atividade das lojas.',
    keywords: 'gerenciar lojas, administração lojas, status lojas, controle estabelecimentos'
  });

  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de lojas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativa',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'inactive':
        return {
          label: 'Inativa',
          variant: 'secondary' as const,
          color: 'text-red-600'
        };
      default:
        return {
          label: 'Desconhecido',
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeStores = stores.filter(s => s.status === 'active').length;
  const inactiveStores = stores.filter(s => s.status === 'inactive').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Lojas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as lojas da plataforma
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Loja
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-muted-foreground">
              Lojas cadastradas na plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStores}</div>
            <p className="text-xs text-muted-foreground">
              Funcionando normalmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
            <Store className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.length > 0 ? Math.round((activeStores / stores.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lojas ativas vs total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Lojas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, slug ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stores List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lojas ({filteredStores.length})</CardTitle>
          <CardDescription>
            Lojas encontradas com os filtros aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStores.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma loja encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os termos de busca.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => {
                const statusInfo = getStatusInfo(store.status);

                return (
                  <Card key={store.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      {store.cover_url ? (
                        <img
                          src={store.cover_url}
                          alt={store.name}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
                          <Store className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {store.logo_url && (
                            <img
                              src={store.logo_url}
                              alt={store.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <CardTitle className="text-lg">{store.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">/{store.slug}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {store.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {store.description}
                        </p>
                      )}
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {store.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {store.address && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{store.address}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Criada em {new Date(store.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Editar
                        </Button>
                        <Link to={`/loja/${store.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresPage;