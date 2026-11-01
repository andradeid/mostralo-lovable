// Adicionais escolhidos na página do produto (quantidade por adicional, limite por categoria).
import { useState } from 'react';
import type { useToast } from '@/hooks/use-toast';
import {
  calculateAddonsPrice as addonsPriceOf,
  nextAddonSelections,
  validateRequiredAddons as requiredAddonsOk,
} from '@/lib/productPage/pricing';
import type { AddonCategory, SelectedAddons } from '@/lib/productPage/types';

export type Toast = ReturnType<typeof useToast> extends { toast: infer T } ? T : never;

export function useProductAddons(addonCategories: AddonCategory[], toast: Toast) {
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddons>({});

  const handleAddonQuantityChange = (categoryId: string, addonId: string, delta: number) => {
    const category = addonCategories.find(c => c.id === categoryId);
    if (!category) return;

    const currentSelections = selectedAddons[categoryId] || {};
    const next = nextAddonSelections(category, currentSelections, addonId, delta);

    if (next.selections === null) {
      const maxSelections = next.limitExceeded;
      toast({
        title: "Limite atingido",
        description: `Você pode selecionar no máximo ${maxSelections} itens desta categoria.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedAddons(prev => ({
      ...prev,
      [categoryId]: next.selections
    }));
  };

  const calculateAddonsPrice = () => addonsPriceOf(addonCategories, selectedAddons);

  const validateRequiredAddons = () => requiredAddonsOk(addonCategories, selectedAddons);

  return { selectedAddons, handleAddonQuantityChange, calculateAddonsPrice, validateRequiredAddons };
}
