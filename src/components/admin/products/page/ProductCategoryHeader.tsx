// Cabeçalho de uma categoria no acordeão de produtos: subir/descer, nome,
// contador de itens, ordenar A-Z e adicionar produto.
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Grid, ArrowUp, ArrowDown, ArrowDownAZ } from 'lucide-react';
import type { CategoryData } from '@/hooks/products/productsPageTypes';
import type { ProductActions } from '@/hooks/products/useProductActions';

interface Props {
  category: CategoryData;
  categoryIndex: number;
  filteredCategories: CategoryData[];
  actions: ProductActions;
}

export function ProductCategoryHeader({ category, categoryIndex, filteredCategories, actions }: Props) {
  const navigate = useNavigate();
  const { moveCategoryUp, moveCategoryDown, applyAlphabeticalOrderToCategory } = actions;

  return (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {/* Botões de reordenação - ocultos em mobile */}
                          {category.id !== 'uncategorized' && (
                            <div className="hidden sm:flex flex-col items-center space-y-1 mr-2">
                              <span className="text-xs text-muted-foreground">#{category.display_order}</span>
                              <div className="flex flex-col space-y-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  disabled={categoryIndex === 0 || (categoryIndex === 1 && filteredCategories[0].id === 'uncategorized')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveCategoryUp(categoryIndex);
                                  }}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  disabled={categoryIndex === filteredCategories.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveCategoryDown(categoryIndex);
                                  }}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <Grid className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                          <div className="text-left min-w-0 max-w-[140px] sm:max-w-none">
                            <h3 className="font-semibold text-sm md:text-lg truncate">{category.name}</h3>
                            {category.description && (
                              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1 hidden sm:block">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-0 sm:mr-4 ml-6 sm:ml-0">
                          <Badge variant="outline" className="text-xs">
                            {category.products.length} {category.products.length !== 1 ? 'itens' : 'item'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyAlphabeticalOrderToCategory(category.id);
                            }}
                            title="Ordenar produtos de A-Z"
                          >
                            <ArrowDownAZ className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs sm:h-8 sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/products/new?category=${category.id}`);
                            }}
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">Adicionar</span>
                          </Button>
                        </div>
                      </div>
  );
}
