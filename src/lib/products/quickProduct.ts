// Cadastro rápido (código lido e não cadastrado): monta os mesmos dados do formulário de
// produto (schema e valores iniciais dele) e confere custo e estoque inicial. Puro.
import { productFormDefaults, productSchema } from '../../components/admin/product-form/schema.ts';
import type { ProductFormData } from '../productPayload.ts';
import { normalizeBarcode } from '../pdv/barcode.ts';

export interface QuickProductForm {
  name: string;
  price: number;
  categoryId: string;
  barcode: string;
  /** Custo unitário em reais; null/0 = não informado. */
  cost: number | null;
  /** Quantidade inicial em estoque (texto do campo); vazio = sem entrada. */
  initialStock: string;
  /** Vendido por quilo (preço = preço do kg); ignora o estoque inicial. */
  soldByWeight?: boolean;
}

export interface QuickProductBuilt {
  data: ProductFormData;
  cost: number | null;
  initialStock: number | null;
}

export function buildQuickProduct(form: QuickProductForm): QuickProductBuilt | { error: string } {
  const barcode = normalizeBarcode(form.barcode);
  if (!barcode) return { error: 'Código de barras vazio' };

  const parsed = productSchema.safeParse({
    ...productFormDefaults(),
    name: form.name.trim(),
    price: Number(form.price) || 0,
    category_id: form.categoryId,
    barcode,
    sold_by_weight: !!form.soldByWeight,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Confira os campos' };

  const cost = form.cost !== null && Number.isFinite(form.cost) && form.cost > 0 ? form.cost : null;
  if (form.cost !== null && form.cost < 0) return { error: 'O custo não pode ser negativo' };

  const rawStock = form.soldByWeight ? '' : form.initialStock.trim();
  if (rawStock !== '' && (!/^\d+$/.test(rawStock) || Number(rawStock) <= 0)) {
    return { error: 'Estoque inicial: informe um número inteiro maior que zero' };
  }

  return { data: parsed.data as ProductFormData, cost, initialStock: rawStock === '' ? null : Number(rawStock) };
}
