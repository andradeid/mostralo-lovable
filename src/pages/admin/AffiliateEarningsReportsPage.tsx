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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Afiliados</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe ganhos e limites mensais dos afiliados (CPF)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting || affiliates.every(a => a.current_month_earnings === 0)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Manual
          </Button>
        </div>
      </div>

      {/* Seção de Instruções */}
      <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <HelpCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold">📚 Instruções de Uso</span>
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${instructionsOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Reset Automático */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  🔄 Reset Automático Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Quando:</strong> Todo dia 1º às 00:01 UTC
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Zera <code className="bg-muted px-1 rounded">current_month_earnings</code></li>
                  <li>• Atualiza <code className="bg-muted px-1 rounded">last_earnings_reset_at</code></li>
                  <li>• Registra histórico automaticamente</li>
                  <li>• Executado por: <Badge variant="outline" className="text-xs">system_cron</Badge></li>
                </ul>
              </CardContent>
            </Card>

            {/* Limite Mensal */}
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ⚠️ Limite R$ 1.900/mês
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Por que:</strong> Evita caracterização de atividade habitual
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Sistema bloqueia novas comissões ao atingir</li>
                  <li>• Alerta <Badge variant="destructive" className="text-xs">≥80%</Badge> = próximo do limite</li>
                  <li>• Incentive upgrade para <strong>Parceiro PJ</strong></li>
                  <li>• PJ tem ganhos <strong>ilimitados</strong></li>
                </ul>
              </CardContent>
            </Card>

            {/* Reset Manual */}
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-red-600" />
                  🔴 Reset Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Quando usar:</strong> APENAS em emergências
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Cron falhou e não resetou no dia 1º</li>
                  <li>• Erro de sistema registrou valores incorretos</li>
                  <li>• <strong className="text-red-500">Não use</strong> para antecipar reset</li>
                  <li>• Registra: <Badge variant="outline" className="text-xs">manual</Badge></li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Rápido */}
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>FAQ Rápido:</strong> Afiliado atingiu 80%? → Sugira upgrade para PJ via <code className="bg-muted px-1 rounded text-xs">/seja-vendedor</code>. 
              Reset não executou? → Use "Reset Manual" e verifique logs do cron. 
              Afiliado quer mais comissões? → Só como Parceiro PJ (CNPJ + CNAE válido).
            </AlertDescription>
          </Alert>

          {/* Link para Guia Completo */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm">Guia completo com mais detalhes disponível na página de Vendedores</span>
            </div>
            <Button variant="link" size="sm" asChild>
              <a href="/dashboard/salespeople">Ver Guia Completo →</a>
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
                <p className="text-2xl font-bold">{totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Mês Atual</p>
                <p className="text-2xl font-bold">R$ {totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média por Afiliado</p>
                <p className="text-2xl font-bold">R$ {averageEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perto do Limite</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{nearLimitCount}</p>
                  {nearLimitCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
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
        <CardHeader>
          <CardTitle className="text-lg">Ganhos por Afiliado (Mês Atual)</CardTitle>
        </CardHeader>
        <CardContent>
          <AffiliateEarningsChart affiliates={affiliates} limit={MONTHLY_LIMIT} />
        </CardContent>
      </Card>

      {/* Cards individuais de afiliados */}
      {affiliates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Detalhamento por Afiliado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {affiliates.map(affiliate => (
              <AffiliateLimitCard key={affiliate.id} affiliate={affiliate} />
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Resets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Resets Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetHistoryTable history={resetHistory} />
        </CardContent>
      </Card>

      {/* Dialog de confirmação de reset */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reset Manual</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá zerar os ganhos de todos os {affiliates.filter(a => a.current_month_earnings > 0).length} afiliados 
              com ganhos no mês atual (total: R$ {affiliates.reduce((sum, a) => sum + a.current_month_earnings, 0).toFixed(2)}).
              <br /><br />
              Esta ação não pode ser desfeita. Use apenas em casos excepcionais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualReset} disabled={resetting}>
              {resetting ? 'Resetando...' : 'Confirmar Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
