import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/driverEarnings';
import { Loader2, DollarSign, FileText, Store } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Earning {
  id: string;
  order_id: string;
  earnings_amount: number;
  delivered_at: string;
  payment_requested_at?: string;
  store_id: string;
  store_name?: string;
}

interface PaymentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earnings: Earning[];
  onSubmit: (earningIds: string[], notes?: string) => Promise<void>;
}

export function PaymentRequestDialog({
  open,
  onOpenChange,
  earnings,
  onSubmit,
}: PaymentRequestDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Extrair lojas únicas
  const stores = useMemo(() => {
    const uniqueStores = earnings.reduce((acc, earning) => {
      if (!acc.find(s => s.id === earning.store_id)) {
        acc.push({
          id: earning.store_id,
          name: earning.store_name || 'Loja desconhecida'
        });
      }
      return acc;
    }, [] as Array<{id: string; name: string}>);
    return uniqueStores;
  }, [earnings]);

  // Filtrar earnings pela loja selecionada
  const filteredEarnings = useMemo(() => {
    if (selectedStore === 'all') return earnings;
    return earnings.filter(e => e.store_id === selectedStore);
  }, [earnings, selectedStore]);

  // Limpar seleções ao trocar de loja
  useMemo(() => {
    setSelectedIds([]);
  }, [selectedStore]);

  const toggleEarning = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredEarnings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEarnings.map(e => e.id));
    }
  };

  const selectedTotal = filteredEarnings
    .filter(e => selectedIds.includes(e.id))
    .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      await onSubmit(selectedIds, notes);
      setSelectedIds([]);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao solicitar pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Solicitar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtro por loja */}
          {stores.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="store-filter">Filtrar por loja:</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger id="store-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas as lojas ({earnings.length} {earnings.length === 1 ? 'entrega' : 'entregas'})
                  </SelectItem>
                  {stores.map(store => {
                    const count = earnings.filter(e => e.store_id === store.id).length;
                    return (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({count} {count === 1 ? 'entrega' : 'entregas'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Badge informativo quando filtrado */}
          {selectedStore !== 'all' && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300">
                  Solicitação para: <strong>{stores.find(s => s.id === selectedStore)?.name}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Seleção de entregas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selecione as entregas para solicitar pagamento:</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAll}
              >
                {selectedIds.length === filteredEarnings.length ? 'Desmarcar' : 'Selecionar'} todas
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {filteredEarnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleEarning(earning.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(earning.id)}
                    onCheckedChange={() => toggleEarning(earning.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        Pedido #{earning.order_id.slice(0, 8)}
                      </span>
                      <span className="font-bold text-primary">
                        {formatCurrency(parseFloat(earning.earnings_amount.toString()))}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Entregue em {format(new Date(earning.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total selecionado */}
          {selectedIds.length > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.length} {selectedIds.length === 1 ? 'entrega selecionada' : 'entregas selecionadas'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedTotal)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre esta solicitação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedIds.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Solicitar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
