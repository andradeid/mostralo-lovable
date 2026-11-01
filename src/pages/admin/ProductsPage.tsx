import { useState, useMemo } from 'react';
import { ProductFiltersComponent, ProductFilters, defaultFilters } from '@/components/admin/products/ProductFilters';
import { ActiveFiltersBar } from '@/components/admin/products/ActiveFiltersBar';
import { useAuth } from '@/hooks/use-auth';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2, AlertCircle } from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useProductsCatalog, PAGE_SIZE } from '@/hooks/products/useProductsCatalog';
import { useProductPriceEdit } from '@/hooks/products/useProductPriceEdit';
import { useProductActions } from '@/hooks/products/useProductActions';
import type { ProductSortMode } from '@/hooks/products/productsPageTypes';
import { filterAndSortCategories, maxFilterPrice } from '@/lib/products/productsList';
import { ProductsPageHeader } from '@/components/admin/products/page/ProductsPageHeader';
import { ProductsStatsCards } from '@/components/admin/products/page/ProductsStatsCards';
import { ProductsSearchBar } from '@/components/admin/products/page/ProductsSearchBar';
import { ProductsCategoryList } from '@/components/admin/products/page/ProductsCategoryList';
import { ProductsLoadMore } from '@/components/admin/products/page/ProductsLoadMore';
import { ProductsDialogs } from '@/components/admin/products/page/ProductsDialogs';

// Tela de produtos do painel. Só orquestra: lógica em src/hooks/products/,
// regras puras em src/lib/products/ e telas em src/components/admin/products/page/.
const ProductsPage = () => {
  usePageSEO({
    title: 'Produtos - Mostralo | Gerencie seu Cardápio',
    description: 'Gerencie todos os produtos do seu cardápio digital. Adicione, edite, organize categorias e configure preços facilmente.',
    keywords: 'gerenciar produtos, cardápio digital, adicionar produtos, categorias produtos, preços produtos'
  });

  // Hook de segurança - valida acesso à loja
  const { storeId: validatedStoreId, storeName, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();

  const [sortMode, setSortMode] = useState<ProductSortMode>('manual');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showImageSyncDialog, setShowImageSyncDialog] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);

  const { user, userRole } = useAuth();

  const catalog = useProductsCatalog({ user, validatedStoreId, storeAccessLoading, hasAccess });
  const { toast, categories, setCategories, loading, searchTerm, setSearchTerm, debouncedSearch, allProducts, setAllProducts, fetchCategoriesAndProducts } = catalog;

  const filteredCategories = filterAndSortCategories(categories, filters, sortMode);

  const priceEdit = useProductPriceEdit({ toast, setAllProducts, setCategories });
  const actions = useProductActions({ toast, categories, filteredCategories, fetchCategoriesAndProducts });

  // Calcular totais para o contador
  const totalProducts = catalog.totalProductsCount; // Usar o total do banco
  const loadedProducts = allProducts.length; // Produtos carregados na memória
  const filteredProductsCount = filteredCategories.reduce((total, category) => total + category.products.length, 0);
  const activeProducts = catalog.activeProductsCount; // Usar o total do banco, não dos carregados

  // Calcular preço máximo para o slider de filtro
  const maxPrice = useMemo(() => maxFilterPrice(categories), [categories]);

  // Lista de categorias para o filtro
  const categoryOptions = useMemo(() =>
    categories
      .filter(c => c.id !== 'uncategorized')
      .map(c => ({ id: c.id, name: c.name })),
    [categories]
  );

  // Aguardar validação de acesso (sem loja ativa, não fica carregando para sempre)
  if (storeAccessLoading || (loading && hasAccess && !!validatedStoreId)) {
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
      <ProductsPageHeader
        userRole={userRole}
        totalProducts={totalProducts}
        onOpenImageSync={() => setShowImageSyncDialog(true)}
        onOpenDeleteAll={() => setShowDeleteAllDialog(true)}
        onOpenCategoryForm={() => setCategoryFormOpen(true)}
      />

      {/* Cards de Estatísticas - Grid 2x2 em mobile */}
      <ProductsStatsCards totalProducts={totalProducts} activeProducts={activeProducts} categoriesCount={categories.length} />

      {/* Busca e Ordenação - Empilhado em mobile */}
      <ProductsSearchBar
        searchTerm={searchTerm}
        debouncedSearch={debouncedSearch}
        setSearchTerm={setSearchTerm}
        sortMode={sortMode}
        setSortMode={setSortMode}
      />

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
        <ProductsCategoryList
          filteredCategories={filteredCategories}
          searchTerm={searchTerm}
          sortMode={sortMode}
          priceEdit={priceEdit}
          actions={actions}
          allAddonCategories={catalog.allAddonCategories}
        />

        {/* Botão de Carregar Mais */}
        {!loading && totalProducts > 0 && (
          <ProductsLoadMore
            loadedProducts={loadedProducts}
            totalProducts={totalProducts}
            hasMoreProducts={catalog.hasMoreProducts}
            isLoadingMore={catalog.isLoadingMore}
            loadMoreProducts={catalog.loadMoreProducts}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>

      <ProductsDialogs
        categoryFormOpen={categoryFormOpen}
        setCategoryFormOpen={setCategoryFormOpen}
        showDeleteAllDialog={showDeleteAllDialog}
        setShowDeleteAllDialog={setShowDeleteAllDialog}
        showImageSyncDialog={showImageSyncDialog}
        setShowImageSyncDialog={setShowImageSyncDialog}
        validatedStoreId={validatedStoreId}
        storeName={storeName}
        totalProducts={totalProducts}
        categories={categories}
        actions={actions}
        fetchCategoriesAndProducts={fetchCategoriesAndProducts}
      />
    </div>
  );
};

export default ProductsPage;
