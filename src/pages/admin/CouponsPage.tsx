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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  Ticket,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  X,
  TrendingDown,
  Users,
  Calendar,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number;
  status: 'active' | 'inactive' | 'expired';
  is_public: boolean;
  created_at: string;
}

const CouponsPage = () => {
  usePageSEO({
    title: 'Cupons de Desconto - Mostralo | Gerenciar Promoções',
    description: 'Gerencie cupons de desconto para os planos de assinatura. Crie promoções com senso de urgência.',
    keywords: 'cupons desconto, promoções, códigos promocionais, gestão cupons'
  });

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
    usage_limit: null as number | null,
    is_public: false,
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
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

  const handleNewCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
      usage_limit: null,
      is_public: false,
      status: 'active'
    });
    setDialogOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
      usage_limit: coupon.usage_limit,
      is_public: coupon.is_public,
      status: coupon.status
    });
    setDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    if (!formData.code || !formData.valid_until || formData.discount_value <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      if (editingCoupon) {
        // Update
        const { error } = await supabase
          .from('discount_coupons')
          .update({
            code: formData.code.toUpperCase(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            valid_from: new Date(formData.valid_from).toISOString(),
            valid_until: new Date(formData.valid_until).toISOString(),
            usage_limit: formData.usage_limit,
            is_public: formData.is_public,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCoupon.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Cupom atualizado com sucesso!',
        });
      } else {
        // Create
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('discount_coupons')
          .insert({
            code: formData.code.toUpperCase(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            valid_from: new Date(formData.valid_from).toISOString(),
            valid_until: new Date(formData.valid_until).toISOString(),
            usage_limit: formData.usage_limit,
            is_public: formData.is_public,
            status: formData.status,
            created_by: user?.id
          });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Cupom criado com sucesso!',
        });
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

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cupom excluído com sucesso!',
      });

      fetchCoupons();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cupom.',
        variant: 'destructive'
      });
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copiado!',
      description: `Código ${code} copiado para área de transferência.`,
    });
  };

  const getStatusInfo = (coupon: Coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.valid_until);
    const isExpired = endDate < now;
    const isLimitReached = coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit;

    if (isExpired || coupon.status === 'expired') {
      return { label: 'Expirado', variant: 'secondary' as const, color: 'text-gray-600' };
    }
    if (isLimitReached) {
      return { label: 'Esgotado', variant: 'secondary' as const, color: 'text-orange-600' };
    }
    if (coupon.status === 'inactive') {
      return { label: 'Inativo', variant: 'outline' as const, color: 'text-gray-600' };
    }
    return { label: 'Ativo', variant: 'default' as const, color: 'text-green-600' };
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)} OFF`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCoupons = coupons.filter(c => c.status === 'active').length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);
  const totalDiscount = coupons.reduce((sum, c) => {
    if (c.discount_type === 'percentage') {
      return sum + (c.discount_value * c.usage_count);
    }
    return sum + (c.discount_value * c.usage_count);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Cupons</h1>
          <p className="text-muted-foreground">
            Crie e gerencie cupons de desconto para aumentar as conversões
          </p>
        </div>
        <Button onClick={handleNewCoupon}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <Ticket className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <p className="text-xs text-muted-foreground">
              De {coupons.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Cupons utilizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconto Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDiscount.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Em todos os cupons
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupons</CardTitle>
          <CardDescription>
            Todos os cupons de desconto criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cupom criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro cupom para começar a oferecer descontos
              </p>
              <Button onClick={handleNewCoupon}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Cupom
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const statusInfo = getStatusInfo(coupon);
                    const usagePercent = coupon.usage_limit 
                      ? (coupon.usage_count / coupon.usage_limit) * 100 
                      : 0;

                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCouponCode(coupon.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            {coupon.is_public ? (
                              <Eye className="w-4 h-4 text-green-600" title="Público" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" title="Privado" />
                            )}
                          </div>
                          {coupon.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {coupon.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {formatDiscount(coupon)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {coupon.usage_count} / {coupon.usage_limit || '∞'}
                            </div>
                            {coupon.usage_limit && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCoupon(coupon)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar cupom */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon 
                ? 'Atualize as informações do cupom de desconto' 
                : 'Crie um novo cupom de desconto para seus clientes'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupom *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="DESCONTO90"
                  maxLength={50}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas letras e números, sem espaços
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                placeholder="Promoção de Black Friday 2025"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    discount_value: parseFloat(e.target.value) || 0 
                  })}
                  placeholder={formData.discount_type === 'percentage' ? '90' : '50.00'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Válido de</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Válido até *</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_limit">Limite de Uso</Label>
              <Input
                id="usage_limit"
                type="number"
                min="0"
                value={formData.usage_limit || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  usage_limit: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Deixe vazio para ilimitado"
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de vezes que o cupom pode ser usado
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_public">Cupom Público</Label>
                <p className="text-sm text-muted-foreground">
                  Aparece automaticamente na página de preços
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
              onClick={handleSaveCoupon}
              disabled={saving || !formData.code || !formData.valid_until || formData.discount_value <= 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;

