import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrderQuestion {
  id: string;
  store_id: string;
  question_text: string;
  question_type: 'text' | 'location' | 'payment' | 'options';
  placeholder_response: string | null;
  is_required: boolean;
  sort_order: number;
  enabled: boolean;
}

const DEFAULT_QUESTIONS: Omit<OrderQuestion, 'id' | 'store_id'>[] = [
  { question_text: 'Qual o seu nome?', question_type: 'text', placeholder_response: 'Ex: Maria Silva', is_required: true, sort_order: 0, enabled: true },
  { question_text: 'Qual o seu endereço de entrega?', question_type: 'text', placeholder_response: 'Ex: Rua das Flores, 123', is_required: true, sort_order: 1, enabled: true },
  { question_text: 'Me envie sua localização 📍', question_type: 'location', placeholder_response: 'Compartilhe sua localização pelo WhatsApp', is_required: true, sort_order: 2, enabled: true },
  { question_text: 'Deseja mais alguma coisa?', question_type: 'text', placeholder_response: null, is_required: false, sort_order: 3, enabled: true },
  { question_text: 'Qual forma de pagamento? (Pix, cartão, dinheiro)', question_type: 'payment', placeholder_response: 'Ex: Pix', is_required: true, sort_order: 4, enabled: true },
  { question_text: 'Vai precisar de troco? Se sim, pra quanto?', question_type: 'text', placeholder_response: 'Ex: Troco para R$ 50', is_required: false, sort_order: 5, enabled: true },
];

export function useBotOrderQuestions(storeId: string) {
  const [questions, setQuestions] = useState<OrderQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_bot_order_questions')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order');

      if (error) throw error;
      setQuestions((data as OrderQuestion[]) || []);
    } catch (err) {
      console.error('Erro ao carregar perguntas:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // Cria perguntas padrão se não existirem
  const initializeDefaults = useCallback(async () => {
    if (!storeId || questions.length > 0) return;
    setSaving(true);
    try {
      const inserts = DEFAULT_QUESTIONS.map(q => ({ ...q, store_id: storeId }));
      const { error } = await supabase.from('store_bot_order_questions').insert(inserts);
      if (error) throw error;
      await fetchQuestions();
      toast({ title: 'Perguntas padrão criadas!' });
    } catch (err) {
      console.error('Erro ao criar perguntas padrão:', err);
      toast({ title: 'Erro ao criar perguntas', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [storeId, questions.length, fetchQuestions, toast]);

  const addQuestion = useCallback(async (questionText: string, questionType: 'text' | 'location' | 'payment' | 'options' = 'text') => {
    if (!storeId) return;
    setSaving(true);
    try {
      const maxOrder = questions.reduce((max, q) => Math.max(max, q.sort_order), -1);
      const { error } = await supabase.from('store_bot_order_questions').insert({
        store_id: storeId,
        question_text: questionText,
        question_type: questionType,
        sort_order: maxOrder + 1,
        is_required: false,
        enabled: true,
      });
      if (error) throw error;
      await fetchQuestions();
    } catch (err) {
      console.error('Erro ao adicionar pergunta:', err);
      toast({ title: 'Erro ao adicionar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [storeId, questions, fetchQuestions, toast]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<OrderQuestion>) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('store_bot_order_questions').update(updates).eq('id', id);
      if (error) throw error;
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    } catch (err) {
      console.error('Erro ao atualizar pergunta:', err);
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const deleteQuestion = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('store_bot_order_questions').delete().eq('id', id);
      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Erro ao excluir pergunta:', err);
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const reorderQuestions = useCallback(async (reorderedQuestions: OrderQuestion[]) => {
    // Atualiza localmente primeiro
    setQuestions(reorderedQuestions);
    try {
      const updates = reorderedQuestions.map((q, index) =>
        supabase.from('store_bot_order_questions').update({ sort_order: index }).eq('id', q.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      await fetchQuestions(); // Reverte
    }
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    saving,
    initializeDefaults,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
  };
}
