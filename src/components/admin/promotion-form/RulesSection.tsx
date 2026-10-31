import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { PromotionSectionProps } from './types';

export function RulesSection({ formData, setFormData }: PromotionSectionProps) {
  return (
    <>
    {/* Regras */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Regras e Limites</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="minimum_order_value">Valor Mínimo do Pedido</Label>
          <CurrencyInput
            id="minimum_order_value"
            value={formData.minimum_order_value || 0}
            onChange={(value) => setFormData({ ...formData, minimum_order_value: value || undefined })}
            placeholder="0,00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max_uses">Máximo de Usos Total</Label>
            <Input
              id="max_uses"
              type="number"
              min="1"
              value={formData.max_uses || ''}
              onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="max_uses_per_customer">Máximo por Cliente</Label>
            <Input
              id="max_uses_per_customer"
              type="number"
              min="1"
              value={formData.max_uses_per_customer || ''}
              onChange={(e) => setFormData({ ...formData, max_uses_per_customer: parseInt(e.target.value) || undefined })}
            />
          </div>
        </div>
      </div>
    </Card>
    </>
  );
}
