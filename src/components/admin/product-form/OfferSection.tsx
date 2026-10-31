import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { brl } from '@/lib/brl';
import type { ProductFormApi } from './types';

export function OfferSection({ form }: { form: ProductFormApi }) {
  return <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">Ofertas e Promoções</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="right">
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Desconto do Produto:</strong> Para ofertas permanentes ou de longa duração.
                        </p>
                        <p>
                          <strong>Promoções (aba Promoções):</strong> Para campanhas temporárias com regras específicas.
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                          ⚡ Se ambos existirem, o sistema aplicará automaticamente o maior desconto ao cliente.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_on_offer"
                  checked={form.watch('is_on_offer')}
                  onCheckedChange={checked => {
                    form.setValue('is_on_offer', checked);
                    if (!checked) {
                      form.setValue('offer_price', 0);
                    }
                  }}
                />
                <Label htmlFor="is_on_offer">Este produto está em oferta</Label>
              </div>

              {form.watch('is_on_offer') && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="offer_price">Preço com Desconto *</Label>
                    <CurrencyInput
                      id="offer_price"
                      value={form.watch('offer_price') || 0}
                      onChange={(value) => form.setValue('offer_price', value, { shouldValidate: true })}
                    />
                    {form.formState.errors.offer_price && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.offer_price.message}
                      </p>
                    )}
                  </div>

                  {form.watch('offer_price') > 0 && form.watch('price') > 0 && form.watch('offer_price') < form.watch('price') && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Desconto: {Math.round((1 - form.watch('offer_price') / form.watch('price')) * 100)}%</strong>
                      </p>
                      <p className="text-sm text-green-700">
                        De {brl(form.watch('price'))} por {brl(form.watch('offer_price'))}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>;
}
