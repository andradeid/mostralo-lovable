import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { DeleteAllProductsDialog } from '@/components/admin/products/DeleteAllProductsDialog';
import { BulkImageSyncDialog } from '@/components/admin/products/BulkImageSyncDialog';
import { ProductFiltersComponent, ProductFilters, defaultFilters } from '@/components/admin/products/ProductFilters';
import { ActiveFiltersBar } from '@/components/admin/products/ActiveFiltersBar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Plus, Search, Edit, Trash2, Grid, ArrowUp, ArrowDown, GripVertical, AlertCircle, ArrowDownAZ, PackageX, Upload, ChevronDown, FileSpreadsheet, Star, ImagePlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  is_featured: boolean | null;
  show_in_menu: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  store_id: string;
  category_id: string | null;
  is_on_offer: boolean;
  original_price: number | null;
  offer_price: number | null;
  // Campos de estoque
  track_stock: boolean | null;
  stock_quantity: number | null;
  stock_alert_threshold: number | null;
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
  const { storeId: validatedStoreId, storeName, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'manual' | 'alphabetical'>('manual');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showImageSyncDialog, setShowImageSyncDialog] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const PAGE_SIZE = 100;
  
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCategoriesAndProducts = async (page: number = 0, append: boolean = false) => {
    if (!user || !validatedStoreId) return;

    if (page === 0) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // SEGURANÇA: Usar apenas o storeId validado pelo hook useStoreAccess
      const storeId = validatedStoreId;

      // Buscar categorias apenas na primeira página
      if (page === 0) {
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

        // Buscar total de produtos
        const { count: totalCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId);
        
        setTotalProductsCount(totalCount || 0);

        // Buscar total de produtos ATIVOS (disponíveis para venda)
        const { count: activeCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('is_available', true);
        
        setActiveProductsCount(activeCount || 0);
      }

      // Buscar produtos paginados
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, is_on_offer, original_price, offer_price, track_stock, stock_quantity, stock_alert_threshold, is_featured')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true })
        .range(from, to);

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar produtos.',
          variant: 'destructive'
        });
        return;
      }

      const newProducts = productsData || [];
      console.log(`[Produtos] Página ${page + 1}: carregados ${newProducts.length} produtos (${from}-${to})`);

      // Atualizar lista de produtos
      const updatedProducts = append ? [...allProducts, ...newProducts] : newProducts;
      setAllProducts(updatedProducts);
      setCurrentPage(page);
      setHasMoreProducts(newProducts.length === PAGE_SIZE);

      // Buscar categorias para organizar (ou usar as existentes)
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Organizar produtos por categoria
      const categoriesWithProducts: CategoryData[] = (categoriesData || []).map(category => ({
        ...category,
        products: updatedProducts.filter(product => product.category_id === category.id)
      }));

      // Adicionar produtos sem categoria
      const uncategorizedProducts = updatedProducts.filter(product => !product.category_id);
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
      setIsLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMoreProducts) {
      fetchCategoriesAndProducts(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (validatedStoreId && !storeAccessLoading && hasAccess) {
      setCurrentPage(0);
      setHasMoreProducts(true);
      setAllProducts([]);
      fetchCategoriesAndProducts(0, false);
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

      fetchCategoriesAndProducts(0, false);
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
    fetchCategoriesAndProducts(0, false);
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

      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar disponibilidade do produto.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleShowInMenu = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ show_in_menu: !currentStatus })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar visibilidade no cardápio.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: currentStatus 
          ? 'Produto ocultado do cardápio digital' 
          : 'Produto visível no cardápio digital',
      });

      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar visibilidade.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleFeatured = async (productId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !currentStatus })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar destaque do produto.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: !currentStatus 
          ? 'Produto marcado como destaque' 
          : 'Produto removido dos destaques',
      });

      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao atualizar destaque:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar destaque.',
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
      fetchCategoriesAndProducts(0, false);
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

      fetchCategoriesAndProducts(0, false);
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

      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
  };

  const applyAlphabeticalOrderToCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Ordenar produtos alfabeticamente (pt-BR para acentuação correta)
    const sortedProducts = [...category.products].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR')
    );

    try {
      // Atualizar display_order no banco de dados
      for (let i = 0; i < sortedProducts.length; i++) {
        await supabase
          .from('products')
          .update({ display_order: i })
          .eq('id', sortedProducts[i].id);
      }

      toast({
        title: 'Sucesso',
        description: `Produtos de "${category.name}" ordenados de A-Z!`,
      });

      // Recarregar dados
      await fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao ordenar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao ordenar produtos.',
        variant: 'destructive'
      });
    }
  };

  // Função para aplicar filtros aos produtos
  const applyProductFilters = (products: ProductData[]): ProductData[] => {
    return products.filter(product => {
      // Filtro por status
      if (filters.status === 'available' && !product.is_available) return false;
      if (filters.status === 'unavailable' && product.is_available) return false;
      if (filters.status === 'hidden' && (product.show_in_menu ?? true)) return false;
      
      // Filtro por estoque
      if (filters.stock === 'out_of_stock') {
        if (!product.track_stock || (product.stock_quantity ?? 0) > 0) return false;
      }
      if (filters.stock === 'low_stock') {
        if (!product.track_stock) return false;
        const threshold = product.stock_alert_threshold ?? 5;
        if ((product.stock_quantity ?? 0) === 0 || (product.stock_quantity ?? 0) > threshold) return false;
      }
      if (filters.stock === 'normal') {
        if (!product.track_stock) return false;
        const threshold = product.stock_alert_threshold ?? 5;
        if ((product.stock_quantity ?? 0) <= threshold) return false;
      }
      if (filters.stock === 'no_tracking') {
        if (product.track_stock) return false;
      }
      
      // Filtro por faixa de preço
      const productPrice = product.is_on_offer && product.offer_price 
        ? product.offer_price 
        : product.price;
      if (filters.priceRange.min !== null && productPrice < filters.priceRange.min) return false;
      if (filters.priceRange.max !== null && productPrice > filters.priceRange.max) return false;
      
      // Filtro por promoção
      if (filters.promotion === 'on_sale' && !product.is_on_offer) return false;
      if (filters.promotion === 'regular' && product.is_on_offer) return false;
      
      // Filtro por categorias
      if (filters.categories.length > 0) {
        if (!product.category_id || !filters.categories.includes(product.category_id)) return false;
      }
      
      // Filtro por imagem
      if (filters.hasImage === 'with_image' && !product.image_url) return false;
      if (filters.hasImage === 'without_image' && product.image_url) return false;
      
      // Filtro por destaque
      if (filters.featured === 'featured' && !product.is_featured) return false;
      if (filters.featured === 'not_featured' && product.is_featured) return false;
      
      return true;
    });
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    products: applyProductFilters(category.products)
      .filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        if (sortMode === 'alphabetical') {
          return a.name.localeCompare(b.name, 'pt-BR');
        }
        return a.display_order - b.display_order;
      })
  })).filter(category => 
    searchTerm === '' || 
    category.products.length > 0 || 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular totais para o contador
  const totalProducts = totalProductsCount; // Usar o total do banco
  const loadedProducts = allProducts.length; // Produtos carregados na memória
  const filteredProductsCount = filteredCategories.reduce((total, category) => total + category.products.length, 0);
  const activeProducts = activeProductsCount; // Usar o total do banco, não dos carregados

  // Calcular preço máximo para o slider de filtro
  const maxPrice = useMemo(() => {
    const allPrices = categories.flatMap(c => c.products.map(p => 
      p.is_on_offer && p.offer_price ? p.offer_price : p.price
    ));
    return Math.ceil(Math.max(...allPrices, 100) / 10) * 10;
  }, [categories]);

  // Lista de categorias para o filtro
  const categoryOptions = useMemo(() => 
    categories
      .filter(c => c.id !== 'uncategorized')
      .map(c => ({ id: c.id, name: c.name })),
    [categories]
  );

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
    <div className="space-y-4 md:space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os produtos da sua loja</p>
        </div>
          <div className="flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Importar</span>
                <span className="sm:hidden">Importar</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/dashboard/products/import')}>
                <Upload className="w-4 h-4 mr-2" />
                Importação Padrão (CSV/Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/products/import-alquimia')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar do Alquimia
              </DropdownMenuItem>
              {(userRole === 'store_admin' || userRole === 'master_admin') && totalProducts > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteAllDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Tudo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setCategoryFormOpen(true)}
          >
            <Grid className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nova Categoria</span>
            <span className="sm:hidden">Categoria</span>
          </Button>
          <Button 
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => navigate('/dashboard/products/new')}
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Produto</span>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas - Grid 2x2 em mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="p-3 md:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca e Ordenação - Empilhado em mobile */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as 'manual' | 'alphabetical')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                Manual
              </div>
            </SelectItem>
            <SelectItem value="alphabetical">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="w-4 h-4" />
                A-Z
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtros */}
      <ProductFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        categories={categoryOptions}
        maxPrice={maxPrice}
      />

      {/* Barra de Filtros Ativos */}
      <ActiveFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        categories={categoryOptions}
        totalProducts={totalProducts}
        filteredCount={filteredProductsCount}
      />

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
                    <AccordionTrigger className="px-3 md:px-6 py-3 md:py-4 hover:no-underline">
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
                                                {product.is_on_offer && product.offer_price ? (
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground line-through">
                                                      R$ {Number(product.price).toFixed(2)}
                                                    </span>
                                                    <span className="font-bold text-sm text-green-600">
                                                      R$ {Number(product.offer_price).toFixed(2)}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="font-bold text-sm text-primary">
                                                    R$ {Number(product.price).toFixed(2)}
                                                  </span>
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
                                                {product.is_on_offer && product.offer_price ? (
                                                  <>
                                                    <span className="text-xs text-muted-foreground line-through">
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
                                            
                                            {/* Descrição */}
                                            {product.description && (
                                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                {product.description}
                                              </p>
                                            )}
                                          </div>

                                          {/* Descrição mobile - texto quebra */}
                                          {product.description && (
                                            <p className="text-xs text-muted-foreground sm:hidden line-clamp-2">
                                              {product.description}
                                            </p>
                                          )}
                                        </div>
                                            
                                        {/* Switches e Botões - Layout responsivo */}
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

        {/* Botão de Carregar Mais */}
        {!loading && totalProducts > 0 && (
          <div className="flex flex-col items-center gap-4 py-6 border-t mt-6">
            <div className="text-sm text-muted-foreground">
              Exibindo <strong className="text-foreground">{loadedProducts}</strong> de{' '}
              <strong className="text-foreground">{totalProducts}</strong> produtos
            </div>
            
            {hasMoreProducts && (
              <Button
                variant="outline"
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
                className="min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Carregar mais {PAGE_SIZE} produtos
                  </>
                )}
              </Button>
            )}

            {!hasMoreProducts && loadedProducts === totalProducts && (
              <p className="text-sm text-muted-foreground">
                ✓ Todos os {totalProducts} produtos carregados
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal do formulário de categoria */}
      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSuccess={() => {
          setCategoryFormOpen(false);
          fetchCategoriesAndProducts(0, false);
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

      {/* Modal de exclusão em massa */}
      {validatedStoreId && storeName && (
        <DeleteAllProductsDialog
          open={showDeleteAllDialog}
          onOpenChange={setShowDeleteAllDialog}
          storeId={validatedStoreId}
          storeName={storeName}
          productsCount={totalProducts}
          categoriesCount={categories.filter(c => c.id !== 'uncategorized').length}
          onSuccess={() => fetchCategoriesAndProducts(0, false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;