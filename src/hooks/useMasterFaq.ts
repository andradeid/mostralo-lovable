import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface MasterFaqItem {
  id: string;
  category: 'sales' | 'support' | 'recruitment';
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface MasterRecruitmentKeyword {
  id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateFaqInput {
  category: 'sales' | 'support' | 'recruitment';
  question: string;
  answer: string;
  keywords?: string[];
  priority?: number;
  is_active?: boolean;
  metadata?: Json;
}

export interface UpdateFaqInput extends Partial<CreateFaqInput> {
  id: string;
}

export function useMasterFaq() {
  const [faqs, setFaqs] = useState<MasterFaqItem[]>([]);
  const [keywords, setKeywords] = useState<MasterRecruitmentKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all FAQs
  const fetchFaqs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('master_faq')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaqs((data as MasterFaqItem[]) || []);
    } catch (error) {
      console.error('Erro ao buscar FAQs:', error);
      toast.error('Erro ao carregar perguntas');
    }
  }, []);

  // Fetch recruitment keywords
  const fetchKeywords = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('master_recruitment_keywords')
        .select('*')
        .order('keyword', { ascending: true });

      if (error) throw error;
      setKeywords((data as MasterRecruitmentKeyword[]) || []);
    } catch (error) {
      console.error('Erro ao buscar keywords:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFaqs(), fetchKeywords()]);
      setLoading(false);
    };
    loadData();
  }, [fetchFaqs, fetchKeywords]);

  // Create FAQ
  const createFaq = async (input: CreateFaqInput): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('master_faq')
        .insert([{
          category: input.category,
          question: input.question,
          answer: input.answer,
          keywords: input.keywords || [],
          priority: input.priority || 5,
          is_active: input.is_active ?? true,
          metadata: input.metadata || {},
        }]);

      if (error) throw error;
      
      toast.success('Pergunta criada com sucesso!');
      await fetchFaqs();
      return true;
    } catch (error) {
      console.error('Erro ao criar FAQ:', error);
      toast.error('Erro ao criar pergunta');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update FAQ
  const updateFaq = async (input: UpdateFaqInput): Promise<boolean> => {
    setSaving(true);
    try {
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.question !== undefined) updateData.question = updates.question;
      if (updates.answer !== undefined) updateData.answer = updates.answer;
      if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { error } = await supabase
        .from('master_faq')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Pergunta atualizada!');
      await fetchFaqs();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar FAQ:', error);
      toast.error('Erro ao atualizar pergunta');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete FAQ
  const deleteFaq = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('master_faq')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Pergunta excluída!');
      await fetchFaqs();
      return true;
    } catch (error) {
      console.error('Erro ao excluir FAQ:', error);
      toast.error('Erro ao excluir pergunta');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Toggle FAQ active status
  const toggleFaqActive = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('master_faq')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isActive ? 'Pergunta ativada!' : 'Pergunta desativada!');
      await fetchFaqs();
      return true;
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      toast.error('Erro ao alternar status');
      return false;
    }
  };

  // Add recruitment keyword
  const addKeyword = async (keyword: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('master_recruitment_keywords')
        .insert({ keyword: keyword.toLowerCase().trim(), is_active: true });

      if (error) throw error;
      
      toast.success('Keyword adicionada!');
      await fetchKeywords();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar keyword:', error);
      toast.error('Erro ao adicionar keyword');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete recruitment keyword
  const deleteKeyword = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('master_recruitment_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Keyword removida!');
      await fetchKeywords();
      return true;
    } catch (error) {
      console.error('Erro ao remover keyword:', error);
      toast.error('Erro ao remover keyword');
      return false;
    }
  };

  // Toggle keyword active status
  const toggleKeywordActive = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('master_recruitment_keywords')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      await fetchKeywords();
      return true;
    } catch (error) {
      console.error('Erro ao alternar keyword:', error);
      return false;
    }
  };

  // Get FAQs by category
  const getFaqsByCategory = (category: 'sales' | 'support' | 'recruitment' | 'all') => {
    if (category === 'all') return faqs;
    return faqs.filter(faq => faq.category === category);
  };

  // Get counts by category
  const getCounts = () => ({
    total: faqs.length,
    sales: faqs.filter(f => f.category === 'sales').length,
    support: faqs.filter(f => f.category === 'support').length,
    recruitment: faqs.filter(f => f.category === 'recruitment').length,
    active: faqs.filter(f => f.is_active).length,
  });

  return {
    faqs,
    keywords,
    loading,
    saving,
    createFaq,
    updateFaq,
    deleteFaq,
    toggleFaqActive,
    addKeyword,
    deleteKeyword,
    toggleKeywordActive,
    getFaqsByCategory,
    getCounts,
    refetch: () => Promise.all([fetchFaqs(), fetchKeywords()]),
  };
}
