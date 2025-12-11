import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, TrendingUp, Users, AlertCircle, Sparkles, Building2, User } from "lucide-react";
import { toast } from "sonner";

export default function SalespersonDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesperson, setSalesperson] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommissions: 0,
    quarterProgress: 0,
    nextTier: "Bronze"
  });

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

      // Buscar estatísticas (placeholder - implementar quando houver vendas)
      setStats({
        totalSales: 0,
        totalCommissions: 0,
        quarterProgress: 0,
        nextTier: "Bronze"
      });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
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
            <AlertTitle>Quer ganhar mais?</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Como afiliado, você tem limite de R$ 1.900/mês. Abrindo um MEI (gratuito), 
                você vira Parceiro PJ com comissão de 10% e ganhos ilimitados!
              </span>
              <Button variant="outline" size="sm" className="ml-4 shrink-0" asChild>
                <Link to="/vendedor/upgrade">
                  Fazer Upgrade
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {salesperson?.status === 'active' && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Vendas
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">
                    Clientes indicados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Comissões Acumuladas
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {stats.totalCommissions.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total em comissões
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {salesperson?.salesperson_type === 'affiliate' ? 'Limite Mensal' : 'Meta Trimestral'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {salesperson?.salesperson_type === 'affiliate' ? (
                    <>
                      <div className="text-2xl font-bold">
                        R$ {monthlyLimitUsed.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        de R$ {monthlyLimit.toFixed(2)}
                      </p>
                      <Progress value={monthlyPercentage} className="h-2 mt-2" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats.quarterProgress}%</div>
                      <p className="text-xs text-muted-foreground">
                        Próximo: {stats.nextTier}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Progresso de bônus - apenas para Parceiros PJ */}
            {salesperson?.salesperson_type === 'partner' && (
              <Card>
                <CardHeader>
                  <CardTitle>Progresso do Bônus Trimestral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bronze (10 vendas)</span>
                      <span className="text-muted-foreground">R$ 500</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prata (20 vendas)</span>
                      <span className="text-muted-foreground">R$ 1.000</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ouro (30 vendas)</span>
                      <span className="text-muted-foreground">R$ 2.000</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Diamante (50 vendas)</span>
                      <span className="text-muted-foreground">R$ 5.000</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Últimas Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma venda registrada ainda
                </p>
              </CardContent>
            </Card>
          </>
        )}
    </div>
  );
}
