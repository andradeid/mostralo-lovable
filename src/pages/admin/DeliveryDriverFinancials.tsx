import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, PaymentType } from "@/utils/driverEarnings";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DollarSign, 
  Download,
  Clock,
  CheckCircle2,
  Loader2,
  FileImage
} from "lucide-react";
import { ConfirmPaymentDialog } from "@/components/admin/delivery/ConfirmPaymentDialog";
import { PaymentReceiptDialog } from "@/components/admin/delivery/PaymentReceiptDialog";
import { PaymentRequestsCard } from "@/components/admin/delivery/PaymentRequestsCard";
import { DriverPendingSummaryCard } from "@/components/admin/delivery/DriverPendingSummaryCard";
import { usePaymentRequests } from "@/hooks/usePaymentRequests";
import { toast } from "sonner";

interface Earning {
  id: string;
  driver_id: string;
  order_id: string;
  delivery_fee: number;
  earnings_amount: number;
  payment_type: PaymentType;
  payment_status: string;
  paid_at?: string;
  payment_reference?: string;
  payment_receipt_url?: string;
  delivered_at: string;
  driver_name?: string;
  order_number?: string;
}

interface Summary {
  pending: number;
  paidThisMonth: number;
  totalYear: number;
}

export default function DeliveryDriverFinancials() {
  const { profile } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, paidThisMonth: 0, totalYear: 0 });
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEarnings, setSelectedEarnings] = useState<Set<string>>(new Set());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [driverPaymentInfo, setDriverPaymentInfo] = useState<any>(null);
  const [selectedReceiptEarningId, setSelectedReceiptEarningId] = useState<string | null>(null);
  const [cardPaymentData, setCardPaymentData] = useState<{
    earningIds: string[];
    totalAmount: number;
    driverName: string;
    driverId: string;
  } | null>(null);

  const {
    requests: paymentRequests,
    loading: requestsLoading,
    pendingCount,
    approveRequest,
    rejectRequest
  } = usePaymentRequests({ storeId: storeId || undefined, status: 'pending' });

  // Filtro automático por URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const driverId = urlParams.get('driver');
    if (driverId && driverId !== 'all') {
      setSelectedDriver(driverId);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchStoreAndData();
    }
  }, [profile]);

  useEffect(() => {
    if (storeId) {
      fetchEarnings();
    }
  }, [storeId, selectedDriver, selectedPeriod, selectedStatus]);

  useEffect(() => {
    if (selectedDriver && selectedDriver !== 'all') {
      fetchDriverPaymentInfo();
    } else {
      setDriverPaymentInfo(null);
    }
  }, [selectedDriver]);

  const fetchDriverPaymentInfo = async () => {
    if (!selectedDriver || selectedDriver === 'all') return;

    try {
      const { data } = await supabase
        .from('driver_payment_info')
        .select('*')
        .eq('driver_id', selectedDriver)
        .maybeSingle();

      setDriverPaymentInfo(data);
    } catch (error) {
      console.error('Error fetching payment info:', error);
    }
  };

  const fetchStoreAndData = async () => {
    if (!profile) return;

    try {
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', profile.id)
        .single();

      if (store) {
        setStoreId(store.id);
        
        // Buscar entregadores
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('store_id', store.id)
          .eq('role', 'delivery_driver');

        if (userRoles && userRoles.length > 0) {
          const driverIds = userRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', driverIds);

          setDrivers(profiles || []);
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    }
  };

  const fetchEarnings = async () => {
    if (!storeId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('driver_earnings')
        .select('*')
        .eq('store_id', storeId)
        .order('delivered_at', { ascending: false });

      // Filtrar por entregador
      if (selectedDriver !== 'all') {
        query = query.eq('driver_id', selectedDriver);
      }

      // Filtrar por período
      const now = new Date();
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('delivered_at', weekAgo.toISOString());
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('delivered_at', monthAgo.toISOString());
      }

      // Filtrar por status
      if (selectedStatus !== 'all') {
        query = query.eq('payment_status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos entregadores e números dos pedidos
      if (data && data.length > 0) {
        const driverIds = [...new Set(data.map(e => e.driver_id))];
        const orderIds = [...new Set(data.map(e => e.order_id))];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', driverIds);

        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, order_number')
          .in('id', orderIds);

        const enrichedData = data.map(earning => ({
          ...earning,
          driver_name: profilesData?.find(p => p.id === earning.driver_id)?.full_name || 'N/A',
          order_number: ordersData?.find(o => o.id === earning.order_id)?.order_number || 'N/A',
        }));

        setEarnings(enrichedData);
        calculateSummary(enrichedData);
      } else {
        setEarnings([]);
        calculateSummary([]);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Erro ao carregar ganhos');
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

  const toggleEarning = (id: string) => {
    const newSelected = new Set(selectedEarnings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEarnings(newSelected);
  };

  const toggleAll = () => {
    const pendingEarnings = earnings.filter(e => e.payment_status === 'pending');
    if (selectedEarnings.size === pendingEarnings.length) {
      setSelectedEarnings(new Set());
    } else {
      setSelectedEarnings(new Set(pendingEarnings.map(e => e.id)));
    }
  };

  const selectedTotal = earnings
    .filter(e => selectedEarnings.has(e.id))
    .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

  const selectedDriverName = earnings.find(e => selectedEarnings.has(e.id))?.driver_name || '';
  const selectedDriverId = earnings.find(e => selectedEarnings.has(e.id))?.driver_id || '';

  // Agrupar entregas pendentes por entregador
  const pendingByDriver = useMemo(() => {
    const grouped = earnings
      .filter(e => e.payment_status === 'pending')
      .reduce((acc, earning) => {
        if (!acc[earning.driver_id]) {
          acc[earning.driver_id] = {
            driverId: earning.driver_id,
            driverName: earning.driver_name || 'N/A',
            avatarUrl: drivers.find(d => d.id === earning.driver_id)?.avatar_url,
            totalAmount: 0,
            earningIds: [] as string[],
            count: 0
          };
        }
        acc[earning.driver_id].totalAmount += parseFloat(earning.earnings_amount.toString());
        acc[earning.driver_id].earningIds.push(earning.id);
        acc[earning.driver_id].count++;
        return acc;
      }, {} as Record<string, { driverId: string; driverName: string; avatarUrl?: string; totalAmount: number; earningIds: string[]; count: number }>);
    
    return Object.values(grouped);
  }, [earnings, drivers]);

  const handleCardPayClick = (driver: typeof pendingByDriver[0]) => {
    setCardPaymentData({
      earningIds: driver.earningIds,
      totalAmount: driver.totalAmount,
      driverName: driver.driverName,
      driverId: driver.driverId
    });
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Header responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Financeiro Entregadores</h1>
            <p className="text-sm text-muted-foreground">Gerencie os pagamentos dos entregadores</p>
          </div>
        </div>

        {/* Card de Solicitações Pendentes */}
        {!requestsLoading && paymentRequests.length > 0 && (
          <PaymentRequestsCard
            requests={paymentRequests}
            drivers={new Map(drivers.map(d => [d.id, { full_name: d.full_name, avatar_url: d.avatar_url }]))}
            onApprove={approveRequest}
            onReject={rejectRequest}
          />
        )}

        {/* Cards de Resumo - grid 2x2 em mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="p-3 md:p-0">
            <CardHeader className="pb-1 md:pb-3 p-0 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                A Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <p className="text-lg md:text-2xl font-bold text-amber-600">{formatCurrency(summary.pending)}</p>
            </CardContent>
          </Card>

          <Card className="p-3 md:p-0">
            <CardHeader className="pb-1 md:pb-3 p-0 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Pago Este Mês</span>
                <span className="sm:hidden">Pago/Mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <p className="text-lg md:text-2xl font-bold text-green-600">{formatCurrency(summary.paidThisMonth)}</p>
            </CardContent>
          </Card>

          <Card className="p-3 md:p-0 col-span-2 md:col-span-1">
            <CardHeader className="pb-1 md:pb-3 p-0 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                Total Ano
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <p className="text-lg md:text-2xl font-bold">{formatCurrency(summary.totalYear)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Resumo por Entregador */}
        {pendingByDriver.length > 0 && (
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              💵 Pagamentos Pendentes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {pendingByDriver.map(driver => (
                <DriverPendingSummaryCard
                  key={driver.driverId}
                  driverName={driver.driverName}
                  driverId={driver.driverId}
                  avatarUrl={driver.avatarUrl}
                  pendingCount={driver.count}
                  totalAmount={driver.totalAmount}
                  earningIds={driver.earningIds}
                  onPayClick={() => handleCardPayClick(driver)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <label className="text-xs md:text-sm font-medium">Entregador</label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="text-xs md:text-sm font-medium">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="text-xs md:text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info do Entregador - removido temporariamente */}

        {/* Ações */}
        {selectedEarnings.size > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {selectedEarnings.size} entrega(s) selecionada(s)
                  </p>
                  <p className="text-base md:text-lg font-bold text-primary">
                    Total: {formatCurrency(selectedTotal)}
                  </p>
                </div>
                <Button onClick={() => setShowPaymentDialog(true)} size="sm" className="w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base md:text-lg">Histórico de Ganhos</CardTitle>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : earnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ganho encontrado
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEarnings.size > 0 && selectedEarnings.size === earnings.filter(e => e.payment_status === 'pending').length}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Entregador</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Ganho</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Comprovante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map(earning => (
                      <TableRow key={earning.id}>
                        <TableCell>
                          {earning.payment_status === 'pending' && (
                            <Checkbox
                              checked={selectedEarnings.has(earning.id)}
                              onCheckedChange={() => toggleEarning(earning.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {earning.driver_name || 'N/A'}
                        </TableCell>
                        <TableCell>#{earning.order_number || 'N/A'}</TableCell>
                        <TableCell>
                          {format(new Date(earning.delivered_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(earning.delivery_fee.toString()))}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(parseFloat(earning.earnings_amount.toString()))}
                        </TableCell>
                        <TableCell>
                          {earning.payment_status === 'pending' ? (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Pago
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {earning.payment_receipt_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReceiptEarningId(earning.id)}
                            >
                              <FileImage className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        earningIds={Array.from(selectedEarnings)}
        totalAmount={selectedTotal}
        driverName={selectedDriverName}
        driverId={selectedDriverId}
        onSuccess={() => {
          fetchEarnings();
          setSelectedEarnings(new Set());
        }}
      />

      {/* Dialog para pagamento via card */}
      <ConfirmPaymentDialog
        open={cardPaymentData !== null}
        onOpenChange={(open) => !open && setCardPaymentData(null)}
        earningIds={cardPaymentData?.earningIds || []}
        totalAmount={cardPaymentData?.totalAmount || 0}
        driverName={cardPaymentData?.driverName || ''}
        driverId={cardPaymentData?.driverId || ''}
        onSuccess={() => {
          fetchEarnings();
          setCardPaymentData(null);
        }}
      />

      <PaymentReceiptDialog
        open={selectedReceiptEarningId !== null}
        onOpenChange={(open) => !open && setSelectedReceiptEarningId(null)}
        earningId={selectedReceiptEarningId || ''}
      />
    </>
  );
}
