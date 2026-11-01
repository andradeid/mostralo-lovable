// Regras puras da lista de produtos do painel: agrupar por categoria, filtrar,
// ordenar e calcular o teto do filtro de preço. Mesma regra que ficava na ProductsPage.
import type { ProductFilters } from '@/components/admin/products/ProductFilters';
import type { CategoryData, ProductData, ProductSortMode } from '@/hooks/products/productsPageTypes';

// Organiza produtos por categoria (com "Sem Categoria" no topo quando houver)
export const organizeByCategory = (products: ProductData[], cats: CategoryData[], storeId: string): CategoryData[] => {
  const categoriesWithProducts: CategoryData[] = cats.map(category => ({
    ...category,
    products: products.filter(product => product.category_id === category.id)
  }));

  const uncategorizedProducts = products.filter(product => !product.category_id);
  if (uncategorizedProducts.length > 0) {
    categoriesWithProducts.unshift({
      id: 'uncategorized',
      name: 'Sem Categoria',
      description: 'Produtos que não foram categorizados',
      display_order: -1,
      is_active: true,
      store_id: storeId,
      products: uncategorizedProducts
    });
  }

  return categoriesWithProducts;
};

// Função para aplicar filtros aos produtos
export const applyProductFilters = (products: ProductData[], filters: ProductFilters): ProductData[] => {
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

// Categorias com os produtos filtrados e ordenados; some com as categorias vazias
export const filterAndSortCategories = (
  categories: CategoryData[],
  filters: ProductFilters,
  sortMode: ProductSortMode,
): CategoryData[] => categories.map(category => ({
  ...category,
  products: applyProductFilters(category.products, filters)
    .sort((a, b) => {
      if (sortMode === 'alphabetical') {
        return a.name.localeCompare(b.name, 'pt-BR');
      }
      return a.display_order - b.display_order;
    })
})).filter(category =>
  category.products.length > 0
);

// Calcular preço máximo para o slider de filtro
export const maxFilterPrice = (categories: CategoryData[]): number => {
  const allPrices = categories.flatMap(c => c.products.map(p =>
    p.is_on_offer && p.offer_price ? p.offer_price : p.price
  ));
  return Math.ceil(Math.max(...allPrices, 100) / 10) * 10;
};

// Ordenar produtos alfabeticamente (pt-BR para acentuação correta)
export const sortProductsAlphabetically = (products: ProductData[]): ProductData[] =>
  [...products].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );
