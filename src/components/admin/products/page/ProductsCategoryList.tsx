// Lista de produtos por categoria (acordeão com arrastar e soltar) ou estado vazio.
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Package, Plus } from 'lucide-react';
import type { AddonCategoryInfo, CategoryData, ProductSortMode } from '@/hooks/products/productsPageTypes';
import type { ProductPriceEdit } from '@/hooks/products/useProductPriceEdit';
import type { ProductActions } from '@/hooks/products/useProductActions';
import { ProductCategoryHeader } from './ProductCategoryHeader';
import { ProductCard } from './ProductCard';

interface Props {
  filteredCategories: CategoryData[];
  searchTerm: string;
  sortMode: ProductSortMode;
  priceEdit: ProductPriceEdit;
  actions: ProductActions;
  allAddonCategories: AddonCategoryInfo[];
}

export function ProductsCategoryList({ filteredCategories, searchTerm, sortMode, priceEdit, actions, allAddonCategories }: Props) {
  const navigate = useNavigate();
  const { onDragEnd } = actions;

  return (
    <>
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Tente ajustar os termos de busca.'
                    : 'Comece adicionando produtos à sua loja.'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => navigate('/dashboard/products/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Produto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Accordion type="multiple" className="space-y-4" defaultValue={filteredCategories.map(c => c.id)}>
              {filteredCategories.map((category, categoryIndex) => (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                  <Card>
                    <AccordionTrigger className="px-3 md:px-6 py-3 md:py-4 hover:no-underline">
                      <ProductCategoryHeader
                        category={category}
                        categoryIndex={categoryIndex}
                        filteredCategories={filteredCategories}
                        actions={actions}
                      />
                    </AccordionTrigger>

                    <AccordionContent className="px-6 pb-6">
                      {category.products.length === 0 ? (
                        <Droppable droppableId={category.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`text-center py-8 min-h-[120px] rounded-lg border-2 border-dashed transition-colors ${
                                snapshot.isDraggingOver
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted-foreground/30'
                              }`}
                            >
                              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                              <p className="text-muted-foreground mb-4">
                                {snapshot.isDraggingOver
                                  ? 'Solte o produto aqui'
                                  : 'Nenhum produto nesta categoria'
                                }
                              </p>
                              {!snapshot.isDraggingOver && (
                                <Button
                                  variant="outline"
                                  onClick={() => navigate(`/dashboard/products/new?category=${category.id}`)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Primeiro Produto
                                </Button>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <Droppable droppableId={category.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`space-y-3 ${
                                snapshot.isDraggingOver
                                  ? 'bg-primary/5 rounded-lg p-2 border-2 border-dashed border-primary'
                                  : ''
                              }`}
                            >
                              {category.products.map((product, productIndex) => (
                                <Draggable key={product.id} draggableId={product.id} index={productIndex}>
                                  {(provided, snapshot) => (
                                    <ProductCard
                                      product={product}
                                      provided={provided}
                                      snapshot={snapshot}
                                      sortMode={sortMode}
                                      priceEdit={priceEdit}
                                      actions={actions}
                                      allAddonCategories={allAddonCategories}
                                    />
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </DragDropContext>
        )}
    </>
  );
}
