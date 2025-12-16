import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Download,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  Clock,
  Info,
  ArrowUpCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AffiliateEarningsChart } from "@/components/admin/salespeople/AffiliateEarningsChart";
import { ResetHistoryTable } from "@/components/admin/salespeople/ResetHistoryTable";
import { AffiliateLimitCard } from "@/components/admin/salespeople/AffiliateLimitCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Affiliate {
  id: string;
  full_name: string;
  cpf: string;
  current_month_earnings: number;
  monthly_earnings_limit: number;
  last_earnings_reset_at: string | null;
  status: string;
}

interface ResetHistory {
  id: string;
  reset_at: string;
  affiliates_count: number;
  total_reset_amount: number;
  executed_by: string;
  reset_details: Array<{
    affiliate_id: string;
    affiliate_name: string;
    reset_amount: number;
  }>;
  notes: string | null;
}

export default function AffiliateEarningsReportsPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [resetHistory, setResetHistory] = useState<ResetHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const { toast } = useToast();

  const MONTHLY_LIMIT = 1900;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar afiliados ativos
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('salespeople')
        .select('id, full_name, cpf, current_month_earnings, monthly_earnings_limit, last_earnings_reset_at, status')
        .eq('salesperson_type', 'affiliate')
        .eq('status', 'active');

      if (affiliatesError) throw affiliatesError;

      // Buscar histórico de resets
      const { data: historyData, error: historyError } = await supabase
        .from('affiliate_earnings_resets')
        .select('*')
        .order('reset_at', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      setAffiliates((affiliatesData || []).map(a => ({
        ...a,
        current_month_earnings: Number(a.current_month_earnings) || 0,
        monthly_earnings_limit: Number(a.monthly_earnings_limit) || MONTHLY_LIMIT
      })));
      
      setResetHistory((historyData || []).map(h => ({
        id: h.id,
        reset_at: h.reset_at,
        affiliates_count: h.affiliates_count,
        total_reset_amount: h.total_reset_amount,
        executed_by: h.executed_by,
        notes: h.notes,
        reset_details: Array.isArray(h.reset_details) 
          ? (h.reset_details as unknown as ResetHistory['reset_details']) 
          : []
      })));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos afiliados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualReset = async () => {
    setResetting(true);
    try {
      // Coletar dados antes do reset
      const affiliatesToReset = affiliates.filter(a => a.current_month_earnings > 0);
      const totalAmount = affiliatesToReset.reduce((sum, a) => sum + a.current_month_earnings, 0);
      const resetDetails = affiliatesToReset.map(a => ({
        affiliate_id: a.id,
        affiliate_name: a.full_name,
        reset_amount: a.current_month_earnings
      }));

      // Executar reset
      const { error: updateError } = await supabase
        .from('salespeople')
        .update({
          current_month_earnings: 0,
          last_earnings_reset_at: new Date().toISOString()
        })
        .eq('salesperson_type', 'affiliate')
        .eq('status', 'active');

      if (updateError) throw updateError;

      // Registrar histórico
      const { error: historyError } = await supabase
        .from('affiliate_earnings_resets')
        .insert({
          affiliates_count: affiliatesToReset.length,
          total_reset_amount: totalAmount,
          reset_details: resetDetails,
          executed_by: 'manual',
          notes: 'Reset manual executado pelo administrador'
        });

      if (historyError) throw historyError;

      toast({
        title: "Reset concluído",
        description: `${affiliatesToReset.length} afiliado(s) resetados. Total: R$ ${totalAmount.toFixed(2)}`
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao resetar ganhos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível executar o reset.",
        variant: "destructive"
      });
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'CPF', 'Ganhos Mês Atual', 'Limite Mensal', '% Utilizado', 'Último Reset'];
    const rows = affiliates.map(a => [
      a.full_name,
      a.cpf || '-',
      `R$ ${a.current_month_earnings.toFixed(2)}`,
      `R$ ${a.monthly_earnings_limit.toFixed(2)}`,
      `${((a.current_month_earnings / a.monthly_earnings_limit) * 100).toFixed(1)}%`,
      a.last_earnings_reset_at ? format(new Date(a.last_earnings_reset_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-afiliados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Calcular estatísticas
  const totalAffiliates = affiliates.length;
  const totalEarnings = affiliates.reduce((sum, a) => sum + a.current_month_earnings, 0);
  const averageEarnings = totalAffiliates > 0 ? totalEarnings / totalAffiliates : 0;
  const nearLimitCount = affiliates.filter(a => (a.current_month_earnings / a.monthly_earnings_limit) >= 0.8).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Relatórios de Afiliados</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Acompanhe ganhos e limites mensais
          </p>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-8 md:h-9">
            <RefreshCw className={`h-4 w-4 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Atualizar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 md:h-9">
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting || affiliates.every(a => a.current_month_earnings === 0)}
            className="h-8 md:h-9"
          >
            <RotateCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Seção de Instruções */}
      <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 md:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm md:text-base truncate">📚 Instruções</span>
          <ChevronDown className={`h-4 w-4 ml-auto shrink-0 transition-transform duration-200 ${instructionsOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 md:mt-4 space-y-3 md:space-y-4">
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {/* Reset Automático */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 shrink-0" />
                  <span className="truncate">🔄 Reset Automático</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs md:text-sm space-y-1.5 md:space-y-2 p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Quando:</strong> Todo dia 1º às 00:01
                </p>
                <ul className="text-muted-foreground space-y-1 text-[10px] md:text-xs">
                  <li>• Zera ganhos do mês</li>
                  <li>• Atualiza data do reset</li>
                  <li>• Registra histórico</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limite Mensal */}
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 shrink-0" />
                  <span className="truncate">⚠️ Limite R$ 1.900</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs md:text-sm space-y-1.5 md:space-y-2 p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Por que:</strong> Evita atividade habitual
                </p>
                <ul className="text-muted-foreground space-y-1 text-[10px] md:text-xs">
                  <li>• Bloqueia ao atingir limite</li>
                  <li>• Alerta ≥80%</li>
                  <li>• Sugira upgrade PJ</li>
                </ul>
              </CardContent>
            </Card>

            {/* Reset Manual */}
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                  <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600 shrink-0" />
                  <span className="truncate">🔴 Reset Manual</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs md:text-sm space-y-1.5 md:space-y-2 p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Uso:</strong> APENAS emergências
                </p>
                <ul className="text-muted-foreground space-y-1 text-[10px] md:text-xs">
                  <li>• Cron falhou</li>
                  <li>• Valores incorretos</li>
                  <li>• Não antecipe reset</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Rápido */}
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>FAQ:</strong> Afiliado ≥80%? → Sugira upgrade PJ. Reset falhou? → Use manual.
            </AlertDescription>
          </Alert>

          {/* Link para Guia Completo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs md:text-sm">Guia completo na página de Vendedores</span>
            </div>
            <Button variant="link" size="sm" asChild className="h-auto p-0">
              <a href="/dashboard/salespeople">Ver Guia →</a>
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Cards de Resumo - Grid 2x2 no mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-full bg-primary/10 shrink-0">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Afiliados</span>
                  <span className="hidden md:inline">Afiliados Ativos</span>
                </p>
                <p className="text-lg md:text-2xl font-bold">{totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-full bg-green-500/10 shrink-0">
                <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Total Mês</span>
                  <span className="hidden md:inline">Total Mês Atual</span>
                </p>
                <p className="text-lg md:text-2xl font-bold">
                  <span className="md:hidden">R$ {totalEarnings.toFixed(0)}</span>
                  <span className="hidden md:inline">R$ {totalEarnings.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-full bg-blue-500/10 shrink-0">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Média</span>
                  <span className="hidden md:inline">Média por Afiliado</span>
                </p>
                <p className="text-lg md:text-2xl font-bold">
                  <span className="md:hidden">R$ {averageEarnings.toFixed(0)}</span>
                  <span className="hidden md:inline">R$ {averageEarnings.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-full bg-orange-500/10 shrink-0">
                <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">≥80%</span>
                  <span className="hidden md:inline">Perto do Limite</span>
                </p>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <p className="text-lg md:text-2xl font-bold">{nearLimitCount}</p>
                  {nearLimitCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] md:text-xs h-4 md:h-5 px-1 md:px-1.5">
                      ≥80%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Ganhos */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Ganhos por Afiliado</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <AffiliateEarningsChart affiliates={affiliates} limit={MONTHLY_LIMIT} />
        </CardContent>
      </Card>

      {/* Cards individuais de afiliados */}
      {affiliates.length > 0 && (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Detalhamento por Afiliado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {affiliates.map(affiliate => (
              <AffiliateLimitCard key={affiliate.id} affiliate={affiliate} />
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Resets */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Histórico de Resets</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <ResetHistoryTable history={resetHistory} />
        </CardContent>
      </Card>

      {/* Dialog de confirmação de reset */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="max-w-[95vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-lg">Confirmar Reset Manual</AlertDialogTitle>
            <AlertDialogDescription className="text-xs md:text-sm">
              Esta ação irá zerar os ganhos de {affiliates.filter(a => a.current_month_earnings > 0).length} afiliados 
              (total: R$ {affiliates.reduce((sum, a) => sum + a.current_month_earnings, 0).toFixed(2)}).
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-9">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleManualReset} 
              disabled={resetting}
              className="bg-destructive hover:bg-destructive/90 h-9"
            >
              {resetting ? 'Resetando...' : 'Confirmar Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
