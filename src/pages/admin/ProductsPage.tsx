import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Plus, Search, Edit, Trash2, Grid, ArrowUp, ArrowDown, GripVertical, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useStoreAccess } from '@/hooks/useStoreAccess';

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_gallery: string[] | null;
  button_text: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  store_id: string;
  category_id: string | null;
  is_on_offer: boolean;
  original_price: number | null;
  offer_price: number | null;
}

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  store_id: string;
  products: ProductData[];
}

const ProductsPage = () => {
  usePageSEO({
    title: 'Produtos - Mostralo | Gerencie seu Cardápio',
    description: 'Gerencie todos os produtos do seu cardápio digital. Adicione, edite, organize categorias e configure preços facilmente.',
    keywords: 'gerenciar produtos, cardápio digital, adicionar produtos, categorias produtos, preços produtos'
  });

  // Hook de segurança - valida acesso à loja
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCategoriesAndProducts = async () => {
    if (!user || !validatedStoreId) return;

    try {
      // SEGURANÇA: Usar apenas o storeId validado pelo hook useStoreAccess
      const storeId = validatedStoreId;

      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar categorias.',
          variant: 'destructive'
        });
        return;
      }

      // Buscar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, is_on_offer, original_price, offer_price')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true });

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar produtos.',
          variant: 'destructive'
        });
        return;
      }

      // Organizar produtos por categoria
      const categoriesWithProducts: CategoryData[] = (categoriesData || []).map(category => ({
        ...category,
        products: (productsData || []).filter(product => product.category_id === category.id)
      }));

      // Adicionar produtos sem categoria
      const uncategorizedProducts = (productsData || []).filter(product => !product.category_id);
      if (uncategorizedProducts.length > 0) {
        categoriesWithProducts.unshift({
          id: 'uncategorized',
          name: 'Sem Categoria',
          description: 'Produtos que não foram categorizados',
          display_order: -1,
          is_active: true,
          store_id: validatedStoreId,
          products: uncategorizedProducts
        });
      }

      setCategories(categoriesWithProducts);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (validatedStoreId && !storeAccessLoading && hasAccess) {
      fetchCategoriesAndProducts();
    }
  }, [validatedStoreId, storeAccessLoading, hasAccess]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir produto.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso.',
      });

      fetchCategoriesAndProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir produto.',
        variant: 'destructive'
      });
    }
  };

  const handleEditProduct = (product: ProductData) => {
    setEditingProductId(product.id);
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingProductId(null);
    fetchCategoriesAndProducts();
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingProductId(null);
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar disponibilidade do produto.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: `Produto ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      fetchCategoriesAndProducts();
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar disponibilidade do produto.',
        variant: 'destructive'
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino ou se o item foi solto na mesma posição
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    try {
      const sourceCategory = categories.find(c => c.id === source.droppableId);
      const destinationCategory = categories.find(c => c.id === destination.droppableId);

      if (!sourceCategory || !destinationCategory) return;

      const product = sourceCategory.products.find(p => p.id === draggableId);
      if (!product) return;

      // Se mudou de categoria
      if (source.droppableId !== destination.droppableId) {
        const newCategoryId = destination.droppableId === 'uncategorized' ? null : destination.droppableId;
        
        // Atualizar a categoria do produto
        const { error } = await supabase
          .from('products')
          .update({ 
            category_id: newCategoryId,
            display_order: destination.index
          })
          .eq('id', draggableId);

        if (error) throw error;

        // Reordenar produtos na categoria de destino
        const destinationProducts = destinationCategory.products.slice();
        destinationProducts.splice(destination.index, 0, { ...product, category_id: newCategoryId });

        // Atualizar display_order dos produtos na categoria de destino
        for (let i = 0; i < destinationProducts.length; i++) {
          const prod = destinationProducts[i];
          if (prod.id !== draggableId) {
            await supabase
              .from('products')
              .update({ display_order: i })
              .eq('id', prod.id);
          }
        }

        toast({
          title: 'Sucesso',
          description: `Produto movido para ${destinationCategory.name}`,
        });
      } else {
        // Apenas reordenou dentro da mesma categoria
        const categoryProducts = sourceCategory.products.slice();
        const [movedProduct] = categoryProducts.splice(source.index, 1);
        categoryProducts.splice(destination.index, 0, movedProduct);

        // Atualizar display_order de todos os produtos na categoria
        for (let i = 0; i < categoryProducts.length; i++) {
          const prod = categoryProducts[i];
          await supabase
            .from('products')
            .update({ display_order: i })
            .eq('id', prod.id);
        }

        toast({
          title: 'Sucesso',
          description: 'Produto reordenado',
        });
      }

      // Atualizar os dados
      fetchCategoriesAndProducts();
    } catch (error) {
      console.error('Erro ao mover produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao mover produto',
        variant: 'destructive'
      });
    }
  };

  const moveCategoryUp = async (categoryIndex: number) => {
    if (categoryIndex === 0 || filteredCategories[categoryIndex].id === 'uncategorized') return;

    const currentCategory = filteredCategories[categoryIndex];
    const previousCategory = filteredCategories[categoryIndex - 1];

    if (previousCategory.id === 'uncategorized') return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: previousCategory.display_order })
        .eq('id', currentCategory.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', previousCategory.id);

      if (error2) throw error2;

      toast({
        title: 'Sucesso',
        description: 'Categoria movida para cima.',
      });

      fetchCategoriesAndProducts();
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
  };

  const moveCategoryDown = async (categoryIndex: number) => {
    if (categoryIndex === filteredCategories.length - 1 || filteredCategories[categoryIndex].id === 'uncategorized') return;

    const currentCategory = filteredCategories[categoryIndex];
    const nextCategory = filteredCategories[categoryIndex + 1];

    try {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: nextCategory.display_order })
        .eq('id', currentCategory.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', nextCategory.id);

      if (error2) throw error2;

      toast({
        title: 'Sucesso',
        description: 'Categoria movida para baixo.',
      });

      fetchCategoriesAndProducts();
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    products: category.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => 
    searchTerm === '' || 
    category.products.length > 0 || 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = categories.reduce((total, category) => total + category.products.length, 0);
  const activeProducts = categories.reduce((total, category) => 
    total + category.products.filter(p => p.is_available).length, 0);

  const statsCards = [
    {
      title: 'Total de Produtos',
      value: totalProducts,
      description: 'Produtos cadastrados',
      icon: Package
    },
    {
      title: 'Produtos Ativos',
      value: activeProducts,
      description: 'Disponíveis para venda',
      icon: Package
    },
    {
      title: 'Categorias',
      value: categories.length,
      description: 'Categorias ativas',
      icon: Grid
    }
  ];

  // Aguardar validação de acesso
  if (storeAccessLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  // Bloquear se não tem acesso
  if (!hasAccess || !validatedStoreId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Acesso Negado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Você não tem permissão para acessar os produtos. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  if (false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie os produtos da sua loja</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCategoryFormOpen(true)}
          >
            <Grid className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <Button onClick={() => navigate('/dashboard/products/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Lista de Produtos por Categoria */}
      <div className="space-y-4">
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
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          {/* Botões de reordenação de categoria */}
                          {category.id !== 'uncategorized' && (
                            <div className="flex flex-col items-center space-y-1 mr-2">
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
                          <Grid className="w-5 h-5 text-primary" />
                          <div className="text-left">
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mr-4">
                          <Badge variant="outline">
                            {category.products.length} produto{category.products.length !== 1 ? 's' : ''}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/products/new?category=${category.id}`);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
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
                                    <Card 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`overflow-hidden ${
                                        snapshot.isDragging 
                                          ? 'shadow-lg rotate-2 transform scale-105' 
                                          : ''
                                      }`}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-4">
                                          {/* Handle de drag */}
                                          <div 
                                            {...provided.dragHandleProps}
                                            className="flex flex-col items-center space-y-1 cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                            <span className="text-xs text-muted-foreground">#{product.display_order}</span>
                                          </div>

                                          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                            {product.image_url ? (
                                              <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-6 h-6 text-muted-foreground" />
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold truncate">{product.name}</h4>
                                                {product.is_on_offer && product.offer_price && (
                                                  <Badge variant="destructive" className="text-xs">
                                                    {Math.round((1 - product.offer_price / product.price) * 100)}% OFF
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex flex-col items-end flex-shrink-0">
                                                {product.is_on_offer && product.offer_price ? (
                                                  <>
                                                    <span className="text-sm text-muted-foreground line-through">
                                                      R$ {Number(product.price).toFixed(2)}
                                                    </span>
                                                    <span className="font-bold text-lg text-green-600">
                                                      R$ {Number(product.offer_price).toFixed(2)}
                                                    </span>
                                                  </>
                                                ) : (
                                                  <span className="font-bold text-lg text-primary">
                                                    R$ {Number(product.price).toFixed(2)}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {product.description && (
                                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                {product.description}
                                              </p>
                                            )}
                                            
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  checked={product.is_available}
                                                  onCheckedChange={() => handleToggleAvailability(product.id, product.is_available)}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                  {product.is_available ? 'Ativo' : 'Inativo'}
                                                </span>
                                              </div>
                                              <div className="flex space-x-2">
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => handleEditProduct(product)}
                                                >
                                                  <Edit className="w-4 h-4 mr-1" />
                                                  Editar
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => {
                                                    if (confirm('Tem certeza que deseja excluir este produto?')) {
                                                      handleDeleteProduct(product.id);
                                                    }
                                                  }}
                                                >
                                                  <Trash2 className="w-4 h-4 mr-1" />
                                                  Excluir
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
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
      </div>

      {/* Modal do formulário de categoria */}
      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSuccess={() => {
          setCategoryFormOpen(false);
          fetchCategoriesAndProducts();
        }}
      />

      {/* Modal do formulário de edição de produto */}
      {showEditForm && editingProductId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <ProductForm
              productId={editingProductId}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;