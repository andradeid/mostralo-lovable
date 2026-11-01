// Formulário de cupom: limites de uso (total e por usuário) e datas de início/término.
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import type { CouponFormState, SetCouponFormState } from '@/hooks/coupons/useAdminCoupons';
import { toLocalInput } from '@/lib/coupons/adminCoupons';

interface Props {
  formData: CouponFormState;
  setFormData: SetCouponFormState;
}

export function CouponLimitsSection({ formData, setFormData }: Props) {
  return (
    <>
            {/* Limites */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="max_uses" className="text-xs md:text-sm">Limite Total</Label>
                  <InfoTooltip text="Quantas vezes este cupom pode ser usado no total por todos os clientes. Deixe vazio para usos ilimitados." />
                </div>
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
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="max_uses_per_user" className="text-xs md:text-sm">Por Usuário</Label>
                  <InfoTooltip text="Ajustado automaticamente pela duração selecionada acima. Ex: se 'Primeiros 3 meses', será 3 usos por usuário." />
                </div>
                <Input
                  id="max_uses_per_user"
                  type="number"
                  min="0"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({
                    ...formData,
                    max_uses_per_user: parseInt(e.target.value) || 0
                  })}
                  className="h-9 md:h-10 text-sm"
                  disabled={true}
                />
                <p className="text-[10px] text-muted-foreground">
                  {formData.duration_type === 'once' && '1 uso (desconto único)'}
                  {formData.duration_type === 'multiple' && `${formData.duration_months || 3} usos (1 por mês)`}
                  {formData.duration_type === 'forever' && 'Ilimitado (permanente)'}
                </p>
              </div>
            </div>

            {/* Datas - Empilhar no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="start_date" className="text-xs md:text-sm">Data Início</Label>
                  <InfoTooltip text="Data a partir da qual o cupom pode ser usado. Deixe vazio para disponibilidade imediata." />
                </div>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date ? toLocalInput(formData.start_date) : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    start_date: e.target.value ? new Date(e.target.value).toISOString() : null
                  })}
                  className="h-9 md:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="end_date" className="text-xs md:text-sm">Data Término</Label>
                  <InfoTooltip text="Data limite para uso do cupom. Após esta data, o cupom expira automaticamente. Deixe vazio para sem prazo." />
                </div>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date ? toLocalInput(formData.end_date) : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    end_date: e.target.value ? new Date(e.target.value).toISOString() : null
                  })}
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>
    </>
  );
}
