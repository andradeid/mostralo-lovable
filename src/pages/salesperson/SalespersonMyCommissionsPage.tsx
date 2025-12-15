import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusFilter = "all" | "pending" | "paid";

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
          payment_approval:payment_approvals(
            company_name,
            plan:plans(name)
          )
        `)
        .eq("salesperson_id", salesperson?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
  const totalGeneral = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
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
          Histórico completo de todas as suas comissões
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              R$ {totalPending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total recebido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalGeneral.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as comissões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de comissões */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Comissões</CardTitle>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-right">% Comissão</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(commission.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {commission.payment_approval?.company_name || "—"}
                      </TableCell>
                      <TableCell>
                        {commission.payment_approval?.plan?.name || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {Number(commission.payment_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(commission.commission_percentage)}%
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        R$ {Number(commission.commission_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {commission.paid_at 
                          ? format(new Date(commission.paid_at), "dd/MM/yyyy", { locale: ptBR })
                          : "—"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {statusFilter === "all" 
                ? "Nenhuma comissão registrada ainda"
                : `Nenhuma comissão ${statusFilter === "pending" ? "pendente" : "paga"}`
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
