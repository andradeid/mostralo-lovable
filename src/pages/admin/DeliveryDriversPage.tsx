import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Bike, Users, Package, Link, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CreateDriverDialog } from '@/components/admin/delivery/CreateDriverDialog';
import { DeliveryDriverCardWithPresence } from '@/components/admin/delivery/DeliveryDriverCardWithPresence';
import { GenerateInviteLinkDialog } from '@/components/admin/delivery/GenerateInviteLinkDialog';
import { ReviewCounterOfferDialog } from '@/components/admin/delivery/ReviewCounterOfferDialog';

interface DeliveryDriver {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface DriverStats {
  driver_id: string;
  total_deliveries: number;
  active_deliveries: number;
  total_earnings: number;
  pending_earnings: number;
}

export default function DeliveryDriversPage() {
  const { profile, signOut } = useAuth();
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [stats, setStats] = useState<Record<string, DriverStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [counterOffers, setCounterOffers] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedCounterOffer, setSelectedCounterOffer] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      fetchStoreAndDrivers();
    }
  }, [profile]);

  useEffect(() => {
    if (storeId) {
      fetchCounterOffers();
    }
  }, [storeId]);

  const fetchCounterOffers = async () => {
    if (!storeId) return;

    try {
      const { data } = await supabase
        .from('driver_invitations')
        .select('*, profiles(full_name)')
        .eq('store_id', storeId)
        .eq('status', 'pending')
        .not('counter_offer_at', 'is', null);

      setCounterOffers(data || []);
    } catch (error) {
      console.error('Error fetching counter-offers:', error);
    }
  };

  const fetchStoreAndDrivers = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Master admin pode ver todos os entregadores
      const isMasterAdmin = profile.user_type === 'master_admin';

      // Buscar store_id do usuário (se não for master admin)
      let currentStoreId = storeId;
      if (!isMasterAdmin && !currentStoreId) {
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', profile.id)
          .single();
        
        if (store) {
          currentStoreId = store.id;
          setStoreId(store.id);
        }
      }

      if (!isMasterAdmin && !currentStoreId) {
        toast.error('Loja não encontrada');
        return;
      }

      // Buscar entregadores (todos para master admin, da loja específica para store admin)
      let userRolesQuery = supabase
        .from('user_roles')
        .select('user_id, store_id')
        .eq('role', 'delivery_driver');

      if (!isMasterAdmin && currentStoreId) {
        userRolesQuery = userRolesQuery.eq('store_id', currentStoreId);
      }

      const { data: userRoles, error: rolesError } = await userRolesQuery;

      if (rolesError) throw rolesError;

      if (userRoles && userRoles.length > 0) {
        const driverIds = userRoles.map(r => r.user_id);

        // Buscar perfis dos entregadores
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', driverIds);

        if (profilesError) throw profilesError;

        setDrivers(profiles || []);

        // Buscar estatísticas
        await fetchDriversStats(driverIds, currentStoreId || null);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error('Erro ao buscar entregadores:', error);
      toast.error('Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriversStats = async (driverIds: string[], storeId: string | null) => {
    try {
      const statsPromises = driverIds.map(async (driverId) => {
        // Total de entregas concluídas
        let deliveriesQuery = supabase
          .from('delivery_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('delivery_driver_id', driverId)
          .eq('status', 'delivered');
        
        if (storeId) {
          deliveriesQuery = deliveriesQuery.eq('store_id', storeId);
        }
        
        const { count: totalDeliveries } = await deliveriesQuery;

        // Entregas ativas
        let activeQuery = supabase
          .from('delivery_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('delivery_driver_id', driverId)
          .in('status', ['assigned', 'accepted', 'picked_up']);
        
        if (storeId) {
          activeQuery = activeQuery.eq('store_id', storeId);
        }
        
        const { count: activeDeliveries } = await activeQuery;

        // Ganhos reais do entregador (buscar da tabela driver_earnings)
        let earningsQuery = supabase
          .from('driver_earnings')
          .select('earnings_amount, payment_status')
          .eq('driver_id', driverId);
        
        if (storeId) {
          earningsQuery = earningsQuery.eq('store_id', storeId);
        }
        
        const { data: earningsData } = await earningsQuery;

        const totalEarnings = earningsData?.reduce((sum, item) => {
          return sum + parseFloat(item.earnings_amount?.toString() || '0');
        }, 0) || 0;

        const pendingEarnings = earningsData
          ?.filter(item => item.payment_status === 'pending')
          .reduce((sum, item) => {
            return sum + parseFloat(item.earnings_amount?.toString() || '0');
          }, 0) || 0;

        return {
          driver_id: driverId,
          total_deliveries: totalDeliveries || 0,
          active_deliveries: activeDeliveries || 0,
          total_earnings: totalEarnings,
          pending_earnings: pendingEarnings,
        };
      });

      const allStats = await Promise.all(statsPromises);
      const statsMap = allStats.reduce((acc, stat) => {
        acc[stat.driver_id] = stat;
        return acc;
      }, {} as Record<string, DriverStats>);

      setStats(statsMap);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActiveDeliveries = Object.values(stats).reduce((sum, s) => sum + s.active_deliveries, 0);
  const totalCompletedDeliveries = Object.values(stats).reduce((sum, s) => sum + s.total_deliveries, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Bloqueio: somente lojistas e master admins podem gerenciar entregadores
  if (profile && profile.user_type !== 'store_admin' && profile.user_type !== 'master_admin') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Você está logado como <strong>{profile.email}</strong> e não tem permissão para gerenciar entregadores.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.assign('/')}>Ir para a página inicial</Button>
              <Button onClick={async () => { await signOut(); window.location.assign('/auth'); }}>Sair e trocar de usuário</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bike className="w-8 h-8 text-primary" />
            Entregadores
            {counterOffers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {counterOffers.length} contra-proposta{counterOffers.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua equipe de entregadores
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowInviteLinkDialog(true)} variant="outline" className="gap-2">
            <Link className="w-4 h-4" />
            Gerar Link de Convite
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Entregador
          </Button>
        </div>
      </div>

      {/* Alerta de Contra-propostas */}
      {counterOffers.length > 0 && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Você tem {counterOffers.length} contra-proposta{counterOffers.length !== 1 ? 's' : ''} aguardando revisão
            </span>
            <Button
              size="sm"
              onClick={() => {
                if (counterOffers[0]) {
                  setSelectedCounterOffer(counterOffers[0]);
                  setShowReviewDialog(true);
                }
              }}
            >
              Revisar Agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Entregadores
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregas Ativas
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregas Concluídas
            </CardTitle>
            <Bike className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedDeliveries}</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar entregador por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Lista de Entregadores */}
      {filteredDrivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bike className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum entregador encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Tente buscar com outros termos' : 'Adicione seu primeiro entregador para começar'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Entregador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <DeliveryDriverCardWithPresence
              key={driver.id}
              driver={driver}
              stats={stats[driver.id]}
              onUpdate={fetchStoreAndDrivers}
              storeId={storeId || ''}
            />
          ))}
        </div>
      )}

      <CreateDriverDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        storeId={storeId}
        onSuccess={fetchStoreAndDrivers}
      />

      {storeId && (
        <GenerateInviteLinkDialog
          open={showInviteLinkDialog}
          onOpenChange={setShowInviteLinkDialog}
          storeId={storeId}
        />
      )}

      {selectedCounterOffer && (
        <ReviewCounterOfferDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          invitation={selectedCounterOffer}
          driverName={selectedCounterOffer.profiles?.full_name || 'Entregador'}
          onSuccess={() => {
            fetchStoreAndDrivers();
            fetchCounterOffers();
          }}
        />
      )}
    </div>
  );
}
