import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProductFormApi } from './types';

export function StockSection({ form }: { form: ProductFormApi }) {
  // Vendido por quilo: a quantidade dos itens é inteira, então o estoque não é controlado
  const soldByWeight = !!form.watch('sold_by_weight');
  return <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Controle de Estoque</h3>
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
                            <strong>Estoque Controlado:</strong> O sistema irá decrementar automaticamente a cada venda.
                          </p>
                          <p>
                            <strong>Sem Controle:</strong> Produto sempre disponível (ideal para serviços ou combos).
                          </p>
                          <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                            ⚡ Quando o estoque zerar, o produto será marcado como indisponível automaticamente.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="track_stock"
                    checked={form.watch('track_stock') && !soldByWeight}
                    disabled={soldByWeight}
                    onCheckedChange={(checked) => {
                      form.setValue('track_stock', checked);
                      if (!checked) {
                        form.setValue('stock_quantity', null);
                      }
                    }}
                  />
                  <Label htmlFor="track_stock">Controlar estoque</Label>
                </div>
              </div>

              {soldByWeight && (
                <p className="text-xs text-muted-foreground">Produto vendido por quilo: o estoque não é controlado.</p>
              )}

              {form.watch('track_stock') && !soldByWeight && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={form.watch('stock_quantity') ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        form.setValue('stock_quantity', value);
                      }}
                      placeholder="Ex: 100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantidade atual disponível para venda
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock_alert_threshold">Alerta de Estoque Baixo</Label>
                    <Input
                      id="stock_alert_threshold"
                      type="number"
                      min="0"
                      {...form.register('stock_alert_threshold', { valueAsNumber: true })}
                      placeholder="Ex: 5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aviso quando estoque atingir esta quantidade
                    </p>
                  </div>

                  {form.watch('stock_quantity') !== null && form.watch('stock_quantity') !== undefined && (
                    <div className="col-span-full">
                      <div className={`p-3 rounded-lg border ${
                        form.watch('stock_quantity')! <= 0
                          ? 'bg-red-50 border-red-200'
                          : form.watch('stock_quantity')! <= (form.watch('stock_alert_threshold') || 5)
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          form.watch('stock_quantity')! <= 0
                            ? 'text-red-800'
                            : form.watch('stock_quantity')! <= (form.watch('stock_alert_threshold') || 5)
                              ? 'text-yellow-800'
                              : 'text-green-800'
                        }`}>
                          {form.watch('stock_quantity')! <= 0
                            ? '⚠️ Sem estoque - Produto será marcado como indisponível'
                            : form.watch('stock_quantity')! <= (form.watch('stock_alert_threshold') || 5)
                              ? `⚠️ Estoque baixo - Apenas ${form.watch('stock_quantity')} unidades`
                              : `✓ Estoque OK - ${form.watch('stock_quantity')} unidades disponíveis`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>;
}
