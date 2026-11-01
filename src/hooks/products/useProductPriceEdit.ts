// Edição inline de preço na lista de produtos do painel (Enter duas vezes para gravar).
// Código movido da ProductsPage sem mudança.
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { useToast } from '@/hooks/use-toast';
import type { CategoryData, ProductData } from './productsPageTypes';

interface Params {
  toast: ReturnType<typeof useToast>['toast'];
  setAllProducts: Dispatch<SetStateAction<ProductData[]>>;
  setCategories: Dispatch<SetStateAction<CategoryData[]>>;
}

export function useProductPriceEdit({ toast, setAllProducts, setCategories }: Params) {
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceConfirmStep, setPriceConfirmStep] = useState(false);

  // Edição inline de preço
  const handleStartPriceEdit = (product: ProductData) => {
    setEditingPriceProductId(product.id);
    setEditingPriceValue(product.price);
    setPriceConfirmStep(false);
  };

  const handleCancelPriceEdit = () => {
    setEditingPriceProductId(null);
    setEditingPriceValue(0);
    setPriceConfirmStep(false);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!priceConfirmStep) {
        setPriceConfirmStep(true);
      } else {
        handleConfirmPriceEdit(productId);
      }
    } else if (e.key === 'Escape') {
      handleCancelPriceEdit();
    }
    // Se estava no passo de confirmação e digitou outra coisa, volta pro passo de edição
    if (priceConfirmStep && e.key !== 'Enter' && e.key !== 'Escape') {
      setPriceConfirmStep(false);
    }
  };

  const handleConfirmPriceEdit = async (productId: string) => {
    if (savingPrice) return;
    setSavingPrice(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ price: editingPriceValue })
        .eq('id', productId);

      if (error) throw error;

      setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, price: editingPriceValue } : p));
      setCategories(prev => prev.map(cat => ({
        ...cat,
        products: cat.products.map(p => p.id === productId ? { ...p, price: editingPriceValue } : p)
      })));

      toast({ title: 'Preço atualizado!' });
      setEditingPriceProductId(null);
      setPriceConfirmStep(false);
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      toast({ title: 'Erro', description: 'Erro ao atualizar preço.', variant: 'destructive' });
    } finally {
      setSavingPrice(false);
    }
  };

  return {
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
  };
}

export type ProductPriceEdit = ReturnType<typeof useProductPriceEdit>;
