// Rodapé do card de produto: chaves (ativo, cardápio, destaque), tipos de adicionais
// e botões Editar / Duplicar / Excluir.
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Edit, Trash2, Star, Copy, X } from 'lucide-react';
import type { AddonCategoryInfo, ProductData } from '@/hooks/products/productsPageTypes';
import type { ProductActions } from '@/hooks/products/useProductActions';

interface Props {
  product: ProductData;
  actions: ProductActions;
  allAddonCategories: AddonCategoryInfo[];
}

export function ProductCardControls({ product, actions, allAddonCategories }: Props) {
  const {
    handleToggleAvailability,
    handleToggleShowInMenu,
    handleToggleFeatured,
    handleRemoveAddonCategory,
    handleAddAddonCategory,
    handleEditProduct,
    handleDuplicateProduct,
    handleDeleteProduct,
  } = actions;

  // Switches e Botões - Layout responsivo
  return (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                                          {/* Switches */}
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                              <Switch
                                                checked={product.is_available}
                                                onCheckedChange={() => handleToggleAvailability(product.id, product.is_available)}
                                                className="scale-90"
                                              />
                                              <span className="text-xs text-muted-foreground">
                                                {product.is_available ? 'Ativo' : 'Inativo'}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                              <Switch
                                                checked={!(product.show_in_menu ?? true)}
                                                onCheckedChange={() => handleToggleShowInMenu(product.id, product.show_in_menu ?? true)}
                                                className="scale-90"
                                              />
                                              <span className="text-xs text-muted-foreground">
                                                {!(product.show_in_menu ?? true) ? 'Oculto' : 'Cardápio'}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                              <Switch
                                                checked={product.is_featured ?? false}
                                                onCheckedChange={() => handleToggleFeatured(product.id, product.is_featured)}
                                                className="scale-90"
                                              />
                                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                                <Star className={`w-3 h-3 ${product.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                Destaque
                                              </span>
                                            </div>

                                            {/* Tipos de Adicionais */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              {product.addon_category_names && product.addon_category_names.length > 0 && (
                                                product.addon_category_names.map((name, idx) => {
                                                  const catId = product.addon_category_ids?.[idx];
                                                  return (
                                                    <Badge key={name} variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary flex items-center gap-0.5">
                                                      {name}
                                                      {catId && (
                                                        <button
                                                          onClick={(e) => { e.stopPropagation(); handleRemoveAddonCategory(product.id, catId); }}
                                                          className="ml-0.5 hover:text-destructive"
                                                          title="Remover adicional"
                                                        >
                                                          <X className="w-2.5 h-2.5" />
                                                        </button>
                                                      )}
                                                    </Badge>
                                                  );
                                                })
                                              )}
                                              {(() => {
                                                const usedIds = new Set(product.addon_category_ids || []);
                                                const available = allAddonCategories.filter(ac => !usedIds.has(ac.id));
                                                if (available.length === 0) return null;
                                                return (
                                                  <Popover>
                                                    <PopoverTrigger asChild>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-5 w-5 p-0 border-primary/30 text-primary hover:bg-primary/10"
                                                        title="Adicionar categoria de adicional"
                                                      >
                                                        <Plus className="w-3 h-3" />
                                                      </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-48 p-1" align="start">
                                                      <div className="space-y-0.5">
                                                        {available.map(ac => (
                                                          <button
                                                            key={ac.id}
                                                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors"
                                                            onClick={() => handleAddAddonCategory(product.id, ac.id)}
                                                          >
                                                            {ac.name}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </PopoverContent>
                                                  </Popover>
                                                );
                                              })()}
                                            </div>
                                          </div>

                                          {/* Botões de Ação */}
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs flex-1 sm:flex-none"
                                              onClick={() => handleEditProduct(product)}
                                            >
                                              <Edit className="w-3 h-3 mr-1" />
                                              Editar
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs flex-1 sm:flex-none"
                                              onClick={() => handleDuplicateProduct(product.id, product.name)}
                                            >
                                              <Copy className="w-3 h-3 mr-1" />
                                              Duplicar
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs flex-1 sm:flex-none"
                                              onClick={() => {
                                                if (confirm('Tem certeza que deseja excluir este produto?')) {
                                                  handleDeleteProduct(product.id);
                                                }
                                              }}
                                            >
                                              <Trash2 className="w-3 h-3 mr-1" />
                                              Excluir
                                            </Button>
                                          </div>
                                        </div>
  );
}
