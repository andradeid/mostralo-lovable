import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle2, DollarSign, Download, Loader2, Receipt, FileImage, Send, Store, XCircle, AlertCircle, ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/driverEarnings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PaymentReceiptDialog } from '@/components/admin/delivery/PaymentReceiptDialog';
import { PaymentRequestDialog } from '@/components/delivery/PaymentRequestDialog';
import { usePaymentRequests } from '@/hooks/usePaymentRequests';
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentHistoryCard } from '@/components/delivery/PaymentHistoryCard';
import { formatOrderNumber } from '@/utils/addressFormatter';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Earning {
  id: string;
  order_id: string;
  delivery_fee: number;
  earnings_amount: number;
  payment_type: 'fixed' | 'commission';
  payment_status: string;
  paid_at?: string;
  payment_reference?: string;
  payment_receipt_url?: string;
  payment_requested_at?: string;
  delivered_at: string;
  order_number?: string;
  store_id: string;
  store_name?: string;
}

interface Summary {
  pending: number;
  paidThisMonth: number;
  totalYear: number;
}

interface EnrichedPaymentRequest {
  id: string;
  driver_id: string;
  store_id: string;
  store_name: string;
  total_amount: number;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  notes?: string;
  earning_ids: string[];
  earnings_count: number;
}

export default function DeliveryDriverPayments() {
  const { profile } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<Summary>({
    pending: 0,
    paidThisMonth: 0,
    totalYear: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedReceiptEarningId, setSelectedReceiptEarningId] = useState<string | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [enrichedRequests, setEnrichedRequests] = useState<EnrichedPaymentRequest[]>([]);
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(new Set());
  const [allRequestsExpanded, setAllRequestsExpanded] = useState(false);

  const toggleRequestExpand = (id: string) => {
    const newExpanded = new Set(expandedRequestIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRequestIds(newExpanded);
  };

  const toggleExpandAllRequests = () => {
    if (allRequestsExpanded) {
      setExpandedRequestIds(new Set());
    } else {
      setExpandedRequestIds(new Set(enrichedRequests.map(r => r.id)));
    }
    setAllRequestsExpanded(!allRequestsExpanded);
  };

  const isMobile = useIsMobile();
  
  const { 
    createRequest, 
    requests: paymentRequests,
    pendingCount 
  } = usePaymentRequests({ driverId: profile?.id });

  useEffect(() => {
    if (profile) {
      fetchPayments();
    }
  }, [profile, selectedPeriod, selectedStatus]);

  useEffect(() => {
    if (paymentRequests.length > 0) {
      enrichPaymentRequests();
    } else {
      setEnrichedRequests([]);
    }
  }, [paymentRequests]);

  const enrichPaymentRequests = async () => {
    try {
      const storeIds = [...new Set(paymentRequests.map(r => r.store_id))];
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .in('id', storeIds);

      const enriched: EnrichedPaymentRequest[] = paymentRequests.map(request => ({
        ...request,
        store_name: storesData?.find(s => s.id === request.store_id)?.name || 'Loja não encontrada',
        earnings_count: request.earning_ids?.length || 0
      }));

      setEnrichedRequests(enriched);
    } catch (error) {
      console.error('Error enriching payment requests:', error);
    }
  };

  const fetchPayments = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', profile.id)
        .order('delivered_at', { ascending: false });

      // Filtrar por período
      const now = new Date();
      if (selectedPeriod === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('delivered_at', monthAgo.toISOString());
      } else if (selectedPeriod === 'three_months') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        query = query.gte('delivered_at', threeMonthsAgo.toISOString());
      } else if (selectedPeriod === 'six_months') {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        query = query.gte('delivered_at', sixMonthsAgo.toISOString());
      } else if (selectedPeriod === 'year') {
        const yearAgo = new Date(now.getFullYear(), 0, 1);
        query = query.gte('delivered_at', yearAgo.toISOString());
      }

      // Filtrar por status
      if (selectedStatus !== 'all') {
        query = query.eq('payment_status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar números dos pedidos e nomes das lojas
      if (data && data.length > 0) {
        const orderIds = [...new Set(data.map(e => e.order_id))];
        const storeIds = [...new Set(data.map(e => e.store_id))];
        
        const [ordersResponse, storesResponse] = await Promise.all([
          supabase
            .from('orders')
            .select('id, order_number')
            .in('id', orderIds),
          supabase
            .from('stores')
            .select('id, name')
            .in('id', storeIds)
        ]);

        const enrichedData = data.map(earning => ({
          ...earning,
          order_number: ordersResponse.data?.find(o => o.id === earning.order_id)?.order_number || 'N/A',
          store_name: storesResponse.data?.find(s => s.id === earning.store_id)?.name || 'Loja não encontrada'
        }));

        setEarnings(enrichedData);
        calculateSummary(data);
      } else {
        setEarnings([]);
        calculateSummary([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: Earning[]) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const pending = data
      .filter(e => e.payment_status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

    const paidThisMonth = data
      .filter(e => 
        e.payment_status === 'paid' && 
        e.paid_at && 
        new Date(e.paid_at) >= firstDayOfMonth
      )
      .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

    const totalYear = data
      .filter(e => 
        e.payment_status === 'paid' && 
        e.paid_at && 
        new Date(e.paid_at) >= firstDayOfYear
      )
      .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

    setSummary({ pending, paidThisMonth, totalYear });
  };

  const exportToCSV = () => {
    const headers = ['Data Entrega', 'Pedido', 'Taxa Entrega', 'Ganho', 'Status', 'Data Pagamento', 'Referência'];
    const rows = earnings.map(e => [
      format(new Date(e.delivered_at), 'dd/MM/yyyy HH:mm'),
      e.order_number,
      formatCurrency(parseFloat(e.delivery_fee.toString())),
      formatCurrency(parseFloat(e.earnings_amount.toString())),
      e.payment_status === 'paid' ? 'Pago' : 'Pendente',
      e.paid_at ? format(new Date(e.paid_at), 'dd/MM/yyyy') : '-',
      e.payment_reference || '-'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  const pendingEarnings = earnings.filter(e => e.payment_status === 'pending' && !e.payment_requested_at);
  const hasPendingEarnings = pendingEarnings.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 max-w-6xl space-y-4 md:space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 md:w-8 md:h-8" />
          Pagamentos
        </h1>
        <Button 
          onClick={() => setRequestDialogOpen(true)}
          disabled={!hasPendingEarnings}
          className="gap-2 text-sm md:text-base h-9 md:h-10 px-3 md:px-4 flex-shrink-0"
        >
          <Send className="h-3 w-3 md:h-4 md:w-4" />
          <span>Solicitar</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Solicitações de Pagamento */}
      {enrichedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Solicitações de Pagamento
                {enrichedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {enrichedRequests.length}
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpandAllRequests}
                className="gap-2"
              >
                {allRequestsExpanded ? (
                  <>
                    <ChevronsUpDown className="h-4 w-4" />
                    Recolher
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="h-4 w-4" />
                    Expandir
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enrichedRequests.map((request) => {
                const isExpanded = expandedRequestIds.has(request.id);
                
                return (
                  <Collapsible
                    key={request.id}
                    open={isExpanded}
                    onOpenChange={() => toggleRequestExpand(request.id)}
                  >
                    {/* Header - Sempre visível */}
                    <CollapsibleTrigger asChild>
                      <div className="border rounded-lg p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {request.status === 'pending' ? (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Aguardando
                                </Badge>
                              ) : request.status === 'approved' ? (
                                <Badge className="bg-green-600 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Aprovado
                                </Badge>
                              ) : request.status === 'rejected' ? (
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejeitado
                                </Badge>
                              ) : null}
                              
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(request.requested_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-sm">
                              <Store className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate font-medium">{request.store_name}</span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              {request.earnings_count} {request.earnings_count === 1 ? 'entrega' : 'entregas'}
                            </p>
                            
                            {request.notes && (
                              <div className="text-xs md:text-sm text-muted-foreground border-l-2 border-primary pl-2 mt-2">
                                <span className="font-medium">Obs:</span> {request.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="text-base md:text-lg font-bold text-green-600">
                              {formatCurrency(request.total_amount)}
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground mx-auto mt-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground mx-auto mt-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Conteúdo expandido */}
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="pt-3 border-t space-y-3">
                        {/* Data da solicitação */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {format(new Date(request.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>

                        {/* Data de revisão (se houver) */}
                        {request.reviewed_at && (
                          <p className="text-xs text-muted-foreground">
                            {request.status === 'approved' ? 'Aprovado' : 'Rejeitado'} em{' '}
                            {format(new Date(request.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}

                        {/* Observações */}
                        {request.notes && (
                          <div className="bg-muted/50 rounded p-3">
                            <p className="text-xs font-medium mb-1">Observações:</p>
                            <p className="text-sm text-muted-foreground">{request.notes}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xl md:text-3xl font-bold text-amber-600">
              {formatCurrency(summary.pending)}
            </p>
            <p className="text-xs text-muted-foreground">A receber</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Pago Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xl md:text-3xl font-bold text-green-600">
              {formatCurrency(summary.paidThisMonth)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'MMMM', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Total Ano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xl md:text-3xl font-bold text-blue-600">
              {formatCurrency(summary.totalYear)}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Período</label>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-9">
                  <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
                  <TabsTrigger value="three_months" className="text-xs">3M</TabsTrigger>
                  <TabsTrigger value="six_months" className="text-xs">6M</TabsTrigger>
                  <TabsTrigger value="year" className="text-xs md:hidden">Ano</TabsTrigger>
                  <TabsTrigger value="year" className="text-xs hidden md:inline-flex">Ano</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Status</label>
              <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">Pendente</TabsTrigger>
                  <TabsTrigger value="paid" className="text-xs">Pagos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">Histórico de Pagamentos</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 md:h-9 text-xs md:text-sm">
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-sm md:text-base text-muted-foreground">
              Nenhum pagamento encontrado para o período selecionado
            </div>
          ) : (
            <>
              {/* MOBILE: Cards */}
              {isMobile ? (
                <div className="space-y-2">
                  {earnings.map(earning => (
                    <PaymentHistoryCard
                      key={earning.id}
                      earning={earning}
                      onViewReceipt={(id) => setSelectedReceiptEarningId(id)}
                    />
                  ))}
                </div>
              ) : (
                /* DESKTOP: Tabela */
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead className="py-3">Data Entrega</TableHead>
                        <TableHead>Loja</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Ganho</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Comprovante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.map(earning => (
                        <TableRow key={earning.id} className="hover:bg-muted/30">
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-sm">
                                {format(new Date(earning.delivered_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(earning.delivered_at), 'HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate max-w-[120px] text-sm">{earning.store_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatOrderNumber(earning.order_number || '')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatCurrency(parseFloat(earning.delivery_fee.toString()))}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(parseFloat(earning.earnings_amount.toString()))}
                          </TableCell>
                          <TableCell>
                            {earning.payment_requested_at && earning.payment_status === 'pending' ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                <Send className="w-3 h-3 mr-1" />
                                Solicitado
                              </Badge>
                            ) : earning.payment_status === 'pending' ? (
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Pago
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {earning.paid_at ? format(new Date(earning.paid_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                            {earning.payment_reference && (
                              <div className="text-xs mt-0.5">Ref: {earning.payment_reference}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {earning.payment_receipt_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReceiptEarningId(earning.id)}
                                className="h-8"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PaymentReceiptDialog
        open={selectedReceiptEarningId !== null}
        onOpenChange={(open) => !open && setSelectedReceiptEarningId(null)}
        earningId={selectedReceiptEarningId || ''}
      />

      <PaymentRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        earnings={pendingEarnings}
        onSubmit={async (earningIds, notes) => {
          const total = pendingEarnings
            .filter(e => earningIds.includes(e.id))
            .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);
          await createRequest(earningIds, total, notes);
        }}
      />
    </div>
  );
}
