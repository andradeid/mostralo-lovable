// Grava o cadastro rápido pelo mesmo caminho do formulário de produto (saveProduct), depois
// o custo (product_costs) e a entrada inicial (stock_add_entry), quando informados.
import { saveProduct } from '@/components/admin/product-form/saveProduct';
import { upsertProductCost } from '@/components/admin/product-form/useProductCost';
import { addStockEntry, type StockProduct } from '@/hooks/stock/stockQueries';
import type { QuickProductBuilt } from '@/lib/products/quickProduct';

export interface QuickProductSaved {
  product: StockProduct;
  /** Produto criado, mas custo ou estoque inicial não gravou. */
  warning?: string;
}

export async function saveQuickProduct(storeId: string, built: QuickProductBuilt): Promise<QuickProductSaved> {
  const id = await saveProduct({ data: built.data, storeId, variants: [], selectedAddonCategories: [] });
  if (!id) throw new Error('Produto não foi criado');

  const product: StockProduct = {
    id,
    name: built.data.name,
    barcode: built.data.barcode ?? null,
    price: built.data.price,
    is_on_offer: false,
    offer_price: null,
    image_url: null,
    track_stock: false,
    stock_quantity: null,
    stock_alert_threshold: built.data.stock_alert_threshold ?? 5,
    is_available: built.data.is_available,
  };
  const problems: string[] = [];

  if (built.cost !== null) {
    try {
      await upsertProductCost(id, storeId, built.cost);
    } catch (e) {
      console.error('Cadastro rápido: erro ao gravar custo', e);
      problems.push('custo');
    }
  }

  if (built.initialStock !== null) {
    try {
      const entry = await addStockEntry({
        p_product_id: id,
        p_quantity: built.initialStock,
        p_unit_cost: built.cost,
        p_supplier: null,
        p_invoice_number: null,
        p_notes: 'Estoque inicial (cadastro rápido)',
      });
      product.track_stock = true;
      product.stock_quantity = entry?.stock_after ?? built.initialStock;
    } catch (e) {
      console.error('Cadastro rápido: erro na entrada inicial', e);
      problems.push('estoque inicial');
    }
  }

  return problems.length ? { product, warning: `Produto criado, mas ${problems.join(' e ')} não foi gravado.` } : { product };
}
