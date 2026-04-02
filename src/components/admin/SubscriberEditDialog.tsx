import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Calendar as CalendarIcon, CreditCard, Percent, Tag, X, User, Mail, Phone, Send, CheckCircle2, AlertCircle, Bell, Clock, History } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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

  // Automation config
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState('1');
  const [notifyOnDueDate, setNotifyOnDueDate] = useState(true);
  const [overdueNotifyCount, setOverdueNotifyCount] = useState('3');
  const [overdueIntervalDays, setOverdueIntervalDays] = useState('3');
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  // Billing contact fields
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [whatsappValid, setWhatsappValid] = useState<boolean | null>(null);
  const [validatingWhatsapp, setValidatingWhatsapp] = useState(false);
  const [sendingCharge, setSendingCharge] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPlans();
      fetchBillingContacts();
      fetchBillingConfig();
      fetchNotificationHistory();
      setSelectedPlanId(subscriber.plan_id || 'none');
      setExpirationDate(subscriber.subscription_expires_at ? new Date(subscriber.subscription_expires_at) : undefined);
      setStoreActive(subscriber.store_status === 'active');
      setCustomPrice(subscriber.custom_monthly_price && Number(subscriber.custom_monthly_price) > 0 
        ? Number(subscriber.custom_monthly_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
        : '');
      setDiscountReason(subscriber.discount_reason || '');
      setWhatsappValid(null);
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

  const fetchBillingContacts = async () => {
    const { data } = await supabase
      .from('stores')
      .select('billing_contact_name, billing_contact_email, billing_contact_phone')
      .eq('id', subscriber.store_id)
      .single();

    if (data) {
      setBillingName((data as any).billing_contact_name || '');
      setBillingEmail((data as any).billing_contact_email || '');
      setBillingPhone((data as any).billing_contact_phone || '');
    }
  };

  const fetchBillingConfig = async () => {
    // Try store-specific config first, then global
    const { data: storeConfig } = await supabase
      .from('subscription_billing_config')
      .select('*')
      .eq('store_id', subscriber.store_id)
      .single();

    if (storeConfig) {
      setAutoSendEnabled(storeConfig.auto_send_enabled);
      setNotifyDaysBefore(String(storeConfig.notify_days_before));
      setNotifyOnDueDate(storeConfig.notify_on_due_date);
      setOverdueNotifyCount(String(storeConfig.overdue_notify_count));
      setOverdueIntervalDays(String(storeConfig.overdue_notify_interval_days));
    } else {
      // Load global defaults
      const { data: globalConfig } = await supabase
        .from('subscription_billing_config')
        .select('*')
        .is('store_id', null)
        .single();

      if (globalConfig) {
        setAutoSendEnabled(false); // Not enabled by default for new stores
        setNotifyDaysBefore(String(globalConfig.notify_days_before));
        setNotifyOnDueDate(globalConfig.notify_on_due_date);
        setOverdueNotifyCount(String(globalConfig.overdue_notify_count));
        setOverdueIntervalDays(String(globalConfig.overdue_notify_interval_days));
      }
    }
  };

  const fetchNotificationHistory = async () => {
    const { data } = await supabase
      .from('subscription_invoice_notifications')
      .select('*')
      .eq('store_id', subscriber.store_id)
      .order('sent_at', { ascending: false })
      .limit(10);

    if (data) setNotificationHistory(data);
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    
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

  const validateWhatsapp = async () => {
    if (!billingPhone) {
      toast.error('Informe o WhatsApp primeiro');
      return;
    }

    setValidatingWhatsapp(true);
    setWhatsappValid(null);

    try {
      const cleanPhone = billingPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone, sendWelcome: false }
      });

      if (error) throw error;

      const isValid = data?.exists === true || data?.valid === true;
      setWhatsappValid(isValid);

      if (isValid) {
        toast.success('WhatsApp válido!');
      } else {
        toast.error('Número não encontrado no WhatsApp');
      }
    } catch (err) {
      console.error('Erro ao validar WhatsApp:', err);
      toast.error('Erro ao validar WhatsApp');
      setWhatsappValid(false);
    } finally {
      setValidatingWhatsapp(false);
    }
  };

  const handleSendCharge = async () => {
    if (!billingPhone) {
      toast.error('Informe o WhatsApp do contato financeiro');
      return;
    }

    const effectivePrice = getEffectiveAmount();
    if (effectivePrice <= 0) {
      toast.error('Valor da cobrança deve ser maior que zero');
      return;
    }

    setSendingCharge(true);
    try {
      const cleanPhone = billingPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const { data, error } = await supabase.functions.invoke('send-subscription-charge', {
        body: {
          store_id: subscriber.store_id,
          phone: fullPhone,
          contact_name: billingName || subscriber.full_name,
          amount: effectivePrice,
          description: `Assinatura Mostralo - ${subscriber.store_name}`,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Cobrança de ${data.amount} enviada via WhatsApp!`);
      } else {
        throw new Error(data?.error || 'Erro ao enviar cobrança');
      }
    } catch (err: any) {
      console.error('Erro ao enviar cobrança:', err);
      toast.error(err.message || 'Erro ao enviar cobrança via WhatsApp');
    } finally {
      setSendingCharge(false);
    }
  };

  const parseBRLToNumber = (value: string): number => {
    if (!value) return 0;
    // "1.298,50" → "1298.50"
    return Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const getEffectiveAmount = (): number => {
    const parsedCustom = parseBRLToNumber(customPrice);
    if (customPrice && Number.isFinite(parsedCustom) && parsedCustom > 0) {
      return parsedCustom;
    }
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    return selectedPlan ? Number(selectedPlan.price) : 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const customPriceValue = customPrice
        ? parseBRLToNumber(customPrice)
        : null;
      
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      const hasCustomPrice = customPriceValue !== null && customPriceValue > 0;

      const updatePayload: Record<string, any> = {
        plan_id: selectedPlanId === 'none' ? null : selectedPlanId,
        subscription_expires_at: expirationDate ? expirationDate.toISOString() : null,
        status: storeActive ? 'active' : 'inactive',
        custom_monthly_price: hasCustomPrice ? Number(customPriceValue.toFixed(2)) : null,
        discount_reason: hasCustomPrice ? discountReason : null,
        discount_applied_at: hasCustomPrice ? new Date().toISOString() : null,
        discount_applied_by: hasCustomPrice ? currentUserId : null,
        billing_contact_name: billingName || null,
        billing_contact_email: billingEmail || null,
        billing_contact_phone: billingPhone || null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedStore, error } = await supabase
        .from('stores')
        .update(updatePayload)
        .eq('id', subscriber.store_id)
        .select('id, plan_id, custom_monthly_price')
        .single();

      if (error || !updatedStore) {
        console.error('❌ Erro ao salvar store:', error);
        throw error || new Error('Nenhuma loja foi atualizada (permissão negada).');
      }

      // Registrar no log de auditoria
      await supabase.rpc('log_admin_action', {
        p_action: customPriceValue ? 'apply_discount' : 'update_subscription',
        p_target_user_id: subscriber.id,
        p_details: {
          store_id: subscriber.store_id,
          store_name: subscriber.store_name,
          plan_id: selectedPlanId,
          subscription_expires_at: expirationDate?.toISOString(),
          store_status: storeActive ? 'active' : 'inactive',
          custom_monthly_price: customPriceValue,
          discount_reason: discountReason,
          original_price: subscriber.plan_price,
          billing_contact_name: billingName,
          billing_contact_email: billingEmail,
          billing_contact_phone: billingPhone,
        }
      });

      // Salvar configuração de automação de cobranças
      await supabase
        .from('subscription_billing_config')
        .upsert({
          store_id: subscriber.store_id,
          auto_send_enabled: autoSendEnabled,
          notify_days_before: parseInt(notifyDaysBefore) || 1,
          notify_on_due_date: notifyOnDueDate,
          overdue_notify_count: parseInt(overdueNotifyCount) || 3,
          overdue_notify_interval_days: parseInt(overdueIntervalDays) || 3,
        }, { onConflict: 'store_id' });

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
  const parsedCustomPrice = Number.parseFloat(customPrice.replace(',', '.'));
  const effectiveAmount = getEffectiveAmount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
          {/* Plano */}
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

          {/* Data de Expiração */}
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

          {/* Preço Personalizado */}
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  id="custom-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pl-10"
                  value={customPrice}
                  onChange={(e) => {
                    // Máscara de moeda BRL: aceita apenas números e formata com vírgula
                    let raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') {
                      setCustomPrice('');
                      return;
                    }
                    // Limitar a valores razoáveis (até 999999,99)
                    if (raw.length > 8) raw = raw.slice(0, 8);
                    const numericValue = parseInt(raw, 10) / 100;
                    const formatted = numericValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                    setCustomPrice(formatted);
                  }}
                />
              </div>
              {selectedPlan && customPrice && Number.isFinite(parsedCustomPrice) && parsedCustomPrice < Number(selectedPlan.price) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço original:</span>
                  <span className="line-through">R$ {Number(selectedPlan.price).toFixed(2)}</span>
                </div>
              )}
              {selectedPlan && customPrice && Number.isFinite(parsedCustomPrice) && (
                <div className="flex items-center justify-between text-sm font-semibold text-green-600">
                  <span>Desconto:</span>
                  <span>-{Math.round((1 - parsedCustomPrice / Number(selectedPlan.price)) * 100)}%</span>
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

          <Separator />

          {/* Contato Financeiro */}
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-semibold">Contato Financeiro</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Dados do responsável por receber cobranças da assinatura
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="billing-name" className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5" />
                  Nome
                </Label>
                <Input
                  id="billing-name"
                  placeholder="Nome do responsável financeiro"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="billing-email" className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                <Input
                  id="billing-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="billing-phone" className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="billing-phone"
                    placeholder="11999999999"
                    value={billingPhone}
                    onChange={(e) => {
                      setBillingPhone(e.target.value);
                      setWhatsappValid(null);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={validateWhatsapp}
                    disabled={validatingWhatsapp || !billingPhone}
                    className="shrink-0"
                  >
                    {validatingWhatsapp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Validar'
                    )}
                  </Button>
                </div>
                {whatsappValid !== null && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {whatsappValid ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">WhatsApp válido</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs text-red-500 font-medium">Número não encontrado no WhatsApp</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botão de teste de cobrança */}
            {billingPhone && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Enviar Cobrança PIX</Label>
                    {effectiveAmount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        R$ {effectiveAmount.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Envia cobrança PIX via WhatsApp Master com botão de pagamento nativo
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSendCharge}
                    disabled={sendingCharge || effectiveAmount <= 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {sendingCharge ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando cobrança...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Cobrança via WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
          <Separator />

          {/* Automação de Cobranças */}
          <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              <Label className="text-base font-semibold">Automação de Cobranças</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure envio automático de lembretes e cobranças via WhatsApp
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-send" className="text-sm">Automação ativa</Label>
              <Switch
                id="auto-send"
                checked={autoSendEnabled}
                onCheckedChange={setAutoSendEnabled}
              />
            </div>

            {autoSendEnabled && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Dias antes do vencimento
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={notifyDaysBefore}
                      onChange={(e) => setNotifyDaysBefore(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cobranças após vencer</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={overdueNotifyCount}
                      onChange={(e) => setOverdueNotifyCount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="notify-due-date"
                      checked={notifyOnDueDate}
                      onCheckedChange={setNotifyOnDueDate}
                    />
                    <Label htmlFor="notify-due-date" className="text-xs">No dia do vencimento</Label>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Intervalo (dias)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={overdueIntervalDays}
                      onChange={(e) => setOverdueIntervalDays(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de notificações */}
            {notificationHistory.length > 0 && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <History className="h-3 w-3" />
                  Últimas notificações
                </Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {notificationHistory.map((n) => (
                    <div key={n.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                      <Badge variant="outline" className="text-[10px]">
                        {n.notification_type === 'before_due' ? '⏰ Lembrete' :
                         n.notification_type === 'on_due' ? '📅 Vencimento' :
                         `🔴 Vencida #${n.overdue_sequence}`}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(n.sent_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
