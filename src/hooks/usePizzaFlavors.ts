// Pizza com mais de um sabor na página do produto: carrega a regra da categoria e os outros
// sabores, guarda a escolha do cliente e calcula o preço (mesma conta do servidor).
import { useEffect, useMemo, useState } from 'react';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import {
  combinePrices, flavorPrice, flavorsLabel, maxFlavors, pricingOf,
  type FlavorCategoryConfig, type FlavorProduct, type FlavorVariant,
} from '../../supabase/functions/_shared/pizza-flavors';

export interface FlavorOption extends FlavorProduct {
  image_url?: string | null;
  description?: string | null;
  sizePrice: number;
}

interface Params {
  product: (FlavorProduct & { category_id?: string | null }) | null;
  sizeName: string | null;
}

export function usePizzaFlavors({ product, sizeName }: Params) {
  const [config, setConfig] = useState<FlavorCategoryConfig | null>(null);
  const [siblings, setSiblings] = useState<(FlavorProduct & { image_url?: string | null; description?: string | null })[]>([]);
  const [variants, setVariants] = useState<FlavorVariant[]>([]);
  const [count, setCount] = useState(1);
  const [others, setOthers] = useState<(string | null)[]>([]);

  // Regra da categoria e sabores da mesma categoria
  useEffect(() => {
    let alive = true;
    setConfig(null); setSiblings([]); setVariants([]); setCount(1); setOthers([]);
    const categoryId = product?.category_id;
    if (!categoryId) return;
    (async () => {
      const { data: cat, error } = await publicSupabase
        .from('categories')
        .select('id, multi_flavor_enabled, multi_flavor_pricing, multi_flavor_max' as any)
        .eq('id', categoryId)
        .maybeSingle();
      if (!alive || error || !(cat as any)?.multi_flavor_enabled) return;
      const { data: prods } = await publicSupabase
        .from('products')
        .select('id, name, store_id, category_id, price, offer_price, is_on_offer, is_available, image_url, description, display_order')
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .order('display_order');
      const ids = (prods ?? []).map((p: any) => p.id);
      const { data: vars } = ids.length
        ? await publicSupabase.from('product_variants').select('id, product_id, name, price, is_available').in('product_id', ids)
        : { data: [] as any[] };
      if (!alive) return;
      setConfig(cat as unknown as FlavorCategoryConfig);
      setSiblings((prods ?? []) as any);
      setVariants((vars ?? []) as any);
    })();
    return () => { alive = false; };
  }, [product?.id, product?.category_id]);

  const max = useMemo(() => maxFlavors(config, sizeName), [config, sizeName]);

  // Sabores que servem no tamanho escolhido, com o preço desse tamanho
  const options: FlavorOption[] = useMemo(() => {
    if (!config?.multi_flavor_enabled) return [];
    return siblings
      .map((p) => ({ ...p, sizePrice: flavorPrice(p, variants, sizeName) }))
      .filter((p): p is FlavorOption => p.sizePrice !== null);
  }, [config, siblings, variants, sizeName]);

  // Trocou o tamanho: limita a quantidade e tira sabores que não têm o tamanho
  useEffect(() => {
    if (count > max) setCount(max);
    setOthers((prev) => prev.slice(0, Math.max(0, Math.min(count, max) - 1)).map((id) => (id && options.some((o) => o.id === id) ? id : null)));
  }, [max, options]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseCount = (n: number) => {
    const c = Math.max(1, Math.min(max, n));
    setCount(c);
    setOthers((prev) => Array.from({ length: c - 1 }, (_, i) => prev[i] ?? null));
  };
  const chooseFlavor = (slot: number, productId: string) => {
    setOthers((prev) => prev.map((id, i) => (i === slot ? productId : id)));
  };

  const enabled = !!config?.multi_flavor_enabled && max > 1 && options.length > 1;
  const active = enabled && count > 1;
  const mainPrice = product ? flavorPrice(product, variants, sizeName) : null;
  const chosen = others.map((id) => options.find((o) => o.id === id) ?? null);
  const complete = !active || chosen.every(Boolean);
  const chosenProducts = chosen.filter(Boolean) as FlavorOption[];
  const price = active && complete && mainPrice !== null
    ? combinePrices([mainPrice, ...chosenProducts.map((o) => o.sizePrice)], pricingOf(config))
    : null;
  const label = active && complete && product ? flavorsLabel([product.name, ...chosenProducts.map((o) => o.name)]) : '';

  return {
    enabled, active, complete, max, count, others, options, chosen, mainPrice, price, label,
    pricing: pricingOf(config),
    otherIds: active && complete ? chosenProducts.map((o) => o.id) : [],
    chooseCount, chooseFlavor,
  };
}

export type PizzaFlavorsApi = ReturnType<typeof usePizzaFlavors>;
