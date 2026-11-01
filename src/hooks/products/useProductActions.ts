// Ações da lista de produtos do painel: excluir, duplicar, editar (modal), adicionais,
// chaves (ativo/cardápio/destaque), arrastar, ordem das categorias e A-Z.
// Código movido da ProductsPage sem mudança.
import { useState, useCallback } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { supabase } from '@/integrations/supabase/client';
import type { useToast } from '@/hooks/use-toast';
import { sortProductsAlphabetically } from '@/lib/products/productsList';
import type { CategoryData, ProductData } from './productsPageTypes';
import type { FetchCategoriesAndProducts } from './useProductsCatalog';

interface Params {
  toast: ReturnType<typeof useToast>['toast'];
  categories: CategoryData[];
  filteredCategories: CategoryData[];
  fetchCategoriesAndProducts: FetchCategoriesAndProducts;
}

export function useProductActions({ toast, categories, filteredCategories, fetchCategoriesAndProducts }: Params) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

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

  const handleDuplicateProduct = async (productId: string, productName: string) => {
    try {
      toast({
        title: 'Duplicando...',
        description: `Duplicando produto "${productName}"...`,
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
        return;
      }

      const response = await supabase.functions.invoke('duplicate-product', {
        body: { productId },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Sucesso',
        description: `Produto "${productName}" duplicado com sucesso!`,
      });

      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao duplicar produto.',
        variant: 'destructive',
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

  // Adicionar categoria de adicional ao produto diretamente
  const handleAddAddonCategory = useCallback(async (productId: string, addonCategoryId: string) => {
    try {
      // Buscar todos os addons dessa categoria
      const { data: addonsData } = await supabase
        .from('addons')
        .select('id')
        .eq('category_id', addonCategoryId);

      if (!addonsData || addonsData.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum adicional nesta categoria.' });
        return;
      }

      // Buscar addons já vinculados ao produto para evitar duplicatas
      const { data: existingAddons } = await supabase
        .from('product_addons')
        .select('addon_id')
        .eq('product_id', productId);

      const existingIds = new Set((existingAddons || []).map(a => a.addon_id));
      const newAddons = addonsData.filter(a => !existingIds.has(a.id));

      if (newAddons.length > 0) {
        const { error } = await supabase
          .from('product_addons')
          .insert(newAddons.map(a => ({
            product_id: productId,
            addon_id: a.id,
            is_required: false,
            max_quantity: 1,
          })));

        if (error) throw error;
      }

      toast({ title: 'Sucesso', description: 'Adicional vinculado ao produto!' });
      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao adicionar adicional:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar o adicional.', variant: 'destructive' });
    }
  }, [toast, fetchCategoriesAndProducts]); // recarrega com a loja e a busca atuais

  // Remover categoria de adicional do produto
  const handleRemoveAddonCategory = useCallback(async (productId: string, addonCategoryId: string) => {
    try {
      // Buscar todos os addons dessa categoria
      const { data: addonsData } = await supabase
        .from('addons')
        .select('id')
        .eq('category_id', addonCategoryId);

      if (addonsData && addonsData.length > 0) {
        const addonIds = addonsData.map(a => a.id);
        const { error } = await supabase
          .from('product_addons')
          .delete()
          .eq('product_id', productId)
          .in('addon_id', addonIds);

        if (error) throw error;
      }

      toast({ title: 'Sucesso', description: 'Adicional removido do produto!' });
      fetchCategoriesAndProducts(0, false);
    } catch (error) {
      console.error('Erro ao remover adicional:', error);
      toast({ title: 'Erro', description: 'Não foi possível remover o adicional.', variant: 'destructive' });
    }
  }, [toast, fetchCategoriesAndProducts]);

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

  /**
   * Sobe/desce a categoria entre as vizinhas reais (lista completa, sem o filtro da busca)
   * e renumera a ordem (0, 1, 2...), para funcionar mesmo com ordens repetidas.
   */
  const moveCategory = async (categoryIndex: number, direction: -1 | 1) => {
    const target = filteredCategories[categoryIndex];
    if (!target || target.id === 'uncategorized') return;
    const ordered = categories.filter(c => c.id !== 'uncategorized');
    const from = ordered.findIndex(c => c.id === target.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ordered.length) return;

    const next = [...ordered];
    [next[from], next[to]] = [next[to], next[from]];
    const changed = next
      .map((c, i) => ({ id: c.id, display_order: i, before: c.display_order }))
      .filter(c => c.before !== c.display_order);

    try {
      for (const c of changed) {
        const { error } = await supabase
          .from('categories')
          .update({ display_order: c.display_order })
          .eq('id', c.id);
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: direction < 0 ? 'Categoria movida para cima.' : 'Categoria movida para baixo.',
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

  const moveCategoryUp = (categoryIndex: number) => moveCategory(categoryIndex, -1);
  const moveCategoryDown = (categoryIndex: number) => moveCategory(categoryIndex, 1);

  const applyAlphabeticalOrderToCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Ordenar produtos alfabeticamente (pt-BR para acentuação correta)
    const sortedProducts = sortProductsAlphabetically(category.products);

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

  return {
    editingProductId,
    showEditForm,
    handleDeleteProduct,
    handleDuplicateProduct,
    handleEditProduct,
    handleEditSuccess,
    handleEditCancel,
    handleAddAddonCategory,
    handleRemoveAddonCategory,
    handleToggleAvailability,
    handleToggleShowInMenu,
    handleToggleFeatured,
    onDragEnd,
    moveCategoryUp,
    moveCategoryDown,
    applyAlphabeticalOrderToCategory,
  };
}

export type ProductActions = ReturnType<typeof useProductActions>;
