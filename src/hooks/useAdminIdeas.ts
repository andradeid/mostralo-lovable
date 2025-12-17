import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ideasData, type Idea, type IdeaStatus, type IdeaPriority } from "@/data/ideasData";
import { toast } from "sonner";

interface IdeaOverride {
  id: string;
  idea_id: number;
  status: IdeaStatus | null;
  priority: IdeaPriority | null;
  display_order: number | null;
}

export function useAdminIdeas() {
  const [overrides, setOverrides] = useState<Record<number, IdeaOverride>>({});
  const [loading, setLoading] = useState(true);

  const fetchOverrides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_idea_overrides')
        .select('*');

      if (error) throw error;

      const overridesMap = (data || []).reduce<Record<number, IdeaOverride>>((acc, item) => {
        acc[item.idea_id] = {
          id: item.id,
          idea_id: item.idea_id,
          status: item.status as IdeaStatus | null,
          priority: item.priority as IdeaPriority | null,
          display_order: item.display_order
        };
        return acc;
      }, {});

      setOverrides(overridesMap);
    } catch (error) {
      console.error('Erro ao buscar sobrescritas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const updateStatus = useCallback(async (ideaId: number, status: IdeaStatus) => {
    try {
      const { error } = await supabase
        .from('admin_idea_overrides')
        .upsert({
          idea_id: ideaId,
          status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'idea_id'
        });

      if (error) throw error;

      setOverrides(prev => ({
        ...prev,
        [ideaId]: { ...prev[ideaId], idea_id: ideaId, status } as IdeaOverride
      }));

      toast.success('Status atualizado');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  }, []);

  const updatePriority = useCallback(async (ideaId: number, priority: IdeaPriority) => {
    try {
      const { error } = await supabase
        .from('admin_idea_overrides')
        .upsert({
          idea_id: ideaId,
          priority,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'idea_id'
        });

      if (error) throw error;

      setOverrides(prev => ({
        ...prev,
        [ideaId]: { ...prev[ideaId], idea_id: ideaId, priority } as IdeaOverride
      }));

      toast.success('Prioridade atualizada');
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast.error('Erro ao atualizar prioridade');
    }
  }, []);

  const updateOrder = useCallback(async (orderedIds: number[]) => {
    try {
      const updates = orderedIds.map((id, index) => ({
        idea_id: id,
        display_order: index,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('admin_idea_overrides')
        .upsert(updates, {
          onConflict: 'idea_id'
        });

      if (error) throw error;

      setOverrides(prev => {
        const newOverrides = { ...prev };
        orderedIds.forEach((id, index) => {
          newOverrides[id] = { ...newOverrides[id], idea_id: id, display_order: index } as IdeaOverride;
        });
        return newOverrides;
      });
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast.error('Erro ao salvar ordem');
    }
  }, []);

  const ideas = useMemo(() => {
    return ideasData
      .map(idea => ({
        ...idea,
        status: overrides[idea.id]?.status || idea.status,
        priority: overrides[idea.id]?.priority || idea.priority,
        displayOrder: overrides[idea.id]?.display_order ?? 999
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [overrides]);

  return {
    ideas,
    loading,
    updateStatus,
    updatePriority,
    updateOrder,
    refetch: fetchOverrides
  };
}
