import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, TrendingUp, Users, AlertCircle, Sparkles, Building2, User, UserCheck } from "lucide-react";
import { toast } from "sonner";
import PortfolioHealthCard from "@/components/salesperson/PortfolioHealthCard";
import { SalespersonPerformanceChartSelf } from "@/components/salesperson/SalespersonPerformanceChartSelf";
import { SystemBanner } from "@/components/admin/SystemBanner";
import { format, startOfQuarter } from "date-fns";

interface BonusTier {
  id: string;
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
}

export default function SalespersonDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesperson, setSalesperson] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommissions: 0,
    leadsCount: 0,
    quarterSales: 0,
  });
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadSalespersonData();
    }
  }, [user]);

  const loadSalespersonData = async () => {
    try {
      // Buscar dados do vendedor
      const { data: salespersonData, error: salespersonError } = await supabase
        .from('salespeople')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (salespersonError) throw salespersonError;

      setSalesperson(salespersonData);

      // Se contrato pendente, redirecionar
      if (salespersonData.status === 'pending_contract') {
        navigate('/vendedor/contrato');
        return;
      }

      // Buscar estatísticas REAIS em paralelo
      const quarterStart = format(startOfQuarter(new Date()), 'yyyy-MM-dd');
      
      const [leadsRes, clientsRes, commissionsRes, quarterClientsRes, tiersRes, recentRes] = await Promise.all([
        // Total de leads
        supabase.from("leads").select("id", { count: "exact" }).eq("salesperson_id", salespersonData.id),
        // Clientes aprovados (indicados)
        supabase.from("payment_approvals").select("id", { count: "exact" }).eq("referred_by_salesperson_id", salespersonData.id).eq("status", "approved"),
        // Total de comissões
        supabase.from("salesperson_commissions").select("commission_amount").eq("salesperson_id", salespersonData.id),
        // Vendas no trimestre atual
        supabase.from("payment_approvals").select("id", { count: "exact" }).eq("referred_by_salesperson_id", salespersonData.id).eq("status", "approved").gte("approved_at", quarterStart),
        // Bonus tiers
        supabase.from("salesperson_bonus_tiers").select("*").order("min_sales"),
        // Últimos clientes
        supabase.from("payment_approvals").select("id, company_name, created_at, status, plan:plans(name)").eq("referred_by_salesperson_id", salespersonData.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const totalCommissions = commissionsRes.data?.reduce(
        (sum, c) => sum + Number(c.commission_amount), 0
      ) || 0;

      setStats({
        totalSales: clientsRes.count || 0,
        totalCommissions: totalCommissions,
        leadsCount: leadsRes.count || 0,
        quarterSales: quarterClientsRes.count || 0,
      });

      setBonusTiers(tiersRes.data || []);
      setRecentClients(recentRes.data || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do vendedor');
    } finally {
      setLoading(false);
    }
  };

  const monthlyLimitUsed = salesperson?.current_month_earnings || 0;
  const monthlyLimit = salesperson?.monthly_earnings_limit || 1900;
  const monthlyPercentage = Math.min((monthlyLimitUsed / monthlyLimit) * 100, 100);

  const getProgressForTier = (minSales: number) => {
    return Math.min((stats.quarterSales / minSales) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Bem-vindo(a), {salesperson?.full_name}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            {salesperson?.salesperson_type === 'affiliate' ? (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                Afiliado (CPF)
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-primary to-orange-500 gap-1">
                <Building2 className="h-3 w-3" />
                Parceiro PJ
              </Badge>
            )}
          </div>
        </div>

        {/* Banner do Sistema para Vendedores */}
        <SystemBanner position="salesperson_dashboard" />

        {salesperson?.status === 'pending_approval' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu cadastro está em análise. Aguarde a aprovação do administrador.
            </AlertDescription>
          </Alert>
        )}

        {/* Banner de upgrade para afiliados */}
        {salesperson?.salesperson_type === 'affiliate' && salesperson?.status === 'active' && (
          <Alert className="bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm md:text-base">Quer ganhar mais?</AlertTitle>
            <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="text-xs md:text-sm">
                Como afiliado, você tem limite de R$ 1.900/mês. Abrindo um MEI (gratuito), 
                você vira Parceiro PJ com comissão de 10% e ganhos ilimitados!
              </span>
              <Button variant="outline" size="sm" className="shrink-0 w-full md:w-auto" asChild>
                <Link to="/vendedor/upgrade">
                  Fazer Upgrade
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {salesperson?.status === 'active' && (
          <>
            {/* Card de saúde da carteira - apenas para Parceiros PJ */}
            {salesperson?.salesperson_type === 'partner' && (
              <PortfolioHealthCard salesperson={salesperson} />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
                  <CardTitle className="text-xs md:text-sm font-medium">
                    Leads
                  </CardTitle>
                  <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <div className="text-lg md:text-2xl font-bold">{stats.leadsCount}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Prospectos gerados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
                  <CardTitle className="text-xs md:text-sm font-medium">
                    Clientes
                  </CardTitle>
                  <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <div className="text-lg md:text-2xl font-bold text-green-600">{stats.totalSales}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Convertidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
                  <CardTitle className="text-xs md:text-sm font-medium">
                    Comissões
                  </CardTitle>
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <div className="text-lg md:text-2xl font-bold">
                    R$ {stats.totalCommissions.toFixed(2)}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Total acumulado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
                  <CardTitle className="text-xs md:text-sm font-medium">
                    {salesperson?.salesperson_type === 'affiliate' ? 'Limite Mensal' : 'Vendas Trimestre'}
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  {salesperson?.salesperson_type === 'affiliate' ? (
                    <>
                      <div className="text-lg md:text-2xl font-bold">
                        R$ {monthlyLimitUsed.toFixed(2)}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        de R$ {monthlyLimit.toFixed(2)}
                      </p>
                      <Progress value={monthlyPercentage} className="h-2 mt-2" />
                    </>
                  ) : (
                    <>
                      <div className="text-lg md:text-2xl font-bold">{stats.quarterSales}</div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        Vendas este trimestre
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Performance */}
            <SalespersonPerformanceChartSelf />

            {/* Progresso de bônus - apenas para Parceiros PJ */}
            {salesperson?.salesperson_type === 'partner' && bonusTiers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Progresso do Bônus Trimestral</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {stats.quarterSales} vendas no trimestre atual
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bonusTiers.map((tier) => (
                    <div key={tier.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={stats.quarterSales >= tier.min_sales ? "text-green-600 font-medium" : ""}>
                          {tier.tier_name} ({tier.min_sales} vendas)
                          {stats.quarterSales >= tier.min_sales && " ✓"}
                        </span>
                        <span className="text-muted-foreground">
                          R$ {Number(tier.bonus_amount).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <Progress 
                        value={getProgressForTier(tier.min_sales)} 
                        className={`h-2 ${stats.quarterSales >= tier.min_sales ? '[&>div]:bg-green-500' : ''}`} 
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Info sobre limite para afiliados */}
            {salesperson?.salesperson_type === 'affiliate' && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-amber-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Limite Mensal de Ganhos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ganhos este mês</span>
                      <span className="font-medium">R$ {monthlyLimitUsed.toFixed(2)} / R$ {monthlyLimit.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={monthlyPercentage} 
                      className={`h-3 ${monthlyPercentage >= 80 ? '[&>div]:bg-amber-500' : ''}`} 
                    />
                    {monthlyPercentage >= 80 && (
                      <p className="text-xs text-amber-600">
                        ⚠️ Você está próximo do limite mensal. Considere fazer upgrade para Parceiro PJ!
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Como afiliado (CPF), seus ganhos são limitados a R$ 1.900/mês. 
                    Para ganhar mais, faça upgrade para Parceiro PJ.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/vendedor/upgrade">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Fazer Upgrade para Parceiro PJ
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Últimas Vendas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Últimas Vendas</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/vendedor/clientes">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentClients.length > 0 ? (
                  <div className="space-y-3">
                    {recentClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{client.company_name || "Cliente"}</p>
                          <p className="text-sm text-muted-foreground">{client.plan?.name}</p>
                        </div>
                        <Badge variant={client.status === "approved" ? "default" : "secondary"}>
                          {client.status === "approved" ? "Aprovado" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma venda registrada ainda. Compartilhe seu link de indicação!
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
    </div>
  );
}
