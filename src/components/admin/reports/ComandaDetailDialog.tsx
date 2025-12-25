import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle2, 
  User, 
  CreditCard, 
  Calendar,
  UtensilsCrossed,
  Store,
  Printer,
  Loader2,
  ChefHat
} from 'lucide-react';
import { printComanda } from '@/utils/printComanda';

interface ComandaItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string | null;
  preparation_status?: string | null;
  addons?: any;
}

interface ComandaForDialog {
  id: string;
  number: string;
  type: string;
  table_number?: string | null;
  customer_name?: string | null;
  status: string;
  subtotal: number;
  discount: number;
  service_fee: number;
  total: number;
  payment_method?: string | null;
  payment_details?: any;
  opened_at: string;
  closed_at?: string | null;
  notes?: string | null;
  store_id: string;
  opened_by?: string | null;
  closed_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ComandaDetailDialogProps {
  comanda: ComandaForDialog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  pix: 'PIX',
  mixed: 'Misto',
};

const preparationStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'text-yellow-600 border-yellow-600', icon: Clock },
  preparing: { label: 'Preparando', color: 'text-orange-600 border-orange-600', icon: ChefHat },
  ready: { label: 'Pronto', color: 'text-green-600 border-green-600', icon: CheckCircle2 },
};

export function ComandaDetailDialog({ comanda, open, onOpenChange }: ComandaDetailDialogProps) {
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [storeName, setStoreName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (comanda && open) {
      fetchItems();
      fetchStoreName();
    }
  }, [comanda, open]);

  const fetchItems = async () => {
    if (!comanda) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('comanda_items')
      .select('*')
      .eq('comanda_id', comanda.id)
      .order('added_at', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setIsLoading(false);
  };

  const fetchStoreName = async () => {
    if (!comanda) return;
    
    const { data } = await supabase
      .from('stores')
      .select('name')
      .eq('id', comanda.store_id)
      .single();

    if (data) {
      setStoreName(data.name);
    }
  };

  const handlePrint = () => {
    if (!comanda) return;
    // Convert to format expected by printComanda
    const comandaForPrint = {
      ...comanda,
      opened_by: comanda.opened_by || null,
      closed_by: comanda.closed_by || null,
      created_at: comanda.created_at || comanda.opened_at,
      updated_at: comanda.updated_at || comanda.opened_at,
    };
    printComanda(comandaForPrint as any, items as any, storeName || 'Estabelecimento');
  };

  if (!comanda) return null;

  const isOpen = comanda.status === 'open';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">Comanda #{comanda.number}</DialogTitle>
              <Badge className={isOpen ? 'bg-blue-500' : 'bg-green-600'}>
                {isOpen ? 'Aberta' : 'Fechada'}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6">
            {/* Informações Gerais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                {comanda.type === 'mesa' ? (
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Store className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">
                  {comanda.type === 'mesa' ? `Mesa ${comanda.table_number}` : 'Balcão'}
                </span>
              </div>

              {comanda.customer_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{comanda.customer_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Abertura:</span>
                <span className="font-medium">
                  {format(new Date(comanda.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {comanda.closed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fechamento:</span>
                  <span className="font-medium">
                    {format(new Date(comanda.closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}

              {comanda.payment_method && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pagamento:</span>
                  <span className="font-medium">
                    {paymentMethodLabels[comanda.payment_method] || comanda.payment_method}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Itens */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Itens ({items.length})
              </h3>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum item</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => {
                    const statusConfig = item.preparation_status 
                      ? preparationStatusConfig[item.preparation_status] 
                      : null;
                    const StatusIcon = statusConfig?.icon;

                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.product_name}</span>
                            {statusConfig && StatusIcon && (
                              <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                          {item.notes && (
                            <p className="text-xs italic text-muted-foreground mt-1">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-primary">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Totais */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(comanda.subtotal)}</span>
              </div>
              
              {comanda.service_fee > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Taxa de Serviço</span>
                  <span>+{formatCurrency(comanda.service_fee)}</span>
                </div>
              )}
              
              {comanda.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(comanda.discount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(comanda.total)}</span>
              </div>
            </div>

            {/* Notas */}
            {comanda.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Observações</h4>
                  <p className="text-sm">{comanda.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
