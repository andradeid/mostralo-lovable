import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Calendar as CalendarIcon, CreditCard, Percent, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface SubscriberEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriber: {
    id: string;
    store_id: string;
    store_name: string;
    full_name: string;
    plan_id?: string | null;
    plan_price?: number | null;
    subscription_expires_at?: string | null;
    store_status: string;
    custom_monthly_price?: number | null;
    discount_reason?: string | null;
  };
  onSuccess: () => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
}

export function SubscriberEditDialog({ open, onOpenChange, subscriber, onSuccess }: SubscriberEditDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(subscriber.plan_id || 'none');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    subscriber.subscription_expires_at ? new Date(subscriber.subscription_expires_at) : undefined
  );
  const [storeActive, setStoreActive] = useState(subscriber.store_status === 'active');
  const [customPrice, setCustomPrice] = useState<string>(subscriber.custom_monthly_price?.toString() || '');
  const [discountReason, setDiscountReason] = useState<string>(subscriber.discount_reason || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPlans();
      setSelectedPlanId(subscriber.plan_id || 'none');
      setExpirationDate(subscriber.subscription_expires_at ? new Date(subscriber.subscription_expires_at) : undefined);
      setStoreActive(subscriber.store_status === 'active');
      setCustomPrice(subscriber.custom_monthly_price?.toString() || '');
      setDiscountReason(subscriber.discount_reason || '');
    }
  }, [open, subscriber]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .order('price');
    
    if (data) setPlans(data);
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    
    // Sugerir data de expiração (+30 dias para mensal)
    if (planId && planId !== 'none') {
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        const daysToAdd = selectedPlan.billing_cycle === 'monthly' ? 30 : 365;
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + daysToAdd);
        setExpirationDate(suggestedDate);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const customPriceValue = customPrice ? parseFloat(customPrice) : null;
      
      const { error } = await supabase
        .from('stores')
        .update({
          plan_id: selectedPlanId === 'none' ? null : selectedPlanId,
          subscription_expires_at: expirationDate ? expirationDate.toISOString() : null,
          status: storeActive ? 'active' : 'inactive',
          custom_monthly_price: customPriceValue,
          discount_reason: customPriceValue ? discountReason : null,
          discount_applied_at: customPriceValue ? new Date().toISOString() : null,
          discount_applied_by: customPriceValue ? (await supabase.auth.getUser()).data.user?.id : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.store_id);

      if (error) throw error;

      // Registrar no log de auditoria
      const logAction = customPriceValue ? 'apply_discount' : 'update_subscription';
      await supabase.rpc('log_admin_action', {
        p_action: logAction,
        p_target_user_id: subscriber.id,
        p_details: {
          store_id: subscriber.store_id,
          store_name: subscriber.store_name,
          plan_id: selectedPlanId,
          subscription_expires_at: expirationDate?.toISOString(),
          store_status: storeActive ? 'active' : 'inactive',
          custom_monthly_price: customPriceValue,
          discount_reason: discountReason,
          original_price: subscriber.plan_price
        }
      });

      toast.success('Assinatura atualizada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar assinatura:', error);
      toast.error('Não foi possível atualizar a assinatura.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setCustomPrice('');
    setDiscountReason('');
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Assinatura
          </DialogTitle>
          <DialogDescription>
            Assinante: <strong>{subscriber.full_name}</strong> - Loja: <strong>{subscriber.store_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plano
            </Label>
            <Select value={selectedPlanId} onValueChange={handlePlanChange}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem Plano</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - R$ {Number(plan.price).toFixed(2)}/{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <p className="text-xs text-muted-foreground">
                Valor: R$ {Number(selectedPlan.price).toFixed(2)} por {selectedPlan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Data de Expiração
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {expirationDate && expirationDate < new Date() && (
              <p className="text-xs text-orange-600">
                ⚠️ Esta data já passou. A assinatura estará expirada.
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpirationDate(undefined)}
              className="w-full"
            >
              Remover data de expiração (ilimitado)
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-orange-600" />
              <Label className="text-base font-semibold">Preço Personalizado (Opcional)</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-price" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Valor Mensal (R$)
              </Label>
              <Input
                id="custom-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 298.00"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
              {selectedPlan && customPrice && parseFloat(customPrice) < Number(selectedPlan.price) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço original:</span>
                  <span className="line-through">R$ {Number(selectedPlan.price).toFixed(2)}</span>
                </div>
              )}
              {selectedPlan && customPrice && (
                <div className="flex items-center justify-between text-sm font-semibold text-green-600">
                  <span>Desconto:</span>
                  <span>-{Math.round((1 - parseFloat(customPrice) / Number(selectedPlan.price)) * 100)}%</span>
                </div>
              )}
            </div>

            {customPrice && (
              <div className="space-y-2">
                <Label htmlFor="discount-reason" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Motivo do Desconto
                </Label>
                <Textarea
                  id="discount-reason"
                  placeholder="Ex: Parceria especial, primeiro cliente da região..."
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {(customPrice || subscriber.custom_monthly_price) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveDiscount}
                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <X className="h-4 w-4 mr-2" />
                Remover Desconto (voltar ao preço do plano)
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="store-active" className="text-base">
                Loja Ativa
              </Label>
              <p className="text-sm text-muted-foreground">
                {storeActive ? 'Loja está visível para clientes' : 'Loja está desativada'}
              </p>
            </div>
            <Switch
              id="store-active"
              checked={storeActive}
              onCheckedChange={setStoreActive}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
