// Dados da tela de Estoque: produtos com estoque controlado, custos e últimas entradas.
import { useCallback, useEffect, useState } from 'react';
import {
  fetchStockEntries,
  fetchStoreCosts,
  fetchTrackedProducts,
  type StockEntryRow,
  type StockProduct,
} from './stockQueries';

export function useStockOverview(storeId: string | null) {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [entries, setEntries] = useState<StockEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    try {
      const [p, c, e] = await Promise.all([
        fetchTrackedProducts(storeId),
        fetchStoreCosts(storeId),
        fetchStockEntries(storeId),
      ]);
      setProducts(p);
      setCosts(c);
      setEntries(e);
    } catch (e) {
      console.error('Erro ao carregar estoque:', e);
      setError('Não foi possível carregar o estoque.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, costs, entries, loading, error, reload };
}
