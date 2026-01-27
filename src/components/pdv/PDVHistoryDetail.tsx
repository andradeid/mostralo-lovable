import { PDVHistoryItem } from '@/hooks/usePDVHistory';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Printer, 
  Clock, 
  CreditCard, 
  Banknote, 
  QrCode,
  Receipt,
  Percent
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { printComanda, StoreInfo } from '@/utils/printComanda';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface PDVHistoryDetailProps {
  item: PDVHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

const paymentInfo: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  dinheiro: { 
    icon: <Banknote className="h-5 w-5" />, 
    label: 'Dinheiro',
    color: 'text-green-600'
  },
  pix: { 
    icon: <QrCode className="h-5 w-5" />, 
    label: 'PIX',
    color: 'text-primary'
  },
  credito: { 
    icon: <CreditCard className="h-5 w-5" />, 
    label: 'Cartão de Crédito',
    color: 'text-blue-600'
  },
  debito: { 
    icon: <CreditCard className="h-5 w-5" />, 
    label: 'Cartão de Débito',
    color: 'text-orange-600'
  },
};

export function PDVHistoryDetail({ item, open, onOpenChange, onActionComplete }: PDVHistoryDetailProps) {
  const { toast } = useToast();
  const { storeId } = useStoreAccess();

  // Query para dados da loja (para impressão)
  const { data: storeData } = useQuery({
    queryKey: ['store-print-data', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data } = await supabase
        .from('stores')
        .select('name, logo_url, address, phone, city, state')
        .eq('id', storeId)
        .single();
      return data;
    },
    enabled: !!storeId,
  });

  if (!item) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const payment = paymentInfo[item.payment_method || ''] || {
    icon: <Receipt className="h-5 w-5" />,
    label: item.payment_method || 'Não informado',
    color: 'text-muted-foreground'
  };

  // Extrair dados de pagamento (suporta ambos os formatos)
  const receivedAmount = item.payment_details?.received_amount || item.payment_details?.valorRecebido || 0;
  const change = item.payment_details?.change || item.payment_details?.troco || 0;

  const handlePrint = async () => {
    // Converter item do histórico para formato de Comanda
    const comanda = {
      id: item.id,
      number: item.number,
      created_at: item.created_at,
      opened_at: item.created_at,
      closed_at: item.closed_at,
      total: item.total,
      subtotal: item.subtotal,
      discount: item.discount,
      service_fee: 0,
      payment_method: item.payment_method,
      payment_details: {
        received_amount: receivedAmount,
        change: change,
      },
      status: item.status as 'open' | 'closed' | 'cancelled',
      customer_name: item.customer_name,
      customer_id: null,
      store_id: storeId || '',
      type: 'balcao' as const,
      table_number: null,
      notes: null,
      source: 'pdv' as const,
      updated_at: item.created_at,
      opened_by: null,
      closed_by: null,
    };

    const items = item.items.map(i => ({
      id: i.id,
      comanda_id: item.id,
      product_id: null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.total_price,
      notes: i.notes,
      addons: null,
      added_at: item.created_at,
      added_by: null,
      requires_approval: false,
      approved_at: null,
      approved_by: null,
      preparation_status: 'ready' as const,
      preparation_started_at: null,
      prepared_at: null,
    }));

    const storeInfo: StoreInfo = {
      name: storeData?.name || 'Estabelecimento',
      address: storeData?.address,
      phone: storeData?.phone,
      city: storeData?.city,
      state: storeData?.state,
      logo_url: storeData?.logo_url,
    };

    await printComanda(comanda, items, storeInfo, { viaType: 'cliente' });

    toast({
      title: 'Cupom enviado para impressão',
      description: `Venda #${item.number}`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Venda #{item.number}
            </SheetTitle>
            {item.status === 'cancelled' && (
              <Badge variant="destructive">Cancelado</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Itens */}
          <div className="space-y-3 py-4">
            <h3 className="text-sm font-medium text-muted-foreground">Itens</h3>
            <div className="space-y-2">
              {item.items.map((i) => (
                <div key={i.id} className="flex items-start justify-between gap-2 py-2">
                  <div className="flex-1">
                    <div className="font-medium">{i.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {i.quantity}x {formatCurrency(i.unit_price)}
                    </div>
                    {i.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        {i.notes}
                      </div>
                    )}
                  </div>
                  <div className="font-medium">
                    {formatCurrency(i.total_price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totais */}
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
            
            {item.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Desconto
                </span>
                <span>-{formatCurrency(item.discount)}</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          </div>

          <Separator />

          {/* Pagamento */}
          <div className="py-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Pagamento</h3>
            <div className={`flex items-center gap-3 ${payment.color}`}>
              {payment.icon}
              <span className="font-medium">{payment.label}</span>
            </div>
            
            {/* Mostrar valor recebido e troco para pagamentos em dinheiro */}
            {item.payment_method === 'dinheiro' && receivedAmount > 0 && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor recebido</span>
                  <span className="font-medium">{formatCurrency(receivedAmount)}</span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Troco</span>
                    <span className="font-medium">{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Ações */}
        <div className="pt-4 border-t space-y-2">
          <Button 
            onClick={handlePrint} 
            className="w-full"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Reimprimir Cupom
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
