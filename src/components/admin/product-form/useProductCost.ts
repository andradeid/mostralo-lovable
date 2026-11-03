// Preço de custo do produto (tabela product_costs, só equipe da loja; gravar só dono/admin).
// Fica fora de `products` porque a vitrine lê products publicamente.
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { canManageProducts } from '@/lib/barcode/scanRules';

/** Grava o custo de um produto (dono/admin; a regra do banco confere). */
export async function upsertProductCost(productId: string, storeId: string, cost: number) {
  const { error } = await (supabase as any)
    .from('product_costs')
    .upsert({ product_id: productId, store_id: storeId, cost_price: cost }, { onConflict: 'product_id' });
  if (error) throw error;
}

export function useProductCost(productId?: string) {
  const { userRole } = useAuth();
  const canEditCost = canManageProducts(userRole);
  const [cost, setCost] = useState<number | null>(null);
  const savedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canEditCost || !productId) return;
    let alive = true;
    (supabase as any)
      .from('product_costs')
      .select('cost_price')
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data, error }: { data: { cost_price: number | string } | null; error: unknown }) => {
        if (!alive) return;
        if (error) {
          console.error('Erro ao buscar custo do produto:', error);
          return;
        }
        const value = data ? Number(data.cost_price) : null;
        savedRef.current = value;
        setCost(value);
      });
    return () => {
      alive = false;
    };
  }, [productId, canEditCost]);

  /** Grava o custo só quando mudou (e quando quem salva é dono/admin). */
  const saveCost = async (finalProductId: string, storeId: string) => {
    if (!canEditCost || cost === null || cost === savedRef.current) return;
    await upsertProductCost(finalProductId, storeId, cost);
    savedRef.current = cost;
  };

  return { canEditCost, cost, setCost, saveCost };
}

export type ProductCostApi = ReturnType<typeof useProductCost>;
