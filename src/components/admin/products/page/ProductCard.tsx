// Card arrastável de um produto na lista do painel: imagem, nome, selos, preço
// (com edição inline) e descrição; as chaves e botões ficam em ProductCardControls.
import type { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ProductDescription } from '@/components/ProductDescription';
import { Loader2, Package, GripVertical, AlertCircle, PackageX, Star, X, Pencil, Check } from 'lucide-react';
import { brl } from '@/lib/brl';
import type { AddonCategoryInfo, ProductData, ProductSortMode } from '@/hooks/products/productsPageTypes';
import type { ProductPriceEdit } from '@/hooks/products/useProductPriceEdit';
import type { ProductActions } from '@/hooks/products/useProductActions';
import { ProductCardControls } from './ProductCardControls';

interface Props {
  product: ProductData;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  sortMode: ProductSortMode;
  priceEdit: ProductPriceEdit;
  actions: ProductActions;
  allAddonCategories: AddonCategoryInfo[];
}

export function ProductCard({ product, provided, snapshot, sortMode, priceEdit, actions, allAddonCategories }: Props) {
  const {
    editingPriceProductId,
    editingPriceValue,
    setEditingPriceValue,
    savingPrice,
    priceConfirmStep,
    setPriceConfirmStep,
    handleStartPriceEdit,
    handleCancelPriceEdit,
    handlePriceKeyDown,
    handleConfirmPriceEdit,
  } = priceEdit;

  return (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`overflow-hidden w-[85%] sm:w-full mx-auto ${
                                        snapshot.isDragging
                                          ? 'shadow-lg rotate-2 transform scale-105'
                                          : ''
                                      }`}
                                    >
                                       <CardContent className="p-3 md:p-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          {/* Imagem + Handle de drag */}
                                          <div className="flex items-start gap-2">
                                            {/* Handle de drag - oculto em mobile */}
                                            {sortMode === 'manual' && (
                                              <div
                                                {...provided.dragHandleProps}
                                                className="hidden sm:flex flex-col items-center space-y-1 cursor-grab active:cursor-grabbing"
                                              >
                                                <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground hover:text-primary transition-colors" />
                                                <span className="text-xs text-muted-foreground">#{product.display_order}</span>
                                              </div>
                                            )}

                                            {/* Imagem do produto */}
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                              {product.image_url ? (
                                                <img
                                                  src={product.image_url}
                                                  alt={product.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <Package className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                                                </div>
                                              )}
                                            </div>

                                            {/* Info mobile - ao lado da imagem */}
                                            <div className="flex-1 sm:hidden">
                                              <h4 className="font-semibold text-sm leading-tight">{product.name}</h4>
                                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                {/* Badge de Destaque Mobile */}
                                                {product.is_featured && (
                                                  <Badge variant="outline" className="text-[10px] border-yellow-400 text-yellow-600 bg-yellow-50">
                                                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                                  </Badge>
                                                )}
                                                {product.is_on_offer && product.offer_price && (
                                                  <Badge variant="destructive" className="text-[10px]">
                                                    {Math.round((1 - product.offer_price / product.price) * 100)}% OFF
                                                  </Badge>
                                                )}
                                                {/* Badge de Estoque Mobile */}
                                                {product.track_stock && (
                                                  <Badge
                                                    variant={
                                                      (product.stock_quantity ?? 0) <= 0 ? 'destructive' :
                                                      (product.stock_quantity ?? 0) <= (product.stock_alert_threshold ?? 5) ? 'secondary' :
                                                      'outline'
                                                    }
                                                    className="text-[10px]"
                                                  >
                                                    {(product.stock_quantity ?? 0) <= 0 ? (
                                                      <span className="flex items-center gap-0.5">
                                                        <PackageX className="w-2.5 h-2.5" /> Esgotado
                                                      </span>
                                                    ) : (
                                                      <span>{product.stock_quantity} un.</span>
                                                    )}
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="mt-1">
                                                {editingPriceProductId === product.id ? (
                                                  <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                      <CurrencyInput
                                                        value={editingPriceValue}
                                                        onChange={(v) => { setEditingPriceValue(v); setPriceConfirmStep(false); }}
                                                        onKeyDown={(e) => handlePriceKeyDown(e, product.id)}
                                                        className="h-7 w-24 text-xs"
                                                        autoFocus
                                                      />
                                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => priceConfirmStep ? handleConfirmPriceEdit(product.id) : setPriceConfirmStep(true)} disabled={savingPrice}>
                                                        {savingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                      </Button>
                                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={handleCancelPriceEdit}>
                                                        <X className="w-3 h-3" />
                                                      </Button>
                                                    </div>
                                                    {priceConfirmStep && (
                                                      <span className="text-[10px] text-amber-600 font-medium animate-in fade-in">Pressione Enter para confirmar</span>
                                                    )}
                                                  </div>
                                                ) : product.is_on_offer && product.offer_price ? (
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground line-through">
                                                      {brl(Number(product.price))}
                                                    </span>
                                                    <span className="font-bold text-sm text-green-600">
                                                      {brl(Number(product.offer_price))}
                                                    </span>
                                                    <button onClick={() => handleStartPriceEdit(product)} className="text-muted-foreground hover:text-primary" title="Editar preço">
                                                      <Pencil className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center gap-1">
                                                    <span className="font-bold text-sm text-primary">
                                                      {brl(Number(product.price))}
                                                    </span>
                                                    <button onClick={() => handleStartPriceEdit(product)} className="text-muted-foreground hover:text-primary" title="Editar preço">
                                                      <Pencil className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Conteúdo do produto - desktop */}
                                          <div className="flex-1 min-w-0 hidden sm:block">
                                            {/* Nome e Preço */}
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1">
                                                  <h4 className="font-semibold text-base">{product.name}</h4>
                                                  {/* Badge de Destaque */}
                                                  {product.is_featured && (
                                                    <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600 bg-yellow-50">
                                                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                                      Destaque
                                                    </Badge>
                                                  )}
                                                  {product.is_on_offer && product.offer_price && (
                                                    <Badge variant="destructive" className="text-xs">
                                                      {Math.round((1 - product.offer_price / product.price) * 100)}%
                                                    </Badge>
                                                  )}
                                                  {/* Badge de Estoque Desktop */}
                                                  {product.track_stock && (
                                                    <Badge
                                                      variant={
                                                        (product.stock_quantity ?? 0) <= 0 ? 'destructive' :
                                                        (product.stock_quantity ?? 0) <= (product.stock_alert_threshold ?? 5) ? 'secondary' :
                                                        'outline'
                                                      }
                                                      className="text-xs"
                                                    >
                                                      {(product.stock_quantity ?? 0) <= 0 ? (
                                                        <span className="flex items-center gap-1">
                                                          <PackageX className="w-3 h-3" /> Sem estoque
                                                        </span>
                                                      ) : (product.stock_quantity ?? 0) <= (product.stock_alert_threshold ?? 5) ? (
                                                        <span className="flex items-center gap-1">
                                                          <AlertCircle className="w-3 h-3" /> {product.stock_quantity} un.
                                                        </span>
                                                      ) : (
                                                        <span>Estoque: {product.stock_quantity}</span>
                                                      )}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end flex-shrink-0">
                                                {editingPriceProductId === product.id ? (
                                                  <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1">
                                                      <CurrencyInput
                                                        value={editingPriceValue}
                                                        onChange={(v) => { setEditingPriceValue(v); setPriceConfirmStep(false); }}
                                                        onKeyDown={(e) => handlePriceKeyDown(e, product.id)}
                                                        className="h-8 w-28 text-sm"
                                                        autoFocus
                                                      />
                                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => priceConfirmStep ? handleConfirmPriceEdit(product.id) : setPriceConfirmStep(true)} disabled={savingPrice}>
                                                        {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                      </Button>
                                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={handleCancelPriceEdit}>
                                                        <X className="w-4 h-4" />
                                                      </Button>
                                                    </div>
                                                    {priceConfirmStep && (
                                                      <span className="text-xs text-amber-600 font-medium animate-in fade-in">Pressione Enter para confirmar</span>
                                                    )}
                                                  </div>
                                                ) : product.is_on_offer && product.offer_price ? (
                                                  <>
                                                    <span className="text-xs text-muted-foreground line-through">
                                                      {brl(Number(product.price))}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                      <span className="font-bold text-lg text-green-600">
                                                        {brl(Number(product.offer_price))}
                                                      </span>
                                                      <button onClick={() => handleStartPriceEdit(product)} className="text-muted-foreground hover:text-primary" title="Editar preço">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  </>
                                                ) : (
                                                  <div className="flex items-center gap-1">
                                                    <span className="font-bold text-lg text-primary">
                                                      {brl(Number(product.price))}
                                                    </span>
                                                    <button onClick={() => handleStartPriceEdit(product)} className="text-muted-foreground hover:text-primary" title="Editar preço">
                                                      <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Descrição */}
                                            {product.description && (
                                              <ProductDescription description={product.description} className="text-sm text-muted-foreground mb-2 line-clamp-2" />
                                            )}
                                          </div>

                                          {product.description && (
                                            <div className="sm:hidden">
                                              <ProductDescription description={product.description} className="text-xs text-muted-foreground line-clamp-2" />
                                            </div>
                                          )}
                                        </div>

                                        {/* Switches e Botões - Layout responsivo */}
                                        <ProductCardControls product={product} actions={actions} allAddonCategories={allAddonCategories} />
                                      </CardContent>
                                    </Card>
  );
}
