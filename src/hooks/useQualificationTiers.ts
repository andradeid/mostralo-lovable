import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { 
  QualificationBenefitTier, 
  QualificationTierTemplate, 
  QualificationTierEditHistory,
  TierConfig,
  PromotionForTier
} from '@/types/qualificationTiers';

export function useQualificationTiers() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<QualificationBenefitTier[]>([]);
  const [templates, setTemplates] = useState<QualificationTierTemplate[]>([]);
  const [history, setHistory] = useState<QualificationTierEditHistory[]>([]);
  const [promotions, setPromotions] = useState<PromotionForTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTiers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('qualification_benefit_tiers')
        .select('*')
        .order('tier_order', { ascending: true });

      if (error) throw error;
      setTiers((data || []) as unknown as QualificationBenefitTier[]);
    } catch (error) {
      console.error('Erro ao buscar faixas:', error);
      toast.error('Erro ao carregar faixas de benefícios');
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('qualification_tier_templates')
        .select('*')
        .order('template_type', { ascending: true });

      if (error) throw error;
      
      // Parse tier_configs from JSON
      const parsed = (data || []).map(t => ({
        ...t,
        tier_configs: typeof t.tier_configs === 'string' 
          ? JSON.parse(t.tier_configs) 
          : t.tier_configs
      }));
      
      setTemplates(parsed as unknown as QualificationTierTemplate[]);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('qualification_tier_edit_history')
        .select('*')
        .order('edited_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as unknown as QualificationTierEditHistory[]);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  }, []);

  const fetchPromotions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('id, name, code, type, discount_percentage, discount_amount, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      
      // Map to our interface
      const mapped = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        discount_type: p.type === 'percentage' ? 'percentage' : 'fixed',
        discount_value: p.type === 'percentage' ? (p.discount_percentage || 0) : (p.discount_amount || 0),
        is_active: p.status === 'active',
      }));
      
      setPromotions(mapped as PromotionForTier[]);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchTiers(), fetchTemplates(), fetchHistory(), fetchPromotions()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchTiers, fetchTemplates, fetchHistory, fetchPromotions]);

  const updateTier = async (
    tierId: string, 
    updates: Partial<QualificationBenefitTier>
  ): Promise<boolean> => {
    if (!user?.id) return false;
    setSaving(true);

    try {
      // Get current values for history
      const currentTier = tiers.find(t => t.id === tierId);
      if (!currentTier) throw new Error('Faixa não encontrada');

      const promotionChanged = updates.promotion_id !== undefined && 
        updates.promotion_id !== currentTier.promotion_id;

      // Update tier
      const { error: updateError } = await supabase
        .from('qualification_benefit_tiers')
        .update(updates as any)
        .eq('id', tierId);

      if (updateError) throw updateError;

      // Log history
      await supabase.from('qualification_tier_edit_history').insert({
        tier_id: tierId,
        edited_by: user.id,
        change_type: 'update',
        previous_values: {
          tier_name: currentTier.tier_name,
          min_points: currentTier.min_points,
          max_points: currentTier.max_points,
          free_days: currentTier.free_days,
          include_consulting: currentTier.include_consulting,
          include_followup: currentTier.include_followup,
          followup_days: currentTier.followup_days,
          promotion_id: currentTier.promotion_id,
          benefit_description: currentTier.benefit_description,
        },
        new_values: updates,
        promotion_changed: promotionChanged,
      } as any);

      await fetchTiers();
      await fetchHistory();
      toast.success('Faixa atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar faixa:', error);
      toast.error('Erro ao atualizar faixa');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (template: QualificationTierTemplate): Promise<boolean> => {
    if (!user?.id) return false;
    setSaving(true);

    try {
      const configs = template.tier_configs as TierConfig[];

      for (const config of configs) {
        const tier = tiers.find(t => t.tier_order === config.tier_order);
        if (!tier) continue;

        await supabase
          .from('qualification_benefit_tiers')
          .update({
            tier_name: config.tier_name,
            min_points: config.min_points,
            max_points: config.max_points,
            free_days: config.free_days,
            include_consulting: config.include_consulting,
            include_followup: config.include_followup,
            followup_days: config.followup_days,
            emoji: config.emoji,
            benefit_description: config.benefit_description,
          } as any)
          .eq('id', tier.id);
      }

      // Log template application
      await supabase.from('qualification_tier_edit_history').insert({
        tier_id: tiers[0]?.id, // Reference first tier
        edited_by: user.id,
        change_type: 'template_apply',
        previous_values: null,
        new_values: { template_type: template.template_type },
        promotion_changed: false,
        template_applied: template.template_name,
      } as any);

      await fetchTiers();
      await fetchHistory();
      toast.success(`Template "${template.template_name}" aplicado com sucesso!`);
      return true;
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast.error('Erro ao aplicar template');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getPromotionById = (id: string | null): PromotionForTier | undefined => {
    if (!id) return undefined;
    return promotions.find(p => p.id === id);
  };

  return {
    tiers,
    templates,
    history,
    promotions,
    loading,
    saving,
    updateTier,
    applyTemplate,
    getPromotionById,
    refetch: () => Promise.all([fetchTiers(), fetchTemplates(), fetchHistory(), fetchPromotions()]),
  };
}
