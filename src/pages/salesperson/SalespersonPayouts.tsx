import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PayoutRequestDialog } from "@/components/salesperson/PayoutRequestDialog";
import { PayoutStatusBadge } from "@/components/salesperson/PayoutStatusBadge";
import { canRequestPayout, payoutScheduleText } from "@/lib/partnerPayout";
import { brl } from "@/lib/brl";

interface Salesperson {
  id: string;
  salesperson_type: string;
  monthly_earnings_limit: number | null;
  current_month_earnings: number;
  bonus_eligible: boolean;
  pix_key: string | null;
  pix_key_type: string | null;
}

interface Payout {
  id: string;
  cycle_month: number;
  cycle_year: number;
  total_sales: number;
  commission_total: number;
  bonus_total: number;
  grand_total: number;
  requested_at: string | null;
  invoice_url: string | null;
  invoice_number: string | null;
  status: string;
  rejection_reason: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  scheduled_payment_date?: string | null;
  created_at: string;
}

const AFFILIATE_MONTHLY_LIMIT = 1900;

export default function SalespersonPayouts() {
  const { profile } = useAuth();
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    try {
      // Buscar dados do vendedor
      const { data: spData, error: spError } = await supabase
        .from('salespeople')
        .select('id, salesperson_type, monthly_earnings_limit, current_month_earnings, bonus_eligible, pix_key, pix_key_type')
        .eq('user_id', profile?.id)
        .single();

      if (spError) throw spError;
      setSalesperson(spData);

      // Buscar histórico de pagamentos
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('salesperson_payouts')
        .select('*')
        .eq('salesperson_id', spData.id)
        .order('cycle_year', { ascending: false })
        .order('cycle_month', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAffiliate = salesperson?.salesperson_type === 'affiliate';
  const monthlyLimit = salesperson?.monthly_earnings_limit || AFFILIATE_MONTHLY_LIMIT;
  const currentEarnings = salesperson?.current_month_earnings || 0;
  const limitReached = isAffiliate && currentEarnings >= monthlyLimit;
  const limitPercentage = isAffiliate ? Math.min((currentEarnings / monthlyLimit) * 100, 100) : 0;

  // Calcular totais
  const totalPending = payouts
    .filter(p => ['open', 'pending', 'requested', 'approved'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.grand_total), 0);
  const nextPayout = payouts
    .filter(p => ['open', 'pending', 'requested', 'approved'].includes(p.status) && Number(p.grand_total) > 0)
    .sort((a, b) => (a.scheduled_payment_date ?? '').localeCompare(b.scheduled_payment_date ?? ''))[0];
  const totalPaid = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.grand_total), 0);
  const availableToRequest = payouts.filter(canRequestPayout);

  const handleRequestPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowRequestDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Meus Pagamentos</h1>
        <p className="text-sm md:text-base text-muted-foreground">Comissão de cada mensalidade paga pelos seus clientes. O que entra no mês é pago no dia 15 do mês seguinte.</p>
      </div>

      {/* Badge do tipo */}
      <div className="flex flex-wrap items-center gap-2">
        {isAffiliate ? (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            👤 Afiliado (CPF)
          </Badge>
        ) : (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            🏢 Parceiro PJ (CNPJ)
          </Badge>
        )}
        {!salesperson?.pix_key && (
          <Badge variant="destructive">
            ⚠️ PIX não cadastrado
          </Badge>
        )}
      </div>

      {/* Alerta de limite para afiliados */}
      {isAffiliate && (
        <Alert className={limitReached ? "border-red-500 bg-red-50" : "border-amber-500 bg-amber-50"}>
          <AlertTriangle className={`h-4 w-4 ${limitReached ? "text-red-600" : "text-amber-600"}`} />
          <AlertDescription className={`text-xs md:text-sm ${limitReached ? "text-red-700" : "text-amber-700"}`}>
            {limitReached ? (
              <>
                <strong>Limite mensal atingido!</strong> Você atingiu o limite de R$ {monthlyLimit.toLocaleString('pt-BR')}/mês. 
                Para ganhos ilimitados, faça <a href="/vendedor/upgrade" className="underline font-semibold">upgrade para Parceiro PJ</a>.
              </>
            ) : (
              <>
                <strong>Limite mensal:</strong> Como afiliado, você pode receber até R$ {monthlyLimit.toLocaleString('pt-BR')}/mês sem NF. 
                Ganhos este mês: {brl(currentEarnings)} ({limitPercentage.toFixed(0)}%)
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Pronto para solicitar</CardTitle>
            <Wallet className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              R$ {availableToRequest.reduce((sum, p) => sum + Number(p.grand_total), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {availableToRequest.length} período(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">A receber</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-amber-600">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {nextPayout ? `Próximo: ${brl(nextPayout.grand_total)} · ${payoutScheduleText(nextPayout).toLowerCase()}` : 'Nenhum valor a receber'}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Recebido</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Desde o início
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instruções por tipo */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent>
          {isAffiliate ? (
            <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <p>✅ <strong>Sem nota fiscal:</strong> Como afiliado, você não precisa emitir NF</p>
              <p>⚠️ <strong>Limite mensal:</strong> R$ {monthlyLimit.toLocaleString('pt-BR')}/mês</p>
              <p>💳 <strong>Pagamento via PIX:</strong> Direto na sua conta</p>
              <p>🔁 <strong>Todo mês:</strong> comissão em cada mensalidade paga, enquanto o cliente pagar</p>
              <p>📅 <strong>Dia 15:</strong> o que entrou no mês é pago no dia 15 do mês seguinte</p>
            </div>
          ) : (
            <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <p>🔁 <strong>Todo mês:</strong> comissão em cada mensalidade paga, enquanto o cliente pagar</p>
              <p>📅 <strong>Dia 15:</strong> o que entrou no mês é pago no dia 15 do mês seguinte</p>
              <p>📄 <strong>Nota fiscal obrigatória:</strong> Anexe a NF ao solicitar, a partir do dia 1º</p>
              <p>♾️ <strong>Sem limite:</strong> Valores ilimitados</p>
              <p>🏆 <strong>Bônus:</strong> Elegível para bônus trimestrais</p>
              <p>💳 <strong>Pagamento via PIX:</strong> Após verificação da NF</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de pagamentos */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Histórico de Pagamentos</CardTitle>
          <CardDescription className="text-xs md:text-sm">Todos os seus períodos de comissão</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm md:text-base">Nenhum pagamento registrado ainda</p>
              <p className="text-xs md:text-sm">Suas comissões aparecerão aqui quando você realizar vendas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 mb-3 md:mb-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm md:text-base">
                        {format(new Date(payout.cycle_year, payout.cycle_month - 1), 'MMMM yyyy', { locale: ptBR })}
                      </span>
                      <PayoutStatusBadge status={payout.status} />
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {payout.total_sales} pagamento(s) • Comissão: R$ {Number(payout.commission_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      {Number(payout.bonus_total) > 0 && (
                        <> • Bônus: R$ {Number(payout.bonus_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                      )}
                    </div>
                    {payout.status === 'rejected' && payout.rejection_reason && (
                      <p className="text-xs text-red-600">Motivo: {payout.rejection_reason}</p>
                    )}
                    <p className={payout.status === 'paid' ? 'text-xs text-green-600' : 'text-xs text-muted-foreground'}>
                      {payoutScheduleText(payout)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:gap-3">
                    <p className="font-bold text-base md:text-lg">
                      R$ {Number(payout.grand_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>

                    <div className="flex gap-2">
                      {canRequestPayout(payout) && (
                        <Button
                          size="sm"
                          onClick={() => handleRequestPayout(payout)}
                          disabled={!salesperson?.pix_key || (isAffiliate && limitReached)}
                        >
                          Solicitar
                        </Button>
                      )}

                      {payout.invoice_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payout.invoice_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      {payout.payment_proof_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payout.payment_proof_url} target="_blank" rel="noopener noreferrer">
                            <CheckCircle className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de solicitação */}
      {selectedPayout && salesperson && (
        <PayoutRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          payout={selectedPayout}
          salesperson={salesperson}
          onSuccess={() => {
            setShowRequestDialog(false);
            setSelectedPayout(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
