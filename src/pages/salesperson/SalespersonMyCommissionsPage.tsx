import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import { brl } from '@/lib/brl';
import { COMMISSION_STATUS_LABEL, formatIsoDate, payoutDateForCycle } from '@/lib/partnerPayout';

type StatusFilter = "all" | "pending" | "paid" | "cancelled";

interface CommissionRow {
  id: string;
  payment_amount: number;
  commission_percentage: number | null;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  received_at: string | null;
  store_name: string | null;
  plan_name: string | null;
  payment_sequence: number | null;
  cycle_month: number | null;
  cycle_year: number | null;
  payout: { scheduled_payment_date: string | null; status: string } | null;
  payment_approval: { company_name: string | null; plan: { name: string } | null } | null;
}

const clientName = (c: CommissionRow) => c.store_name || c.payment_approval?.company_name || "—";
const planName = (c: CommissionRow) => c.plan_name || c.payment_approval?.plan?.name || "—";
const paymentLabel = (c: CommissionRow) => (c.payment_sequence ? `${c.payment_sequence}º pagamento` : "Pagamento");

/** Quando a comissão é (ou foi) paga: dia 15 do mês seguinte ao recebimento. */
function payoutWhen(c: CommissionRow): string {
  if (c.status === "paid") return c.paid_at ? `Pago em ${formatIsoDate(c.paid_at)}` : "Pago";
  if (c.status === "cancelled") return "—";
  const date = c.payout?.scheduled_payment_date
    ?? (c.cycle_month && c.cycle_year ? payoutDateForCycle(c.cycle_month, c.cycle_year) : null);
  return date ? `Previsto ${formatIsoDate(date)}` : "—";
}

export default function SalespersonMyCommissionsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Buscar salesperson_id
  const { data: salesperson } = useQuery({
    queryKey: ["salesperson-self", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar comissões
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["salesperson-commissions", salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salesperson_commissions")
        .select(`
          id,
          payment_approval_id,
          payment_amount,
          commission_percentage,
          commission_amount,
          status,
          created_at,
          paid_at,
          received_at,
          store_name,
          plan_name,
          payment_sequence,
          cycle_month,
          cycle_year,
          payout:salesperson_payouts(scheduled_payment_date, status),
          payment_approval:payment_approvals(
            company_name,
            plan:plans(name)
          )
        `)
        .eq("salesperson_id", salesperson?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CommissionRow[];
    },
    enabled: !!salesperson?.id,
  });

  // Filtrar comissões
  const filteredCommissions = commissions?.filter(c => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  }) || [];

  // Calcular totais
  const totalPending = commissions?.filter(c => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
  const totalPaid = commissions?.filter(c => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
  const totalGeneral = commissions?.filter(c => c.status !== "cancelled")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{COMMISSION_STATUS_LABEL.paid}</Badge>;
      case "pending":
        return <Badge variant="secondary">{COMMISSION_STATUS_LABEL.pending}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-muted-foreground">{COMMISSION_STATUS_LABEL.cancelled}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Comissões</h1>
        <p className="text-muted-foreground">
          Comissão de cada mensalidade paga pelos clientes que você indicou, todo mês. O que entra no mês é pago no dia 15 do mês seguinte.
        </p>
      </div>

      {/* Cards de resumo - Grid 2+1 no mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">A receber</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-yellow-500">
              {brl(totalPending)}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Pago no dia 15
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Pago</CardTitle>
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-green-500">
              {brl(totalPaid)}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Total recebido
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">
              {brl(totalGeneral)}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Todas as comissões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de comissões */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Histórico de Comissões</CardTitle>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">A receber</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length > 0 ? (
            <>
              {/* Mobile: Cards compactos */}
              <div className="md:hidden space-y-3">
                {filteredCommissions.map((commission) => (
                  <div key={commission.id} className="p-3 rounded-lg border bg-card w-[90%] mx-auto">
                    {/* Header: Data + Status */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {formatIsoDate(commission.received_at ?? commission.created_at)} · {paymentLabel(commission)}
                      </span>
                      {getStatusBadge(commission.status)}
                    </div>
                    
                    {/* Cliente + Plano */}
                    <p className="font-medium text-sm">{clientName(commission)}</p>
                    <p className="text-xs text-muted-foreground">{planName(commission)}</p>
                    
                    {/* Valores */}
                    <div className="mt-2 pt-2 border-t flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Valor recebido</p>
                        <p className="text-xs">{brl(Number(commission.payment_amount))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">
                          Comissão{commission.commission_percentage != null ? ` (${Number(commission.commission_percentage)}%)` : ""}
                        </p>
                        <p className="text-sm font-bold text-green-500">
                          {brl(Number(commission.commission_amount))}
                        </p>
                      </div>
                    </div>
                    
                    {/* Data pagamento se pago */}
                    <p className={commission.status === "paid" ? "text-[10px] text-green-600 mt-1" : "text-[10px] text-muted-foreground mt-1"}>
                      {payoutWhen(commission)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop: Tabela original */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recebido em</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Valor recebido</TableHead>
                      <TableHead className="text-right">% Comissão</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="text-muted-foreground">
                          {formatIsoDate(commission.received_at ?? commission.created_at)}
                          <span className="block text-xs">{paymentLabel(commission)}</span>
                        </TableCell>
                        <TableCell className="font-medium">{clientName(commission)}</TableCell>
                        <TableCell>{planName(commission)}</TableCell>
                        <TableCell className="text-right">
                          {brl(Number(commission.payment_amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          {commission.commission_percentage != null ? `${Number(commission.commission_percentage)}%` : "fixa"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {brl(Number(commission.commission_amount))}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell className={commission.status === "paid" ? "text-green-600" : "text-muted-foreground"}>
                          {payoutWhen(commission)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {statusFilter === "all" 
                ? "Nenhuma comissão registrada ainda"
                : `Nenhuma comissão ${statusFilter === "pending" ? "a receber" : statusFilter === "paid" ? "paga" : "cancelada"}`
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
