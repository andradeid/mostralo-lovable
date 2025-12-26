import { useState } from 'react';
import { usePDVHistory, PDVHistoryItem } from '@/hooks/usePDVHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt,
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PDVHistoryDetail } from './PDVHistoryDetail';

const paymentIcons: Record<string, React.ReactNode> = {
  dinheiro: <Banknote className="h-4 w-4 text-green-600" />,
  pix: <QrCode className="h-4 w-4 text-primary" />,
  credito: <CreditCard className="h-4 w-4 text-blue-600" />,
  debito: <CreditCard className="h-4 w-4 text-orange-600" />,
};

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
};

export function PDVHistory() {
  const [daysBack, setDaysBack] = useState(0);
  const [selectedItem, setSelectedItem] = useState<PDVHistoryItem | null>(null);
  const { data: history, isLoading, refetch } = usePDVHistory(daysBack);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const groupByDate = (items: PDVHistoryItem[]) => {
    const groups: Record<string, PDVHistoryItem[]> = {};
    
    items.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      label: format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR }),
      items
    }));
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const groupedHistory = groupByDate(history || []);
  const totalVendas = history?.length || 0;
  const totalValor = history?.reduce((sum, item) => sum + item.total, 0) || 0;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico
            </CardTitle>
            <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(Number(v))}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Hoje</SelectItem>
                <SelectItem value="1">Ontem</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Resumo */}
          <div className="flex gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{totalVendas} vendas</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-primary">
              {formatCurrency(totalValor)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {groupedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">Nenhuma venda encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {groupedHistory.map(group => (
                  <div key={group.date}>
                    <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground capitalize sticky top-0">
                      {group.label}
                    </div>
                    <div className="divide-y">
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">#{item.number}</span>
                              {item.status === 'cancelled' && (
                                <Badge variant="destructive" className="text-xs">
                                  Cancelado
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.created_at), 'HH:mm')}
                              <span>•</span>
                              <span>{item.items.length} {item.items.length === 1 ? 'item' : 'itens'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(item.total)}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                                {paymentIcons[item.payment_method || ''] || null}
                                <span>{paymentLabels[item.payment_method || ''] || item.payment_method}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <PDVHistoryDetail
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        onActionComplete={() => refetch()}
      />
    </>
  );
}
