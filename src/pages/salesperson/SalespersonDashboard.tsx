import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
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

  if (loading) {
    return (
      <SalespersonLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </SalespersonLayout>
    );
  }

  return (
    <SalespersonLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {salesperson?.full_name}!
          </p>
        </div>

        {salesperson?.status === 'pending_approval' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu cadastro está em análise. Aguarde a aprovação do administrador.
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
                    Meta Trimestral
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.quarterProgress}%</div>
                  <p className="text-xs text-muted-foreground">
                    Próximo: {stats.nextTier}
                  </p>
                </CardContent>
              </Card>
            </div>

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
    </SalespersonLayout>
  );
}
