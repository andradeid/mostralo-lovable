// Formulário de cupom: tipo e valor do desconto, prévia do "Preço Final",
// a quais planos se aplica e seleção dos planos.
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Percent, DollarSign } from 'lucide-react';
import { formatPrice, getCalculatedDiscount as calculateDiscount, type FormDiscountType, type Plan } from '@/lib/coupons/adminCoupons';
import type { CouponFormState, SetCouponFormState } from '@/hooks/coupons/useAdminCoupons';

interface Props {
  formData: CouponFormState;
  setFormData: SetCouponFormState;
  plans: Plan[];
}

export function CouponDiscountSection({ formData, setFormData, plans }: Props) {
  const getCalculatedDiscount = () => calculateDiscount(formData, plans);

  return (
    <>
            {/* Tipo e Valor do Desconto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="discount_type" className="text-xs md:text-sm">Tipo de Desconto</Label>
                  <InfoTooltip text="Porcentagem: desconto em %. Valor Fixo: desconto em R$. Preço Final: define o valor que o cliente paga (requer 1 plano específico)." />
                </div>
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
    </>
  );
}
