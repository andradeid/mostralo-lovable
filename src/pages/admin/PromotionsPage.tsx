import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Promotion } from '@/types/promotions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromotionCard } from '@/components/admin/PromotionCard';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Search,
  Tag,
  TrendingUp,
  Users,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PromotionsPage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    fetchStoreAndPromotions();
  }, []);

  const fetchStoreAndPromotions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (stores) {
        setStoreId(stores.id);
        await fetchPromotions(stores.id);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async (id: string) => {
    const { data } = await supabase
      .from('promotions')
      .select('*')
      .eq('store_id', id)
      .order('created_at', { ascending: false });

    if (data) {
      setPromotions(data);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('promotions')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success(`Promoção ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso`);
    fetchPromotions(storeId);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Erro ao excluir promoção');
      return;
    }

    toast.success('Promoção excluída com sucesso');
    setDeleteId(null);
    fetchPromotions(storeId);
  };

  const handleDuplicate = async (id: string) => {
    const promotion = promotions.find(p => p.id === id);
    if (!promotion) return;

    const { id: _, created_at, updated_at, current_uses, ...promotionData } = promotion;
    
    const { error } = await supabase
      .from('promotions')
      .insert({
        ...promotionData,
        name: `${promotion.name} (Cópia)`,
        code: promotion.code ? `${promotion.code}_COPY` : null,
        current_uses: 0
      });

    if (error) {
      toast.error('Erro ao duplicar promoção');
      return;
    }

    toast.success('Promoção duplicada com sucesso');
    fetchPromotions(storeId);
  };

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    totalUses: promotions.reduce((sum, p) => sum + p.current_uses, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Promoções</h1>
          <p className="text-muted-foreground">
            Gerencie cupons e promoções da sua loja
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/promotions/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Promoções</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Tag className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promoções Ativas</p>
              <p className="text-3xl font-bold">{stats.active}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Usos</p>
              <p className="text-3xl font-bold">{stats.totalUses}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promoções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
            <SelectItem value="scheduled">Agendadas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Promoções */}
      {filteredPromotions.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma promoção encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece criando sua primeira promoção'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => navigate('/dashboard/promotions/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Promoção
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPromotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onEdit={(id) => navigate(`/dashboard/promotions/${id}`)}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Promoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta promoção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
