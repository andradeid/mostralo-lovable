// Modal de criar/editar cupom: código, nome, descrição, desconto, duração, limites,
// datas, exibição pública e status.
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Loader2 } from 'lucide-react';
import { getCalculatedDiscount as calculateDiscount, type Coupon, type Plan } from '@/lib/coupons/adminCoupons';
import type { CouponFormState, SetCouponFormState } from '@/hooks/coupons/useAdminCoupons';
import { CouponDiscountSection } from './CouponDiscountSection';
import { CouponDurationSection } from './CouponDurationSection';
import { CouponLimitsSection } from './CouponLimitsSection';

interface Props {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  selectedCoupon: Coupon | null;
  formData: CouponFormState;
  setFormData: SetCouponFormState;
  plans: Plan[];
  saving: boolean;
  handleSave: () => void;
}

export function CouponFormDialog({ dialogOpen, setDialogOpen, selectedCoupon, formData, setFormData, plans, saving, handleSave }: Props) {
  const getCalculatedDiscount = () => calculateDiscount(formData, plans);

  return (
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
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="code" className="text-xs md:text-sm">Código *</Label>
                  <InfoTooltip text="Código que o cliente digita no cadastro. Use letras maiúsculas sem espaços. Ex: PROMO30, BEMVINDO, 30DIAS" />
                </div>
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
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="name" className="text-xs md:text-sm">Nome *</Label>
                  <InfoTooltip text="Nome interno para identificação. Não aparece para o cliente. Ex: Promoção Black Friday, Parceiro João" />
                </div>
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

            <CouponDiscountSection formData={formData} setFormData={setFormData} plans={plans} />

            {/* 🕐 Duração do Desconto */}
            <CouponDurationSection formData={formData} setFormData={setFormData} />

            <CouponLimitsSection formData={formData} setFormData={setFormData} />

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
                  {formData.status === 'expired' && <SelectItem value="expired">Expirado</SelectItem>}
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
  );
}
