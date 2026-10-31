import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { PromotionSectionProps } from './types';

export function VisibilitySection({ formData, setFormData }: PromotionSectionProps) {
  return (
    <>
    {/* Visibilidade */}
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="is_visible_on_store">Exibir na Loja</Label>
          <p className="text-sm text-muted-foreground">
            Mostrar esta promoção em destaque na página da loja
          </p>
        </div>
        <Switch
          id="is_visible_on_store"
          checked={formData.is_visible_on_store}
          onCheckedChange={(checked) => setFormData({ ...formData, is_visible_on_store: checked })}
        />
      </div>
    </Card>
    </>
  );
}
