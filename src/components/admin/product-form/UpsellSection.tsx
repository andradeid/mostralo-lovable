import { HelpCircle } from 'lucide-react';
import { ProductUpsellSelector } from '@/components/admin/products/ProductUpsellSelector';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Só aparece ao editar um produto de loja conhecida (o ProductForm decide). */
export function UpsellSection({ storeId, productId }: { storeId: string; productId: string }) {
  return <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Upsell</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Sugira produtos complementares quando o cliente adicionar este item ao carrinho.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure produtos que serão sugeridos automaticamente quando este produto for adicionado ao carrinho.
                </p>
                <ProductUpsellSelector
                  storeId={storeId}
                  productId={productId}
                />
              </div>;
}
