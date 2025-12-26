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

  const handlePrint = () => {
    // Criar conteúdo para impressão
    const printContent = `
      <html>
        <head>
          <title>Cupom #${item.number}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              max-width: 300px; 
              margin: 0 auto; 
              padding: 20px;
              font-size: 12px;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 16px; }
            .header p { margin: 5px 0; color: #666; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: center; }
            .item-price { width: 80px; text-align: right; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CUPOM NÃO FISCAL</h1>
            <p>Venda #${item.number}</p>
            <p>${format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
          
          <div class="divider"></div>
          
          ${item.items.map(i => `
            <div class="item">
              <span class="item-name">${i.product_name}</span>
              <span class="item-qty">${i.quantity}x</span>
              <span class="item-price">${formatCurrency(i.total_price)}</span>
            </div>
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="item">
            <span>Subtotal</span>
            <span>${formatCurrency(item.subtotal)}</span>
          </div>
          
          ${item.discount > 0 ? `
            <div class="item" style="color: green;">
              <span>Desconto</span>
              <span>-${formatCurrency(item.discount)}</span>
            </div>
          ` : ''}
          
          <div class="item total">
            <span>TOTAL</span>
            <span>${formatCurrency(item.total)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="item">
            <span>Pagamento</span>
            <span>${payment.label}</span>
          </div>
          
          ${item.payment_details?.troco ? `
            <div class="item">
              <span>Troco</span>
              <span>${formatCurrency(item.payment_details.troco)}</span>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }

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
            
            {item.payment_details?.valorRecebido && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor recebido</span>
                  <span>{formatCurrency(item.payment_details.valorRecebido)}</span>
                </div>
                {item.payment_details.troco > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Troco</span>
                    <span>{formatCurrency(item.payment_details.troco)}</span>
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
