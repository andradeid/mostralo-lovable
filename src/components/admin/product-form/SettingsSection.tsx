import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';
import type { ProductFormApi } from './types';

export function SettingsSection({ form }: { form: ProductFormApi }) {
  return <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Texto do Botão *</Label>
                  <Input id="button_text" {...form.register('button_text')} placeholder="Ex: Comprar, Alugar, Agendar" />
                  {form.formState.errors.button_text && <p className="text-sm text-destructive">
                      {form.formState.errors.button_text.message}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input id="display_order" type="number" min="0" {...form.register('display_order', {
                  valueAsNumber: true
                })} placeholder="0" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_available" checked={form.watch('is_available')} onCheckedChange={checked => form.setValue('is_available', checked)} />
                <Label htmlFor="is_available">Produto disponível</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_featured" checked={form.watch('is_featured')} onCheckedChange={checked => form.setValue('is_featured', checked)} />
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_featured" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Produto em Destaque
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground ml-8 -mt-2">
                Este produto aparecerá na aba "Destaques" da loja
              </p>
            </div>;
}
