import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { useProfessionalData, useProfessionalCommissions } from "@/hooks/useProfessionalData";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfessionalCommissions() {
  const [tab, setTab] = useState("pending");
  const { data: professional } = useProfessionalData();
  const { data: commissions, isLoading } = useProfessionalCommissions(professional?.id);

  const pendingCommissions = commissions?.filter((c: any) => c.status === "pending") || [];
  const paidCommissions = commissions?.filter((c: any) => c.status === "paid") || [];

  const pendingTotal = pendingCommissions.reduce((acc: number, c: any) => acc + Number(c.commission_amount), 0);
  const paidTotal = paidCommissions.reduce((acc: number, c: any) => acc + Number(c.commission_amount), 0);

  // Comissões do mês atual
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthCommissions = commissions?.filter((c: any) => {
    const date = parseISO(c.created_at);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  }) || [];
  const monthTotal = monthCommissions.reduce((acc: number, c: any) => acc + Number(c.commission_amount), 0);

  const CommissionCard = ({ commission }: { commission: any }) => (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">
            {commission.bookings?.booking_services?.name || "Serviço"}
          </p>
          <p className="text-sm text-muted-foreground">
            {commission.bookings?.customer_name || "Cliente"}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(commission.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-primary">
            R$ {Number(commission.commission_amount).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {commission.commission_type === "percentage" 
              ? `${commission.commission_value}%` 
              : "Fixo"
            } de R$ {Number(commission.service_price).toFixed(2)}
          </p>
          {commission.status === "paid" && commission.paid_at && (
            <p className="text-xs text-green-600 mt-1">
              Pago em {format(parseISO(commission.paid_at), "dd/MM/yyyy")}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Minhas Comissões</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold">R$ {pendingTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Já Recebido</p>
                <p className="text-2xl font-bold">R$ {paidTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">R$ {monthTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Type Info */}
      {professional && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-medium">Tipo de Comissão</span>
              </div>
              <Badge variant="secondary">
                {professional.commission_type === "percentage"
                  ? `${professional.commission_value}% por serviço`
                  : `R$ ${professional.commission_value} fixo por serviço`
                }
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pendentes ({pendingCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Pagas ({paidCommissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : pendingCommissions.length > 0 ? (
            <div className="space-y-3">
              {pendingCommissions.map((commission: any) => (
                <CommissionCard key={commission.id} commission={commission} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma comissão pendente</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : paidCommissions.length > 0 ? (
            <div className="space-y-3">
              {paidCommissions.map((commission: any) => (
                <CommissionCard key={commission.id} commission={commission} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma comissão paga ainda</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
