// Formulário de cupom: duração do desconto (1ª mensalidade, X meses ou permanente).
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Clock, Repeat, Infinity } from 'lucide-react';
import type { CouponFormState, SetCouponFormState } from '@/hooks/coupons/useAdminCoupons';

interface Props {
  formData: CouponFormState;
  setFormData: SetCouponFormState;
}

export function CouponDurationSection({ formData, setFormData }: Props) {
  return (
            <div className="space-y-2 border-t pt-3 md:pt-4">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs md:text-sm font-semibold">Duração do Desconto</Label>
                <InfoTooltip text="Define por quantos meses o desconto será aplicado automaticamente nas renovações. 'Apenas 1ª mensalidade' aplica uma vez. 'Primeiros X meses' aplica por vários ciclos. 'Todas as mensalidades' aplica para sempre." />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, duration_type: 'once', duration_months: 1 })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.duration_type === 'once'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">1ª Mensalidade</p>
                  <p className="text-[10px] text-muted-foreground">Desconto único</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, duration_type: 'multiple', duration_months: 3 })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.duration_type === 'multiple'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Repeat className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Primeiros X meses</p>
                  <p className="text-[10px] text-muted-foreground">Desconto recorrente</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, duration_type: 'forever', duration_months: null })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.duration_type === 'forever'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Infinity className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Permanente</p>
                  <p className="text-[10px] text-muted-foreground">Todas as mensalidades</p>
                </button>
              </div>

              {formData.duration_type === 'multiple' && (
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor="duration_months" className="text-xs md:text-sm whitespace-nowrap">Quantos meses:</Label>
                  <Input
                    id="duration_months"
                    type="number"
                    min="2"
                    max="24"
                    value={formData.duration_months || 3}
                    onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 3 })}
                    className="h-9 w-20 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">meses de desconto</p>
                </div>
              )}

              {/* Preview da configuração */}
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {formData.duration_type === 'once' && '✅ O desconto será aplicado apenas na primeira mensalidade do cliente.'}
                  {formData.duration_type === 'multiple' && `✅ O desconto será aplicado automaticamente nos primeiros ${formData.duration_months || 3} meses. Após isso, o cliente paga o valor integral.`}
                  {formData.duration_type === 'forever' && '✅ O desconto será aplicado em TODAS as mensalidades, sem prazo para terminar.'}
                </p>
              </div>
            </div>
  );
}
