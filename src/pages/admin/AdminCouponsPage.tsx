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
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
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

  const handleSave = async () => {
    try {
      setSaving(true);

      const data = {
        ...formData,
        code: formData.code.toUpperCase().replace(/\s/g, '')
      };

      if (selectedCoupon) {
        const { error } = await (supabase as any)
          .from('coupons')
          .update(data)
          .eq('id', selectedCoupon.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cupom atualizado!' });
      } else {
        const { error } = await (supabase as any)
          .from('coupons')
          .insert([data]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Cupons</h1>
          <p className="text-muted-foreground">
            Crie e gerencie cupons promocionais com limites e rastreamento
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <Ticket className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <p className="text-xs text-muted-foreground">Disponíveis para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUses}</div>
            <p className="text-xs text-muted-foreground">Vezes utilizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Públicos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicCoupons}</div>
            <p className="text-xs text-muted-foreground">Visíveis na home</p>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <div className="grid gap-4">
        {coupons.map((coupon) => {
          const statusInfo = getStatusBadge(coupon.status);
          const usagePercentage = coupon.max_uses 
            ? (coupon.used_count / coupon.max_uses) * 100 
            : 0;

          return (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{coupon.name}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      {coupon.is_public && (
                        <Badge variant="outline" className="bg-purple-50">
                          <Eye className="w-3 h-3 mr-1" />
                          Público
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{coupon.description || 'Sem descrição'}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Código */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                    <code className="text-lg font-bold">{coupon.code}</code>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyCode(coupon.code)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Desconto</p>
                    <p className="text-lg font-bold text-primary">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Usos</p>
                    <p className="text-lg font-bold">
                      {coupon.used_count} / {coupon.max_uses || '∞'}
                    </p>
                    {coupon.max_uses && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">
                      {coupon.start_date 
                        ? new Date(coupon.start_date).toLocaleDateString('pt-BR')
                        : 'Imediato'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Término</p>
                    <p className="text-sm font-medium">
                      {coupon.end_date 
                        ? new Date(coupon.end_date).toLocaleDateString('pt-BR')
                        : 'Sem limite'
                      }
                    </p>
                  </div>
                </div>

                {/* Aplica a */}
                {coupon.applies_to === 'specific_plans' && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground mb-2">Aplica aos planos:</p>
                    <div className="flex flex-wrap gap-2">
                      {coupon.plan_ids.map(planId => {
                        const plan = plans.find(p => p.id === planId);
                        return plan ? (
                          <Badge key={planId} variant="outline">{plan.name}</Badge>
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cupom encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Crie seu primeiro cupom promocional para atrair mais clientes.
            </p>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Cupom
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? 'Editar' : 'Novo'} Cupom</DialogTitle>
            <DialogDescription>
              Configure o cupom de desconto com limites e validade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Código e Nome */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupom *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DESCONTO90"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cupom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Desconto de 90%"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Promoção especial de Black Friday"
                rows={2}
              />
            </div>

            {/* Tipo e Valor do Desconto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipo de Desconto</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center">
                        <Percent className="w-4 h-4 mr-2" />
                        Porcentagem (%)
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Valor Fixo (R$)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor do Desconto *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discount_type === 'percentage' ? '90' : '100.00'}
                />
              </div>
            </div>

            {/* Aplica a */}
            <div className="space-y-2">
              <Label htmlFor="applies_to">Aplicar a</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: 'all_plans' | 'specific_plans') => 
                  setFormData({ ...formData, applies_to: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_plans">Todos os Planos</SelectItem>
                  <SelectItem value="specific_plans">Planos Específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Planos Específicos */}
            {formData.applies_to === 'specific_plans' && (
              <div className="space-y-2">
                <Label>Selecione os Planos</Label>
                <div className="space-y-2">
                  {plans.map(plan => (
                    <label key={plan.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.plan_ids.includes(plan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, plan_ids: [...formData.plan_ids, plan.id] });
                          } else {
                            setFormData({ ...formData, plan_ids: formData.plan_ids.filter(id => id !== plan.id) });
                          }
                        }}
                      />
                      <span>{plan.name} - {formatPrice(plan.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Limites */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite Total de Usos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="0"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_uses: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses_per_user">Usos por Usuário</Label>
                <Input
                  id="max_uses_per_user"
                  type="number"
                  min="1"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_uses_per_user: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    start_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    end_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                />
              </div>
            </div>

            {/* Configurações de Exibição */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_public">Exibir na Página Pública</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar automaticamente na home com contador
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_public: checked })
                  }
                />
              </div>

              {formData.is_public && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="promotion_label">Texto da Promoção</Label>
                    <Input
                      id="promotion_label"
                      value={formData.promotion_label}
                      onChange={(e) => setFormData({ ...formData, promotion_label: e.target.value })}
                      placeholder="OFERTA LIMITADA"
                      maxLength={100}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_countdown">Mostrar Contador Regressivo</Label>
                      <p className="text-sm text-muted-foreground">Contador até a data de término</p>
                    </div>
                    <Switch
                      id="show_countdown"
                      checked={formData.show_countdown}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, show_countdown: checked })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'expired') => 
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.code || !formData.name || formData.discount_value <= 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

