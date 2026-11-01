// Adicionais por categoria, com obrigatório, regra de quantidade e botões de +/−.
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/productPage/pricing';
import type { AddonCategory, SelectedAddons } from '@/lib/productPage/types';

interface Props {
  addonCategories: AddonCategory[];
  selectedAddons: SelectedAddons;
  handleAddonQuantityChange: (categoryId: string, addonId: string, delta: number) => void;
}

export function ProductAddonsList({ addonCategories, selectedAddons, handleAddonQuantityChange }: Props) {
  if (!(addonCategories.length > 0)) return null;
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Adicionais</h3>
      {addonCategories.map((category) => (
        <div key={category.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{category.name}</h4>
            {category.is_required && (
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
           <p className="text-xs text-muted-foreground">
             {category.max_selections === null || category.max_selections === undefined
               ? `Selecione no mínimo ${category.min_selections || 0} itens`
               : (category.min_selections || 0) === (category.max_selections || 1)
               ? `Selecione ${category.min_selections || 0} ${(category.min_selections || 0) === 1 ? 'item' : 'itens'}`
               : `Selecione entre ${category.min_selections || 0} e ${category.max_selections || 1} itens`
             }
           </p>

          <div className="grid gap-2">
              {category.addons.map((addon) => {
                const currentSelections = selectedAddons[category.id] || {};
                const currentQuantity = currentSelections[addon.id] || 0;
                const isSelected = currentQuantity > 0;
                const maxSelections = category.max_selections;

                // Calcular total de itens selecionados na categoria
                const totalItemsSelected = Object.values(currentSelections).reduce((sum, qty) => sum + qty, 0);

                // Se não há limite máximo, sempre pode adicionar mais
                // Se há limite máximo, verifica se ainda pode adicionar mais
                const canAddMore = maxSelections === null || maxSelections === undefined
                  ? true
                  : totalItemsSelected < maxSelections;

               return (
                 <Card
                   key={addon.id}
                   className={`transition-colors ${
                     isSelected
                       ? 'ring-2 ring-primary bg-primary/5'
                       : 'hover:bg-muted/50'
                   }`}
                 >
                   <CardContent className="p-3">
                     <div className="flex justify-between items-center">
                       <div className="flex-1">
                         <p className="font-medium">{addon.name}</p>
                         {addon.description && (
                           <p className="text-sm text-muted-foreground">
                             {addon.description}
                           </p>
                         )}
                       </div>
                       <div className="flex items-center gap-3">
                         <p className="font-semibold">
                           +{formatPrice(addon.price)}
                         </p>

                         {/* Controles de quantidade */}
                         <div className="flex items-center gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleAddonQuantityChange(category.id, addon.id, -1)}
                             disabled={currentQuantity === 0}
                             className="h-8 w-8 p-0"
                           >
                             <Minus className="w-3 h-3" />
                           </Button>
                           <span className="min-w-[20px] text-center font-medium">
                             {currentQuantity}
                           </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddonQuantityChange(category.id, addon.id, 1)}
                              disabled={!canAddMore}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
          </div>
        </div>
      ))}
    </div>
  );
}
