export interface QualificationBenefitTier {
  id: string;
  tier_order: number;
  tier_name: string;
  min_points: number;
  max_points: number;
  emoji: string;
  benefit_description: string;
  free_days: number;
  include_consulting: boolean;
  include_followup: boolean;
  followup_days: number;
  promotion_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QualificationTierTemplate {
  id: string;
  template_name: string;
  template_type: 'agressivo' | 'moderado' | 'conservador';
  description: string | null;
  tier_configs: TierConfig[];
  is_default: boolean;
  created_at: string;
}

export interface TierConfig {
  tier_order: number;
  tier_name: string;
  min_points: number;
  max_points: number;
  free_days: number;
  include_consulting: boolean;
  include_followup: boolean;
  followup_days: number;
  emoji: string;
  benefit_description: string;
}

export interface QualificationTierEditHistory {
  id: string;
  tier_id: string;
  edited_by: string;
  edited_at: string;
  change_type: 'create' | 'update' | 'delete' | 'template_apply';
  previous_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  promotion_changed: boolean;
  template_applied: string | null;
}

export interface PromotionForTier {
  id: string;
  name: string;
  code: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
}
