import type { Dispatch, SetStateAction } from 'react';
import type { PromotionFormData } from '@/types/promotions';

/** Props comuns às seções do formulário de promoção. */
export interface PromotionSectionProps {
  formData: PromotionFormData;
  setFormData: Dispatch<SetStateAction<PromotionFormData>>;
}
