import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  DollarSign,
  Users,
  Package,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  max_products: number | null;
  max_categories: number | null;
  status: 'active' | 'inactive';
  features: any;
  created_at: string;
  updated_at: string;
}

const PlansPage = () => {
  usePageSEO({
    title: 'Planos - Mostralo | Gerenciar Planos de Assinatura',
    description: 'Configure e gerencie planos de assinatura da plataforma Mostralo. Defina preços, recursos e limites para cada plano.',
    keywords: 'planos assinatura, configurar preços, recursos planos, gestão assinatura'
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    max_products: null as number | null,
    max_categories: null as number | null,
    status: 'active' as 'active' | 'inactive',
    is_popular: false,
    features: {} as Record<string, boolean>,
    // Campos de promoção
    promotion_active: false,
    discount_price: null as number | null,
    discount_percentage: null as number | null,
    promotion_start_date: null as string | null,
    promotion_end_date: null as string | null,
    promotion_label: 'OFERTA LIMITADA'
  });
  
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    const planAny = plan as any;
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      max_products: plan.max_products,
      max_categories: plan.max_categories,
      status: plan.status,
      is_popular: planAny.is_popular || false,
      features: plan.features || {},
      // Campos de promoção
      promotion_active: planAny.promotion_active || false,
      discount_price: planAny.discount_price || null,
      discount_percentage: planAny.discount_percentage || null,
      promotion_start_date: planAny.promotion_start_date || null,
      promotion_end_date: planAny.promotion_end_date || null,
      promotion_label: planAny.promotion_label || 'OFERTA LIMITADA'
    });
    setEditDialogOpen(true);
  };
  
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: { ...formData.features, [newFeature.trim()]: true }
      });
      setNewFeature('');
    }
  };
  
  const handleRemoveFeature = (featureKey: string) => {
    const newFeatures = { ...formData.features };
    delete newFeatures[featureKey];
    setFormData({ ...formData, features: newFeatures });
  };

  const handleSavePlan = async () => {
    if (!selectedPlan) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('plans')
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          billing_cycle: formData.billing_cycle as 'monthly' | 'quarterly' | 'biannual' | 'annual',
          max_products: formData.max_products,
          max_categories: formData.max_categories,
          status: formData.status,
          is_popular: formData.is_popular,
          features: formData.features,
          // Campos de promoção
          promotion_active: formData.promotion_active,
          discount_price: formData.discount_price,
          discount_percentage: formData.discount_percentage,
          promotion_start_date: formData.promotion_start_date,
          promotion_end_date: formData.promotion_end_date,
          promotion_label: formData.promotion_label,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Plano atualizado com sucesso!',
      });

      setEditDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o plano.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'biannual': 'Semestral',
      'annual': 'Anual',
      'yearly': 'Anual', // backward compatibility
    };
    return labels[cycle] || cycle;
  };

  const getBillingCycleDays = (cycle: string) => {
    const days: Record<string, number> = {
      'monthly': 30,
      'quarterly': 90,
      'biannual': 180,
      'annual': 365,
      'yearly': 365, // backward compatibility
    };
    return days[cycle] || 30;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativo',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'inactive':
        return {
          label: 'Inativo',
          variant: 'secondary' as const,
          color: 'text-red-600'
        };
      default:
        return {
          label: 'Desconhecido',
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePlans = plans.filter(p => p.status === 'active').length;
  const totalRevenue = plans.reduce((sum, plan) => sum + plan.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Planos</h1>
          <p className="text-muted-foreground">
            Configure os planos de assinatura da plataforma
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              Planos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para assinatura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os planos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const statusInfo = getStatusInfo(plan.status);
          const isPopular = (plan as any).is_popular || false;
          
          return (
            <Card key={plan.id} className="relative overflow-hidden">
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary text-white shadow-lg px-4 py-1 text-xs font-semibold">
                    ⭐ Mais Popular
                  </Badge>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              </div>

              <CardHeader className="pb-4 pt-8">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.description || 'Sem descrição'}
                </CardDescription>
                <div className="pt-2">
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(plan.price)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getBillingCycleLabel(plan.billing_cycle)} - {getBillingCycleDays(plan.billing_cycle)} dias
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Limites</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>Produtos</span>
                      </div>
                      <span className="font-medium">
                        {plan.max_products || 'Ilimitado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Categorias</span>
                      </div>
                      <span className="font-medium">
                        {plan.max_categories || 'Ilimitado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {plan.features && Object.keys(plan.features).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Recursos</h4>
                    <div className="space-y-1">
                      {Object.entries(plan.features).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2 text-sm">
                          {value ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                          <span className={value ? '' : 'text-muted-foreground line-through'}>
                            {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Meta */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Comece criando seu primeiro plano de assinatura para permitir que os usuários se cadastrem na plataforma.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize as informações do plano de assinatura
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="recursos">Recursos</TabsTrigger>
              <TabsTrigger value="promocao">Promoção</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>

            {/* ABA BÁSICO */}
            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Básico"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plano ideal para pequenos negócios"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="197"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
                  <Select
                    value={formData.billing_cycle}
                    onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="biannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_products">Máx. Produtos</Label>
                  <Input
                    id="max_products"
                    type="number"
                    min="0"
                    value={formData.max_products || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      max_products: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_categories">Máx. Categorias</Label>
                  <Input
                    id="max_categories"
                    type="number"
                    min="0"
                    value={formData.max_categories || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      max_categories: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="10"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA RECURSOS */}
            <TabsContent value="recursos" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Recursos do Plano</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione os recursos incluídos neste plano (mínimo 3)
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Ex: Produtos ilimitados"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {Object.entries(formData.features).map(([key]) => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{key}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {Object.keys(formData.features).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum recurso adicionado ainda
                  </p>
                )}
              </div>
            </TabsContent>

            {/* ABA PROMOÇÃO */}
            <TabsContent value="promocao" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2 border rounded-lg p-4 bg-orange-50">
                  <div className="space-y-0.5">
                    <Label htmlFor="promotion_active" className="text-base font-semibold">Ativar Promoção</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita desconto e contador regressivo na página pública
                    </p>
                  </div>
                  <Switch
                    id="promotion_active"
                    checked={formData.promotion_active}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, promotion_active: checked })
                    }
                  />
                </div>

                {formData.promotion_active && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount_price">Preço com Desconto (R$)</Label>
                        <Input
                          id="discount_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discount_price || ''}
                          onChange={(e) => {
                            const discountPrice = parseFloat(e.target.value) || null;
                            let discountPercentage = null;
                            if (discountPrice && formData.price > 0) {
                              discountPercentage = Math.round(((formData.price - discountPrice) / formData.price) * 100);
                            }
                            setFormData({ 
                              ...formData, 
                              discount_price: discountPrice,
                              discount_percentage: discountPercentage
                            });
                          }}
                          placeholder="59.90"
                        />
                        <p className="text-xs text-muted-foreground">
                          Preço original: {formatPrice(formData.price)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount_percentage">Desconto (%)</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discount_percentage || ''}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Calculado automaticamente
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="promotion_start_date">Data de Início</Label>
                        <Input
                          id="promotion_start_date"
                          type="datetime-local"
                          value={formData.promotion_start_date ? new Date(formData.promotion_start_date).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            promotion_start_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="promotion_end_date">Data de Término *</Label>
                        <Input
                          id="promotion_end_date"
                          type="datetime-local"
                          value={formData.promotion_end_date ? new Date(formData.promotion_end_date).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            promotion_end_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                          })}
                          required={formData.promotion_active}
                        />
                        <p className="text-xs text-muted-foreground">
                          Contador regressivo usa esta data
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="promotion_label">Texto da Promoção</Label>
                      <Input
                        id="promotion_label"
                        value={formData.promotion_label}
                        onChange={(e) => setFormData({ ...formData, promotion_label: e.target.value })}
                        placeholder="OFERTA LIMITADA"
                        maxLength={50}
                      />
                      <p className="text-xs text-muted-foreground">
                        Aparece no banner da promoção (máx. 50 caracteres)
                      </p>
                    </div>

                    {formData.discount_price && formData.discount_percentage && (
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-semibold text-sm mb-2">Preview da Promoção</h4>
                        <div className="space-y-2">
                          <p className="text-lg font-bold text-green-600">
                            {formData.discount_percentage}% OFF
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm line-through text-muted-foreground">
                              {formatPrice(formData.price)}
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {formatPrice(formData.discount_price)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Economia de {formatPrice(formData.price - formData.discount_price)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!formData.promotion_active && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Ative a promoção para configurar os descontos</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ABA CONFIGURAÇÕES */}
            <TabsContent value="configuracoes" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="config_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_popular">Marcar como "Mais Popular"</Label>
                  <p className="text-sm text-muted-foreground">
                    Apenas um plano pode ter esta marcação
                  </p>
                </div>
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_popular: checked })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={saving || !formData.name || formData.price < 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Plano'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansPage;