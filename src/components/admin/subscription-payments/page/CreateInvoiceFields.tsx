// Criar fatura: loja, plano, preço, vencimento e observações.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPhone } from "@/lib/utils";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function CreateInvoiceFields({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { stores, plans, formData, setFormData, useCustomPrice, setUseCustomPrice, originalPlanPrice, setOriginalPlanPrice, setSelectedStoreData, setWhatsappPhone } = ctx;

  return (
    <>
      <div>
        <Label htmlFor="store">Loja *</Label>
        <Select 
          value={formData.store_id} 
          onValueChange={async (value) => {
            const store = stores.find(s => s.id === value);
            setSelectedStoreData(store || null);
            
            // Buscar telefone do dono da loja
            if (store) {
              const { data: storeData } = await supabase
                .from('stores')
                .select('owner_id, profiles:owner_id(phone)')
                .eq('id', value)
                .single();
              
              if (storeData?.profiles) {
                const ownerPhone = (storeData.profiles as any)?.phone;
                if (ownerPhone) {
                  setWhatsappPhone(formatPhone(ownerPhone));
                }
              }
            }
            
            // Se a loja tem custom_monthly_price, carregar automaticamente
            if (store?.custom_monthly_price) {
              setUseCustomPrice(true);
              setFormData({
                ...formData, 
                store_id: value,
                amount: store.custom_monthly_price.toString(),
                discount_reason: store.discount_reason || ""
              });
              
              // Buscar preço original do plano da loja
              if (store.plan_id) {
                const plan = plans.find(p => p.id === store.plan_id);
                if (plan) {
                  setOriginalPlanPrice(plan.price);
                  if (!formData.plan_id) {
                    setFormData(prev => ({...prev, plan_id: store.plan_id!}));
                  }
                }
              }
            } else {
              setUseCustomPrice(false);
              setFormData({...formData, store_id: value, discount_reason: ""});
              setOriginalPlanPrice(0);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma loja" />
          </SelectTrigger>
          <SelectContent>
            {stores.map(store => (
              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="plan">Plano *</Label>
        <Select 
          value={formData.plan_id} 
          onValueChange={(value) => {
            const plan = plans.find(p => p.id === value);
            if (plan) {
              setOriginalPlanPrice(plan.price);
              
              // Se não está usando preço personalizado, usar preço do plano
              if (!useCustomPrice) {
                setFormData({
                  ...formData, 
                  plan_id: value,
                  amount: plan.price.toString()
                });
              } else {
                setFormData({
                  ...formData, 
                  plan_id: value
                });
              }
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um plano" />
          </SelectTrigger>
          <SelectContent>
            {plans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seção de Preço Personalizado */}
      {formData.plan_id && originalPlanPrice > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              💰 Preço Personalizado (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Preço do plano</p>
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalPlanPrice)}
                </p>
              </div>
              {useCustomPrice && formData.amount && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Desconto</p>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    -{Math.round(((originalPlanPrice - Number(formData.amount)) / originalPlanPrice) * 100)}%
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-custom-price"
                checked={useCustomPrice}
                onChange={(e) => {
                  setUseCustomPrice(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({
                      ...formData, 
                      amount: originalPlanPrice.toString(),
                      discount_reason: ""
                    });
                  }
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="use-custom-price" className="text-sm font-medium cursor-pointer">
                Aplicar preço personalizado com desconto
              </Label>
            </div>

            {useCustomPrice && (
              <>
                <div>
                  <Label htmlFor="custom-amount">Valor Personalizado *</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="font-bold text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="discount-reason">Motivo do Desconto</Label>
                  <Textarea
                    id="discount-reason"
                    value={formData.discount_reason}
                    onChange={(e) => setFormData({...formData, discount_reason: e.target.value})}
                    placeholder="Ex: Cliente antigo, promoção especial, parceria..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!useCustomPrice && formData.plan_id && (
        <div>
          <Label htmlFor="amount">Valor *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            disabled
          />
        </div>
      )}
      <div>
        <Label htmlFor="due_date">Data de Vencimento *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({...formData, due_date: e.target.value})}
        />
      </div>
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Observações adicionais..."
        />
      </div>
    </>
  );
}
