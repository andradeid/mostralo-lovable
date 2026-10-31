import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from './constants';
import type { PromotionSectionProps } from './types';

export function ScopeSection({ formData, setFormData, products, categories }: PromotionSectionProps & { products: any[]; categories: any[] }) {
  return (
    <>
    {/* Escopo */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Aplicar Promoção Em</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="scope">Aplicar em *</Label>
          <Select value={formData.scope} onValueChange={(value: any) => setFormData({ ...formData, scope: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_products">Todos os Produtos</SelectItem>
              <SelectItem value="category">Categorias Específicas</SelectItem>
              <SelectItem value="specific_products">Produtos Específicos</SelectItem>
              <SelectItem value="delivery_type">Tipo de Entrega</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.scope === 'specific_products' && (
          <div className="space-y-2">
            <Label>Produtos *</Label>
            <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-3">
              {products.map((product) => {
                const isSelected = formData.selectedProducts?.includes(product.id);
                const salePrice = formData.product_sale_prices?.[product.id];
                
                return (
                  <div key={product.id} className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    isSelected ? "bg-primary/5" : ""
                  )}>
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const current = formData.selectedProducts || [];
                        const newSalePrices = { ...formData.product_sale_prices };
                        if (!checked) {
                          delete newSalePrices[product.id];
                        }
                        setFormData({
                          ...formData,
                          selectedProducts: checked
                            ? [...current, product.id]
                            : current.filter(id => id !== product.id),
                          product_sale_prices: newSalePrices
                        });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer font-medium block">
                        {product.name}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        Preço atual: {formatCurrency(product.price)}
                      </span>
                    </div>
                    
                    {/* Campo de preço promocional */}
                    {isSelected && formData.include_product_discount && formData.discount_mode === 'sale_price' && (
                      <div className="w-36">
                        <CurrencyInput
                          value={salePrice ?? 0}
                          onChange={(value) => {
                            setFormData({
                              ...formData,
                              product_sale_prices: {
                                ...formData.product_sale_prices,
                                [product.id]: value
                              }
                            });
                          }}
                          placeholder="0,00"
                          className="h-8 text-xs"
                        />
                        {salePrice !== undefined && salePrice > 0 && salePrice < product.price && (
                          <p className="text-[10px] text-green-600 mt-0.5">
                            -{((1 - salePrice / product.price) * 100).toFixed(0)}% OFF
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {formData.scope === 'category' && (
          <div className="space-y-2">
            <Label>Categorias *</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={formData.selectedCategories?.includes(category.id)}
                    onCheckedChange={(checked) => {
                      const current = formData.selectedCategories || [];
                      setFormData({
                        ...formData,
                        selectedCategories: checked
                          ? [...current, category.id]
                          : current.filter(id => id !== category.id)
                      });
                    }}
                  />
                  <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="applies_to_delivery">Aplicar em Delivery</Label>
            <Switch
              id="applies_to_delivery"
              checked={formData.applies_to_delivery}
              onCheckedChange={(checked) => setFormData({ ...formData, applies_to_delivery: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="applies_to_pickup">Aplicar em Retirada</Label>
            <Switch
              id="applies_to_pickup"
              checked={formData.applies_to_pickup}
              onCheckedChange={(checked) => setFormData({ ...formData, applies_to_pickup: checked })}
            />
          </div>
        </div>
      </div>
    </Card>
    </>
  );
}
