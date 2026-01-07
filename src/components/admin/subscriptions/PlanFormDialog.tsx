import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useClientSubscriptionPlans, ClientSubscriptionPlan, CreatePlanData } from '@/hooks/useClientSubscriptionPlans';
import { supabase } from '@/integrations/supabase/client';

interface BookingService {
  id: string;
  name: string;
  price: number;
}

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: ClientSubscriptionPlan | null;
  storeId: string | null;
  onSuccess: () => void;
}

const billingCycleOptions = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'biannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export function PlanFormDialog({ open, onOpenChange, plan, storeId, onSuccess }: PlanFormDialogProps) {
  const { createPlan, updatePlan } = useClientSubscriptionPlans(storeId);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    plan_type: 'unlimited',
    usage_limit: null as number | null,
    is_active: true,
    selectedServices: [] as string[]
  });

  // Fetch booking services
  useEffect(() => {
    const fetchServices = async () => {
      if (!storeId || !open) return;
      
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('booking_services')
          .select('id, name, price')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [storeId, open]);

  // Populate form when editing
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        plan_type: plan.plan_type,
        usage_limit: plan.usage_limit,
        is_active: plan.is_active,
        selectedServices: plan.includedServices?.map(s => s.serviceId) || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        billing_cycle: 'monthly',
        plan_type: 'unlimited',
        usage_limit: null,
        is_active: true,
        selectedServices: []
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    setLoading(true);
    try {
      const data: CreatePlanData = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        billing_cycle: formData.billing_cycle,
        plan_type: formData.plan_type,
        usage_limit: formData.plan_type === 'limited' ? formData.usage_limit : null,
        is_active: formData.is_active,
        includedServices: formData.selectedServices.map(serviceId => ({ serviceId }))
      };

      if (plan) {
        await updatePlan(plan.id, data);
      } else {
        await createPlan(data);
      }

      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Editar Plano' : 'Novo Plano de Assinatura'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Plano *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Corte Ilimitado"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os benefícios do plano..."
              rows={3}
            />
          </div>

          {/* Preço e Ciclo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Valor (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ciclo de Cobrança</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingCycleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo e Limite */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Uso</Label>
              <Select
                value={formData.plan_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, plan_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Ilimitado</SelectItem>
                  <SelectItem value="limited">Com Limite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.plan_type === 'limited' && (
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Limite de Usos</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    usage_limit: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="Ex: 4"
                />
              </div>
            )}
          </div>

          {/* Serviços Inclusos */}
          <div className="space-y-2">
            <Label>Serviços Inclusos</Label>
            {loadingServices ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando serviços...
              </div>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço cadastrado. Cadastre serviços na aba Agendamento.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {services.map(service => (
                  <div key={service.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={formData.selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <label 
                      htmlFor={`service-${service.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {service.name}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Plano Ativo</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {plan ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
