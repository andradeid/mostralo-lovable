import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { X, Plus } from 'lucide-react';
import type { ProductVariant } from './types';

interface Props {
  variants: ProductVariant[];
  newVariantName: string;
  setNewVariantName: (value: string) => void;
  addVariant: () => void;
  removeVariant: (index: number) => void;
  updateVariantPrice: (index: number, price: number) => void;
}

export function VariantsSection({ variants, newVariantName, setNewVariantName, addVariant, removeVariant, updateVariantPrice }: Props) {
  return <div className="space-y-4">
              <h3 className="text-lg font-medium">Variações</h3>

              {variants.length > 0 && <div className="space-y-2">
                  {variants.map((variant, index) => <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <span className="flex-1 font-medium">{variant.name}</span>
                      <div className="flex items-center gap-2">
                        <CurrencyInput
                          value={variant.price}
                          onChange={(value) => updateVariantPrice(index, value)}
                          className="w-32"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>)}
                </div>}

              <div className="flex items-center gap-2">
                <Input value={newVariantName} onChange={e => setNewVariantName(e.target.value)} placeholder="Ex: 250 ML, Tamanho P, etc." className="flex-1" onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addVariant();
                }
              }} />
                <Button type="button" variant="outline" size="sm" onClick={addVariant} disabled={!newVariantName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button type="button" variant="link" className="p-0 h-auto text-sm text-muted-foreground" onClick={() => {
              const input = document.querySelector('input[placeholder="Ex: 250 ML, Tamanho P, etc."]') as HTMLInputElement;
              input?.focus();
            }}>Adicionar </Button>
            </div>;
}
