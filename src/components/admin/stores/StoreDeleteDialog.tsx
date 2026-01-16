import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Trash2, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoreData {
  id: string;
  name: string;
  slug: string;
}

interface StoreStats {
  orders: number;
  products: number;
  categories: number;
  customers: number;
  bookings: number;
  professionals: number;
}

interface StoreDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreData | null;
  onSuccess?: () => void;
}

export function StoreDeleteDialog({ open, onOpenChange, store, onSuccess }: StoreDeleteDialogProps) {
  const [confirmationName, setConfirmationName] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<StoreStats | null>(null);

  // Reset state quando dialog abre/fecha
  useEffect(() => {
    if (open && store) {
      setConfirmationName('');
      setReason('');
      setConfirmed(false);
      fetchStats(store.id);
    } else {
      setStats(null);
    }
  }, [open, store]);

  const fetchStats = async (storeId: string) => {
    setLoadingStats(true);
    try {
      const [orders, products, categories, customerStores, bookings, professionals] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('customer_stores').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      ]);

      setStats({
        orders: orders.count || 0,
        products: products.count || 0,
        categories: categories.count || 0,
        customers: customerStores.count || 0,
        bookings: bookings.count || 0,
        professionals: professionals.count || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    if (!store || !confirmed || confirmationName.toLowerCase() !== store.name.toLowerCase()) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await supabase.functions.invoke('delete-store-complete', {
        body: {
          storeId: store.id,
          confirmationName: confirmationName,
          reason: reason || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao excluir loja');
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao excluir loja');
      }

      toast.success('Loja excluída com sucesso', {
        description: `A loja "${store.name}" e todos os seus dados foram removidos permanentemente.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao excluir loja:', error);
      toast.error('Erro ao excluir loja', {
        description: error.message || 'Ocorreu um erro ao tentar excluir a loja.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isNameMatch = confirmationName.toLowerCase() === store?.name.toLowerCase();
  const canDelete = confirmed && isNameMatch && !loading;

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Loja Permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta ação é <strong>irreversível</strong>. Todos os dados da loja serão excluídos permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info da loja */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Store className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">{store.name}</p>
              <p className="text-sm text-muted-foreground">/{store.slug}</p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Dados que serão excluídos:</p>
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedidos:</span>
                  <span className="font-medium">{stats.orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produtos:</span>
                  <span className="font-medium">{stats.products}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categorias:</span>
                  <span className="font-medium">{stats.categories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clientes:</span>
                  <span className="font-medium">{stats.customers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agendamentos:</span>
                  <span className="font-medium">{stats.bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profissionais:</span>
                  <span className="font-medium">{stats.professionals}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Alerta de atenção */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os pedidos, produtos, 
              clientes, agendamentos e demais dados serão permanentemente removidos.
            </AlertDescription>
          </Alert>

          {/* Campo de motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da exclusão (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da exclusão..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Campo de confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Digite <strong className="text-destructive">{store.name}</strong> para confirmar
            </Label>
            <Input
              id="confirmation"
              placeholder={`Digite "${store.name}" para confirmar`}
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              className={isNameMatch ? 'border-destructive' : ''}
            />
          </div>

          {/* Checkbox de confirmação */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm-delete" className="text-sm leading-tight cursor-pointer">
              Entendo que esta ação é irreversível e todos os dados da loja serão permanentemente excluídos.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Loja
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
