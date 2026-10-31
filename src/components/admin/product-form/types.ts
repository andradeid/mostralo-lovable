import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormData } from '@/lib/productPayload';

export type { ProductFormData, ProductVariant } from '@/lib/productPayload';

export interface Category {
  id: string;
  name: string;
}

export type ProductFormApi = UseFormReturn<ProductFormData>;
