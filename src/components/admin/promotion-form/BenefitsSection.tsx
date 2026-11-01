import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { X, AlertCircle, Percent, DollarSign, Tag, Truck, Gift, ShoppingBag, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { PromotionSectionProps } from './types';

export function BenefitsSection({ formData, setFormData, products }: PromotionSectionProps & { products: any[] }) {
  return (
    <>
    {/* Benefícios da Promoção */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Benefícios da Promoção</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Selecione os benefícios que deseja oferecer. Você pode combinar mais de um!
      </p>
      
      <div className="space-y-4">
        {/* Desconto no Produto */}
        <div className={cn(
          "border rounded-lg p-4 transition-colors",
          formData.include_product_discount ? "border-primary bg-primary/5" : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <label htmlFor="opt-include_product_discount" className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <div className={cn(
                "p-2 rounded-lg",
                formData.include_product_discount ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Desconto no Produto</p>
                <p className="text-xs text-muted-foreground">Reduzir o preço dos produtos selecionados</p>
              </div>
            </label>
            <Switch
              id="opt-include_product_discount"
              checked={formData.include_product_discount}
              onCheckedChange={(checked) => setFormData({ ...formData, include_product_discount: checked })}
            />
          </div>
          
          {formData.include_product_discount && (
            <div className="mt-4 space-y-4 pt-4 border-t">
              <div>
                <Label>Como definir o desconto? *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discount_mode: 'sale_price' })}
                    className={cn(
                      "p-3 rounded-lg border text-center text-sm transition-colors",
                      formData.discount_mode === 'sale_price' 
                        ? "border-primary bg-primary/10 text-primary font-medium" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <DollarSign className="w-4 h-4 mx-auto mb-1" />
                    Preço Promocional
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discount_mode: 'percentage' })}
                    className={cn(
                      "p-3 rounded-lg border text-center text-sm transition-colors",
                      formData.discount_mode === 'percentage' 
                        ? "border-primary bg-primary/10 text-primary font-medium" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Percent className="w-4 h-4 mx-auto mb-1" />
                    Percentual (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discount_mode: 'fixed_amount' })}
                    className={cn(
                      "p-3 rounded-lg border text-center text-sm transition-colors",
                      formData.discount_mode === 'fixed_amount' 
                        ? "border-primary bg-primary/10 text-primary font-medium" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <DollarSign className="w-4 h-4 mx-auto mb-1" />
                    Valor Fixo (R$)
                  </button>
                </div>
              </div>
              
              {formData.discount_mode === 'percentage' && (
                <div>
                  <Label htmlFor="discount_percentage">Desconto (%) *</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage || ''}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                    placeholder="Ex: 10"
                    required
                  />
                </div>
              )}
              
              {formData.discount_mode === 'fixed_amount' && (
                <div>
                  <Label htmlFor="discount_amount">Valor do Desconto *</Label>
                  <CurrencyInput
                    id="discount_amount"
                    value={formData.discount_amount || 0}
                    onChange={(value) => setFormData({ ...formData, discount_amount: value })}
                    placeholder="0,00"
                  />
                </div>
              )}
              
              {formData.discount_mode === 'sale_price' && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    💡 Selecione os produtos abaixo na seção "Aplicar em" e defina o preço que deseja vender cada um.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Frete Grátis */}
        <div className={cn(
          "border rounded-lg p-4 transition-colors",
          formData.include_free_delivery ? "border-primary bg-primary/5" : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <label htmlFor="opt-include_free_delivery" className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <div className={cn(
                "p-2 rounded-lg",
                formData.include_free_delivery ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Frete Grátis</p>
                <p className="text-xs text-muted-foreground">Zerar a taxa de entrega do pedido inteiro</p>
              </div>
            </label>
            <Switch
              id="opt-include_free_delivery"
              checked={formData.include_free_delivery}
              onCheckedChange={(checked) => setFormData({ ...formData, include_free_delivery: checked })}
            />
          </div>
        </div>
        
        {/* BOGO */}
        <div className={cn(
          "border rounded-lg p-4 transition-colors",
          formData.include_bogo ? "border-primary bg-primary/5" : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <label htmlFor="opt-include_bogo" className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <div className={cn(
                "p-2 rounded-lg",
                formData.include_bogo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Leve X Pague Y</p>
                <p className="text-xs text-muted-foreground">O cliente leva mais e paga menos</p>
              </div>
            </label>
            <Switch
              id="opt-include_bogo"
              checked={formData.include_bogo}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                include_bogo: checked,
                include_product_discount: checked ? false : formData.include_product_discount
              })}
            />
          </div>
          
          {formData.include_bogo && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bogo_buy">Compre *</Label>
                  <Input
                    id="bogo_buy"
                    type="number"
                    min="1"
                    value={formData.bogo_buy_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, bogo_buy_quantity: isNaN(parseInt(e.target.value)) ? 2 : parseInt(e.target.value) })}
                    placeholder="Ex: 2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bogo_get">Ganhe *</Label>
                  <Input
                    id="bogo_get"
                    type="number"
                    min="1"
                    value={formData.bogo_get_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, bogo_get_quantity: isNaN(parseInt(e.target.value)) ? 1 : parseInt(e.target.value) })}
                    placeholder="Ex: 1"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bogo_discount">Desconto no item ganho (%) *</Label>
                <Input
                  id="bogo_discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.bogo_discount_percentage || 100}
                  onChange={(e) => setFormData({ ...formData, bogo_discount_percentage: parseFloat(e.target.value) })}
                  placeholder="Ex: 100 para grátis, 50 para metade do preço"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use 100 para o item sair de graça, ou 50 para 50% de desconto.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Brinde / Produto Grátis */}
        <div className={cn(
          "border rounded-lg p-4 transition-colors",
          formData.include_free_gift ? "border-primary bg-primary/5" : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <label htmlFor="opt-include_free_gift" className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <div className={cn(
                "p-2 rounded-lg",
                formData.include_free_gift ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Brinde / Produto Grátis</p>
                <p className="text-xs text-muted-foreground">O cliente ganha um produto grátis no pedido (se marcar mais de um, ele escolhe qual)</p>
              </div>
            </label>
            <Switch
              id="opt-include_free_gift"
              checked={formData.include_free_gift}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                include_free_gift: checked,
                include_product_discount: checked ? false : formData.include_product_discount,
                include_bogo: checked ? false : formData.include_bogo
              })}
            />
          </div>
          
          {formData.include_free_gift && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <Label>Selecione o(s) brinde(s) *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`gift-${product.id}`}
                      checked={formData.free_gift_products?.includes(product.id)}
                      onCheckedChange={(checked) => {
                        const current = formData.free_gift_products || [];
                        if (checked) {
                          setFormData({ ...formData, free_gift_products: [...current, product.id] });
                        } else {
                          setFormData({ ...formData, free_gift_products: current.filter(id => id !== product.id) });
                        }
                      }}
                    />
                    <label htmlFor={`gift-${product.id}`} className="text-sm cursor-pointer truncate">
                      {product.name}
                    </label>
                  </div>
                ))}
              </div>
              {(!formData.free_gift_products || formData.free_gift_products.length === 0) && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Selecione ao menos um produto para brinde
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Primeira Compra */}
        <div className={cn(
          "border rounded-lg p-4 transition-colors",
          formData.include_first_order ? "border-primary bg-primary/5" : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <label htmlFor="opt-include_first_order" className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <div className={cn(
                "p-2 rounded-lg",
                formData.include_first_order ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Apenas Primeira Compra</p>
                <p className="text-xs text-muted-foreground">Válida somente para clientes novos</p>
              </div>
            </label>
            <Switch
              id="opt-include_first_order"
              checked={formData.include_first_order}
              onCheckedChange={(checked) => setFormData({ ...formData, include_first_order: checked, first_order_only: checked })}
            />
          </div>
        </div>

        {/* Resumo dos benefícios */}
        {(formData.include_product_discount || formData.include_free_delivery || formData.include_bogo || formData.include_first_order) && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Resumo dos benefícios:</p>
            <ul className="text-xs text-green-700 dark:text-green-400 space-y-0.5">
              {formData.include_product_discount && (
                <li>✓ Desconto no produto ({formData.discount_mode === 'sale_price' ? 'preço promocional' : formData.discount_mode === 'percentage' ? 'percentual' : 'valor fixo'})</li>
              )}
              {formData.include_free_delivery && <li>✓ Frete grátis no pedido inteiro</li>}
              {formData.include_bogo && <li>✓ Leve {formData.bogo_buy_quantity || '?'} pague {(formData.bogo_buy_quantity || 0) - (formData.bogo_get_quantity || 0) > 0 ? (formData.bogo_buy_quantity || 0) - (formData.bogo_get_quantity || 0) : '?'}</li>}
              {formData.include_first_order && <li>✓ Apenas para primeira compra</li>}
            </ul>
          </div>
        )}
      </div>
    </Card>
    </>
  );
}
