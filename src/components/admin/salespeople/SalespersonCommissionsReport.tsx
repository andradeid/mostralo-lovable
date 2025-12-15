import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Clock, CheckCircle2, Loader2, Ban } from "lucide-react";

interface SalespersonCommissionsReportProps {
  salespersonId: string;
}

export function SalespersonCommissionsReport({ salespersonId }: SalespersonCommissionsReportProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: commissions, isLoading, refetch } = useQuery({
    queryKey: ["salesperson-commissions", salespersonId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("salesperson_commissions")
        .select("*")
        .eq("salesperson_id", salespersonId)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleMarkAsPaid = async (commissionId: string) => {
    setPayingId(commissionId);
    try {
      const { error } = await supabase
        .from("salesperson_commissions")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", commissionId);

      if (error) throw error;

      toast({
        title: "Comissão paga",
        description: "A comissão foi marcada como paga com sucesso",
      });
      refetch();
    } catch (error) {
      console.error("Erro ao marcar comissão como paga:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a comissão como paga",
        variant: "destructive",
      });
    } finally {
      setPayingId(null);
    }
  };

  const totalPending = commissions?.filter(c => c.status === "pending").reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
  const totalPaid = commissions?.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
  const totalAll = (totalPending + totalPaid);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{formatCurrency(totalAll)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Histórico de Comissões</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ban className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma comissão registrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="text-sm">
                      {format(new Date(commission.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{commission.store_name || "—"}</TableCell>
                    <TableCell>{commission.plan_name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(commission.payment_amount))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(Number(commission.commission_amount))}
                      {commission.commission_type === "percentage" && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({commission.commission_percentage}%)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {commission.status === "pending" ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      ) : commission.status === "paid" ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{commission.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {commission.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(commission.id)}
                          disabled={payingId === commission.id}
                        >
                          {payingId === commission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Pagar"
                          )}
                        </Button>
                      )}
                      {commission.status === "paid" && commission.paid_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(commission.paid_at), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
