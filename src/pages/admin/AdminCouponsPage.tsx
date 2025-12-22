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
import { Switch } from '@/components/ui/switch';
import { usePageSEO } from '@/hooks/useSEO';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Users,
  Loader2,
  Calendar,
  Percent,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'all_plans' | 'specific_plans';
  plan_ids: string[];
  max_uses: number | null;
  max_uses_per_user: number;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive' | 'expired';
  is_public: boolean;
  promotion_label: string;
  show_countdown: boolean;
  created_at: string;
  updated_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

// Tipo interno para o formulário (inclui final_price)
type FormDiscountType = 'percentage' | 'fixed' | 'final_price';

const AdminCouponsPage = () => {
  usePageSEO({
    title: 'Cupons - Mostralo | Gerenciar Cupons de Desconto',
    description: 'Gerencie cupons promocionais com limites de uso e rastreamento completo.',
    keywords: 'cupons desconto, promoções, códigos promocionais, gestão cupons'
  });

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as FormDiscountType,
    discount_value: 0,
    final_price: 0, // Novo campo: preço final que o cliente paga
    applies_to: 'all_plans' as 'all_plans' | 'specific_plans',
    plan_ids: [] as string[],
    max_uses: null as number | null,
    max_uses_per_user: 1,
    start_date: null as string | null,
    end_date: null as string | null,
    status: 'active' as 'active' | 'inactive' | 'expired',
    is_public: false,
    promotion_label: 'OFERTA LIMITADA',
    show_countdown: true
  });

  useEffect(() => {
    fetchCoupons();
    fetchPlans();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;
      setCoupons((data || []) as any);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cupons.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price')
        .eq('status', 'active');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const handleNew = () => {
    setSelectedCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      final_price: 0,
      applies_to: 'all_plans',
      plan_ids: [],
      max_uses: null,
      max_uses_per_user: 1,
      start_date: null,
      end_date: null,
      status: 'active',
      is_public: false,
      promotion_label: 'OFERTA LIMITADA',
      show_countdown: true
    });
    setDialogOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      final_price: 0,
      applies_to: coupon.applies_to,
      plan_ids: coupon.plan_ids || [],
      max_uses: coupon.max_uses,
      max_uses_per_user: coupon.max_uses_per_user,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      status: coupon.status,
      is_public: coupon.is_public,
      promotion_label: coupon.promotion_label,
      show_countdown: coupon.show_countdown
    });
    setDialogOpen(true);
  };

  // Calcula o desconto baseado no preço final
  const getCalculatedDiscount = () => {
    if (formData.discount_type !== 'final_price') return null;
    if (formData.plan_ids.length !== 1) return null;
    
    const selectedPlan = plans.find(p => p.id === formData.plan_ids[0]);
    if (!selectedPlan) return null;
    
    const discount = selectedPlan.price - formData.final_price;
    const percentage = ((discount / selectedPlan.price) * 100).toFixed(1);
    
    return {
      originalPrice: selectedPlan.price,
      finalPrice: formData.final_price,
      discount,
      percentage,
      planName: selectedPlan.name,
      isValid: formData.final_price > 0 && formData.final_price < selectedPlan.price
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Se for preço final, converter para desconto fixo
      let dataToSave: any = {
        code: formData.code.toUpperCase().replace(/\s/g, ''),
        name: formData.name,
        description: formData.description,
        applies_to: formData.applies_to,
        plan_ids: formData.plan_ids,
        max_uses: formData.max_uses,
        max_uses_per_user: formData.max_uses_per_user,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        is_public: formData.is_public,
        promotion_label: formData.promotion_label,
        show_countdown: formData.show_countdown
      };

      if (formData.discount_type === 'final_price') {
        // Converter preço final para desconto fixo
        const selectedPlan = plans.find(p => p.id === formData.plan_ids[0]);
        if (!selectedPlan) {
          throw new Error('Selecione um plano específico para usar Preço Final');
        }
        const calculatedDiscount = selectedPlan.price - formData.final_price;
        dataToSave.discount_type = 'fixed';
        dataToSave.discount_value = calculatedDiscount;
      } else {
        dataToSave.discount_type = formData.discount_type;
        dataToSave.discount_value = formData.discount_value;
      }

      if (selectedCoupon) {
        const { error } = await (supabase as any)
          .from('coupons')
          .update(dataToSave)
          .eq('id', selectedCoupon.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cupom atualizado!' });
      } else {
        const { error } = await (supabase as any)
          .from('coupons')
          .insert([dataToSave]);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cupom criado!' });
      }

      setDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cupom.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      const { error } = await (supabase as any)
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Cupom excluído!' });
      fetchCoupons();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o cupom.', variant: 'destructive' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: `Código ${code} copiado para área de transferência.` });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default' as const, label: 'Ativo' },
      inactive: { variant: 'secondary' as const, label: 'Inativo' },
      expired: { variant: 'destructive' as const, label: 'Expirado' }
    };
    return variants[status] || variants.inactive;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCoupons = coupons.filter(c => c.status === 'active').length;
  const totalUses = coupons.reduce((sum, c) => sum + c.used_count, 0);
  const publicCoupons = coupons.filter(c => c.is_public).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
            <span className="hidden sm:inline">Gerenciar </span>Cupons
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Crie e gerencie cupons promocionais com limites e rastreamento</span>
            <span className="sm:hidden">Gerencie cupons promocionais</span>
          </p>
        </div>
        <Button onClick={handleNew} className="w-full sm:w-auto h-9 md:h-10">
          <Plus className="w-4 h-4 mr-1.5 md:mr-2" />
          <span className="sm:hidden">Novo</span>
          <span className="hidden sm:inline">Novo Cupom</span>
        </Button>
      </div>

      {/* Stats - Compactos */}
      <div className="grid gap-3 md:gap-4 grid-cols-3">
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ativos</CardTitle>
            <Ticket className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{activeCoupons}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Disponíveis</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Usos</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{totalUses}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Utilizados</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Públicos</CardTitle>
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{publicCoupons}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Na home</p>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <div className="grid gap-3 md:gap-4">
        {coupons.map((coupon) => {
          const statusInfo = getStatusBadge(coupon.status);
          const usagePercentage = coupon.max_uses 
            ? (coupon.used_count / coupon.max_uses) * 100 
            : 0;

          return (
            <Card key={coupon.id}>
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                {/* Linha 1: Título + Badges */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1">
                  <CardTitle className="text-base md:text-lg mr-auto">{coupon.name}</CardTitle>
                  <Badge variant={statusInfo.variant} className="text-[10px] md:text-xs">
                    {statusInfo.label}
                  </Badge>
                  {coupon.is_public && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 text-[10px] md:text-xs">
                      <Eye className="w-3 h-3 mr-0.5" />
                      <span className="hidden xs:inline">Público</span>
                    </Badge>
                  )}
                </div>
                
                {/* Linha 2: Descrição + Botões */}
                <div className="flex items-start justify-between gap-2">
                  <CardDescription className="text-xs md:text-sm line-clamp-2 flex-1">
                    {coupon.description || 'Sem descrição'}
                  </CardDescription>
                  <div className="flex gap-1.5 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(coupon)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(coupon.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                {/* Código - Compacto */}
                <div className="flex items-center justify-between p-2 md:p-3 bg-muted rounded-lg gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                    <code className="text-sm md:text-lg font-bold truncate">{coupon.code}</code>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyCode(coupon.code)}
                    className="h-7 md:h-8 px-2 shrink-0"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    <span className="text-xs">Copiar</span>
                  </Button>
                </div>

                {/* Info Grid - Texto Menor */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Desconto</p>
                    <p className="text-base md:text-lg font-bold text-primary">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Usos</p>
                    <p className="text-base md:text-lg font-bold">
                      {coupon.used_count}/{coupon.max_uses || '∞'}
                    </p>
                    {coupon.max_uses && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mt-0.5 md:mt-1">
                        <div 
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Início</p>
                    <p className="text-xs md:text-sm font-medium">
                      {coupon.start_date 
                        ? new Date(coupon.start_date).toLocaleDateString('pt-BR')
                        : 'Imediato'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] md:text-sm text-muted-foreground">Término</p>
                    <p className="text-xs md:text-sm font-medium">
                      {coupon.end_date 
                        ? new Date(coupon.end_date).toLocaleDateString('pt-BR')
                        : 'Sem limite'
                      }
                    </p>
                  </div>
                </div>

                {/* Aplica a */}
                {coupon.applies_to === 'specific_plans' && (
                  <div className="border-t pt-2 md:pt-3">
                    <p className="text-[10px] md:text-sm text-muted-foreground mb-1.5 md:mb-2">Aplica aos planos:</p>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {coupon.plan_ids.map(planId => {
                        const plan = plans.find(p => p.id === planId);
                        return plan ? (
                          <Badge key={planId} variant="outline" className="text-[10px] md:text-xs">{plan.name}</Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {coupons.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
            <Ticket className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">Nenhum cupom encontrado</h3>
            <p className="text-xs md:text-sm text-muted-foreground text-center max-w-md mb-3 md:mb-4">
              Crie seu primeiro cupom promocional para atrair mais clientes.
            </p>
            <Button onClick={handleNew} className="h-9 md:h-10">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Cupom
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog - Responsivo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pb-2 md:pb-4">
            <DialogTitle className="text-lg md:text-xl">{selectedCoupon ? 'Editar' : 'Novo'} Cupom</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Configure o cupom de desconto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4">
            {/* Código e Nome - Empilhar no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="code" className="text-xs md:text-sm">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DESCONTO90"
                  maxLength={50}
                  className="h-9 md:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="name" className="text-xs md:text-sm">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Desconto de 90%"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="description" className="text-xs md:text-sm">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Promoção especial de Black Friday"
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Tipo e Valor do Desconto - Empilhar no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="discount_type" className="text-xs md:text-sm">Tipo de Desconto</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: FormDiscountType) => {
                    // Se mudar para final_price, forçar plano específico
                    if (value === 'final_price') {
                      setFormData({ 
                        ...formData, 
                        discount_type: value,
                        applies_to: 'specific_plans'
                      });
                    } else {
                      setFormData({ ...formData, discount_type: value });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center">
                        <Percent className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                        Porcentagem (%)
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center">
                        <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                        Valor Fixo (R$)
                      </div>
                    </SelectItem>
                    <SelectItem value="final_price">
                      <div className="flex items-center">
                        <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-green-600" />
                        💰 Preço Final (R$)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de valor/preço final */}
              {formData.discount_type === 'final_price' ? (
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="final_price" className="text-xs md:text-sm">
                    Preço que o cliente paga *
                  </Label>
                  <Input
                    id="final_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.final_price || ''}
                    onChange={(e) => setFormData({ ...formData, final_price: parseFloat(e.target.value) || 0 })}
                    placeholder="297.90"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="discount_value" className="text-xs md:text-sm">
                    {formData.discount_type === 'percentage' ? 'Porcentagem *' : 'Valor do Desconto *'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value || ''}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.discount_type === 'percentage' ? '90' : '100.00'}
                    className="h-9 md:h-10 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Preview do desconto calculado (apenas para final_price) */}
            {formData.discount_type === 'final_price' && (() => {
              const calc = getCalculatedDiscount();
              if (!calc) {
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs md:text-sm text-amber-700 dark:text-amber-400">
                      ⚠️ Selecione <strong>1 plano específico</strong> abaixo para calcular o desconto automaticamente.
                    </p>
                  </div>
                );
              }
              
              if (!calc.isValid) {
                return (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-xs md:text-sm text-red-700 dark:text-red-400">
                      ❌ O preço final deve ser maior que R$ 0 e menor que {formatPrice(calc.originalPrice)}
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg space-y-1">
                  <p className="text-xs md:text-sm font-medium text-green-800 dark:text-green-300">
                    ✅ {calc.planName}
                  </p>
                  <p className="text-sm md:text-base text-green-700 dark:text-green-400">
                    <span className="line-through text-muted-foreground">{formatPrice(calc.originalPrice)}</span>
                    {' → '}
                    <strong className="text-green-600">{formatPrice(calc.finalPrice)}</strong>
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Desconto: {formatPrice(calc.discount)} ({calc.percentage}%)
                  </p>
                </div>
              );
            })()}

            {/* Aplica a */}
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="applies_to" className="text-xs md:text-sm">Aplicar a</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: 'all_plans' | 'specific_plans') => 
                  setFormData({ ...formData, applies_to: value })
                }
                disabled={formData.discount_type === 'final_price'}
              >
                <SelectTrigger className="h-9 md:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_plans" disabled={formData.discount_type === 'final_price'}>
                    Todos os Planos
                  </SelectItem>
                  <SelectItem value="specific_plans">Planos Específicos</SelectItem>
                </SelectContent>
              </Select>
              {formData.discount_type === 'final_price' && (
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  💡 Preço Final requer 1 plano específico
                </p>
              )}
            </div>

            {/* Planos Específicos */}
            {formData.applies_to === 'specific_plans' && (
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">
                  Selecione {formData.discount_type === 'final_price' ? 'o Plano' : 'os Planos'}
                </Label>
                <div className="space-y-2">
                  {plans.map(plan => (
                    <label key={plan.id} className="flex items-center space-x-2 text-xs md:text-sm">
                      <input
                        type={formData.discount_type === 'final_price' ? 'radio' : 'checkbox'}
                        name="plan_selection"
                        checked={formData.plan_ids.includes(plan.id)}
                        onChange={(e) => {
                          if (formData.discount_type === 'final_price') {
                            // Radio: só permite 1 seleção
                            setFormData({ ...formData, plan_ids: [plan.id] });
                          } else {
                            // Checkbox: múltipla seleção
                            if (e.target.checked) {
                              setFormData({ ...formData, plan_ids: [...formData.plan_ids, plan.id] });
                            } else {
                              setFormData({ ...formData, plan_ids: formData.plan_ids.filter(id => id !== plan.id) });
                            }
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span>{plan.name} - {formatPrice(plan.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Limites - Empilhar no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="max_uses" className="text-xs md:text-sm">Limite Total</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="0"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_uses: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Ilimitado"
                  className="h-9 md:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="max_uses_per_user" className="text-xs md:text-sm">Por Usuário</Label>
                <Input
                  id="max_uses_per_user"
                  type="number"
                  min="1"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_uses_per_user: parseInt(e.target.value) || 1 
                  })}
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>

            {/* Datas - Empilhar no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="start_date" className="text-xs md:text-sm">Data Início</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    start_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                  className="h-9 md:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="end_date" className="text-xs md:text-sm">Data Término</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    end_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>

            {/* Configurações de Exibição - Compactas */}
            <div className="space-y-3 border-t pt-3 md:pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label htmlFor="is_public" className="text-xs md:text-sm">Exibir Publicamente</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                    Mostrar na home com contador
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_public: checked })
                  }
                  className="shrink-0"
                />
              </div>

              {formData.is_public && (
                <>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="promotion_label" className="text-xs md:text-sm">Texto da Promoção</Label>
                    <Input
                      id="promotion_label"
                      value={formData.promotion_label}
                      onChange={(e) => setFormData({ ...formData, promotion_label: e.target.value })}
                      placeholder="OFERTA LIMITADA"
                      maxLength={100}
                      className="h-9 md:h-10 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Label htmlFor="show_countdown" className="text-xs md:text-sm">Contador Regressivo</Label>
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                        Até data de término
                      </p>
                    </div>
                    <Switch
                      id="show_countdown"
                      checked={formData.show_countdown}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, show_countdown: checked })
                      }
                      className="shrink-0"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="status" className="text-xs md:text-sm">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'expired') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="h-9 md:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer - Empilhado no mobile */}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="w-full sm:w-auto h-9 md:h-10 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving || 
                !formData.code || 
                !formData.name || 
                (formData.discount_type === 'final_price' 
                  ? !getCalculatedDiscount()?.isValid 
                  : formData.discount_value <= 0)
              }
              className="w-full sm:w-auto h-9 md:h-10 order-1 sm:order-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Cupom'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouponsPage;
