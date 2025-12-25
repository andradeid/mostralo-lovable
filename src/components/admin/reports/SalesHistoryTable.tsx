import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { SalesFilters, SalesChannel, SalesStatus, PaymentMethod } from './SalesFilters';
import { ComandaDetailDialog } from './ComandaDetailDialog';
import { OrderDetailDialog } from '@/components/admin/orders/OrderDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, 
  Truck, 
  ShoppingBag, 
  UtensilsCrossed, 
  Store,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Package
} from 'lucide-react';

interface SalesHistoryTableProps {
  dateRange: DateRange;
  storeId: string | null;
}

interface UnifiedSale {
  id: string;
  type: 'order' | 'comanda';
  number: string;
  channel: 'delivery' | 'pickup' | 'table' | 'counter';
  customerName: string | null;
  customerPhone: string | null;
  total: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  rawData: any;
}

const ITEMS_PER_PAGE = 20;

const channelConfig = {
  delivery: { label: 'Delivery', icon: Truck, color: 'bg-blue-100 text-blue-700' },
  pickup: { label: 'Retirada', icon: ShoppingBag, color: 'bg-purple-100 text-purple-700' },
  table: { label: 'Mesa', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700' },
  counter: { label: 'Balcão', icon: Store, color: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  // Orders
  entrada: { label: 'Entrada', color: 'bg-blue-500', icon: Clock },
  em_preparo: { label: 'Em Preparo', color: 'bg-yellow-500', icon: ChefHat },
  pronto: { label: 'Pronto', color: 'bg-green-500', icon: CheckCircle2 },
  saiu_entrega: { label: 'Saiu p/ Entrega', color: 'bg-purple-500', icon: Truck },
  concluido: { label: 'Concluído', color: 'bg-green-600', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
  // Comandas
  open: { label: 'Aberta', color: 'bg-blue-500', icon: Clock },
  closed: { label: 'Fechada', color: 'bg-green-600', icon: CheckCircle2 },
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit: 'Crédito',
  debit: 'Débito',
  pix: 'PIX',
  mixed: 'Misto',
  card_on_delivery: 'Cartão',
  pix_on_delivery: 'PIX',
  online_pix: 'PIX Online',
  online_card: 'Cartão Online',
};

export function SalesHistoryTable({ dateRange, storeId }: SalesHistoryTableProps) {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<UnifiedSale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [channel, setChannel] = useState<SalesChannel>('all');
  const [status, setStatus] = useState<SalesStatus>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('all');
  
  // Modais
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [comandaDialogOpen, setComandaDialogOpen] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchSales();
    }
  }, [dateRange, storeId]);

  const fetchSales = async () => {
    if (!storeId) return;
    setLoading(true);

    try {
      // Buscar orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      // Buscar comandas
      const { data: comandas } = await supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      // Normalizar dados
      const normalizedOrders: UnifiedSale[] = (orders || []).map(order => ({
        id: order.id,
        type: 'order' as const,
        number: order.order_number || order.id.slice(0, 8),
        channel: (order as any).order_type === 'pickup' ? 'pickup' : 'delivery',
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        total: Number(order.total),
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        rawData: order,
      }));

      const normalizedComandas: UnifiedSale[] = (comandas || []).map(comanda => ({
        id: comanda.id,
        type: 'comanda' as const,
        number: comanda.number,
        channel: comanda.type === 'mesa' ? 'table' : 'counter',
        customerName: comanda.customer_name,
        customerPhone: null,
        total: Number(comanda.total),
        status: comanda.status,
        paymentMethod: comanda.payment_method,
        createdAt: comanda.created_at,
        rawData: comanda,
      }));

      // Combinar e ordenar por data
      const allSales = [...normalizedOrders, ...normalizedComandas].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSales(allSales);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar vendas
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchNumber = sale.number.toLowerCase().includes(query);
        const matchName = sale.customerName?.toLowerCase().includes(query);
        const matchPhone = sale.customerPhone?.includes(query);
        if (!matchNumber && !matchName && !matchPhone) return false;
      }

      // Canal
      if (channel !== 'all' && sale.channel !== channel) return false;

      // Status
      if (status !== 'all') {
        const statusMap: Record<SalesStatus, string[]> = {
          all: [],
          open: ['entrada', 'open'],
          preparing: ['em_preparo'],
          completed: ['concluido', 'closed', 'pronto'],
          cancelled: ['cancelado'],
        };
        if (!statusMap[status].includes(sale.status)) return false;
      }

      // Pagamento
      if (paymentMethod !== 'all') {
        const methodMap: Record<PaymentMethod, string[]> = {
          all: [],
          cash: ['cash', 'dinheiro'],
          credit: ['credit', 'credito', 'card_on_delivery', 'online_card'],
          debit: ['debit', 'debito'],
          pix: ['pix', 'pix_on_delivery', 'online_pix'],
        };
        if (!sale.paymentMethod || !methodMap[paymentMethod].some(m => 
          sale.paymentMethod?.toLowerCase().includes(m)
        )) return false;
      }

      return true;
    });
  }, [sales, searchQuery, channel, status, paymentMethod]);

  // Paginação
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setChannel('all');
    setStatus('all');
    setPaymentMethod('all');
    setCurrentPage(1);
  };

  const handleViewDetails = (sale: UnifiedSale) => {
    if (sale.type === 'order') {
      setSelectedOrder(sale.rawData);
      setOrderDialogOpen(true);
    } else {
      setSelectedComanda(sale.rawData);
      setComandaDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <SalesFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        channel={channel}
        onChannelChange={(c) => { setChannel(c); setCurrentPage(1); }}
        status={status}
        onStatusChange={(s) => { setStatus(s); setCurrentPage(1); }}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={(p) => { setPaymentMethod(p); setCurrentPage(1); }}
        onClearFilters={handleClearFilters}
      />

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        {filteredSales.length} {filteredSales.length === 1 ? 'venda encontrada' : 'vendas encontradas'}
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedSales.map((sale) => {
                const channelInfo = channelConfig[sale.channel];
                const ChannelIcon = channelInfo.icon;
                const statusInfo = statusConfig[sale.status] || { 
                  label: sale.status, 
                  color: 'bg-gray-500', 
                  icon: Clock 
                };

                return (
                  <TableRow key={`${sale.type}-${sale.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(sale)}>
                    <TableCell className="font-medium">
                      #{sale.number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${channelInfo.color} gap-1`}>
                        <ChannelIcon className="h-3 w-3" />
                        {channelInfo.label}
                        {sale.channel === 'table' && sale.rawData.table_number && (
                          <span className="ml-1">#{sale.rawData.table_number}</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {sale.customerName || '-'}
                        </span>
                        {sale.customerPhone && (
                          <p className="text-xs text-muted-foreground">{sale.customerPhone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {sale.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: statusInfo.color }} className="text-white">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.paymentMethod 
                        ? paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sale.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(sale);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modais */}
      <OrderDetailDialog
        order={selectedOrder}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onStatusChange={() => fetchSales()}
      />

      <ComandaDetailDialog
        comanda={selectedComanda}
        open={comandaDialogOpen}
        onOpenChange={setComandaDialogOpen}
      />
    </div>
  );
}
