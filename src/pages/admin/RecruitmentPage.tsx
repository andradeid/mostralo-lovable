import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RecruitmentPromptSelector } from '@/components/admin/sales/RecruitmentPromptSelector';
import { RecruitmentPromptPreview } from '@/components/admin/sales/RecruitmentPromptPreview';
import { RecruitmentEarningsSimulator } from '@/components/admin/sales/RecruitmentEarningsSimulator';
import { RecruitmentPostsGenerator } from '@/components/admin/sales/RecruitmentPostsGenerator';
import { RecruitmentFunnel } from '@/components/admin/recruitment/RecruitmentFunnel';
import { generateRecruitmentPrompt, RecruitmentPromptType, BonusTier } from '@/utils/recruitmentPromptGenerator';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Database as DatabaseIcon, CheckCircle, Users, Megaphone, Calculator, ExternalLink, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

type Plan = Database['public']['Tables']['plans']['Row'];

export default function RecruitmentPage() {
  const [selectedRecruitmentType, setSelectedRecruitmentType] = useState<RecruitmentPromptType>('aggressive');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruitmentPrompt, setRecruitmentPrompt] = useState('');
  const [salespeopleStats, setSalespeopleStats] = useState({ active: 0, pending: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      setRecruitmentPrompt(generateRecruitmentPrompt({
        type: selectedRecruitmentType,
        plans,
        bonusTiers,
        baseUrl: window.location.origin
      }));
    }
  }, [selectedRecruitmentType, plans, bonusTiers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, tiersRes, salespeopleRes] = await Promise.all([
        supabase.from('plans').select('*').eq('status', 'active').order('price', { ascending: true }),
        supabase.from('salesperson_bonus_tiers').select('*').eq('is_active', true).order('min_sales', { ascending: true }),
        supabase.from('salespeople').select('status')
      ]);

      if (plansRes.error) throw plansRes.error;
      setPlans(plansRes.data || []);
      setBonusTiers(tiersRes.data || []);
      
      // Calcular estatísticas de vendedores
      const salespeople = salespeopleRes.data || [];
      setSalespeopleStats({
        active: salespeople.filter(s => s.status === 'active').length,
        pending: salespeople.filter(s => s.status === 'pending_approval' || s.status === 'pending_contract').length,
        total: salespeople.length
      });
      
      toast.success('Dados atualizados!');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-primary" />
            Recrutamento de Vendedores
          </h1>
          <p className="text-muted-foreground">
            Ferramentas completas para recrutar novos vendedores: prompts de IA, simulador de ganhos e textos de divulgação.
          </p>
        </div>
        
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar Dados
        </Button>
      </div>

      {/* Funil de Recrutamento */}
      <RecruitmentFunnel onRefresh={fetchData} />

      {/* Planos Carregados */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Planos Carregados do Sistema
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const hasPromotion = plan.promotion_active && plan.discount_price;
              const displayPrice = hasPromotion ? plan.discount_price : plan.price;
              
              return (
                <div key={plan.id} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {plan.is_popular && <Badge>Popular</Badge>}
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {hasPromotion ? (
                      <>
                        <p className="text-sm line-through text-muted-foreground">
                          {formatCurrency(plan.price)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(displayPrice!)}
                          </p>
                          {plan.discount_percentage && (
                            <Badge variant="destructive">
                              -{plan.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xl font-bold">{formatCurrency(plan.price)}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {(Array.isArray(plan.features) ? plan.features as string[] : [])
                      .slice(0, 4)
                      .map((feature, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </p>
                      ))}
                    {(Array.isArray(plan.features) ? plan.features as string[] : []).length > 4 && (
                      <p className="text-xs text-primary">
                        +{(plan.features as string[]).length - 4} recursos
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>

      {/* Tabs Principais */}
      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            🤖 Prompts de IA
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            💰 Simulador de Ganhos
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            📣 Divulgação de Vagas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-6">
          <RecruitmentPromptSelector selectedType={selectedRecruitmentType} onSelectType={setSelectedRecruitmentType} />
          <RecruitmentPromptPreview prompt={recruitmentPrompt} type={selectedRecruitmentType} />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <RecruitmentEarningsSimulator plans={plans} bonusTiers={bonusTiers} />
        </TabsContent>

        <TabsContent value="posts">
          <RecruitmentPostsGenerator bonusTiers={bonusTiers} />
        </TabsContent>
      </Tabs>

      {/* Links Úteis */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">🔗 Links Úteis</CardTitle>
          <CardDescription>Páginas relacionadas ao recrutamento de vendedores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/seja-vendedor" target="_blank" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <ExternalLink className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-sm">Landing Page</p>
                <p className="text-xs text-muted-foreground">/seja-vendedor</p>
              </div>
            </Link>
            
            <Link to="/dashboard/salespeople" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-sm">Gerenciar Vendedores</p>
                <p className="text-xs text-muted-foreground">/dashboard/salespeople</p>
              </div>
            </Link>
            
            <Link to="/dashboard/salespeople/commissions" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Calculator className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-sm">Configurar Bônus</p>
                <p className="text-xs text-muted-foreground">/dashboard/salespeople/commissions</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">📋 Como usar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Use os <strong>Prompts de IA</strong> para conversar com candidatos via ChatGPT ou Claude</li>
          <li>Mostre o <strong>Simulador de Ganhos</strong> para candidatos verem potencial de renda</li>
          <li>Publique os textos de <strong>Divulgação de Vagas</strong> nas redes sociais</li>
          <li>Acompanhe os candidatos em <strong>Gerenciar Vendedores</strong></li>
        </ol>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> Os prompts incluem dados reais dos planos, bônus configurados, 
            calculadora de ganhos e links dinâmicos para cadastro. Tudo atualizado automaticamente!
          </p>
        </div>
      </div>
    </div>
  );
}
