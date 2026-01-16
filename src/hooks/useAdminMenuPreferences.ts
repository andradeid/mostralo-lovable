import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export interface MenuGroup {
  groupName: string;
  items: string[]; // Lista de item IDs (baseado em URLs)
}

export interface MenuPreferences {
  groups: MenuGroup[];
  sortAlphabetically: boolean;
}

interface AdminMenuPreference {
  id: string;
  admin_id: string;
  menu_order: MenuPreferences;
  created_at: string;
  updated_at: string;
}

export function useAdminMenuPreferences() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<MenuPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Buscar preferências do banco
  const fetchPreferences = useCallback(async () => {
    if (!profile?.id || profile?.user_type !== 'master_admin') {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_menu_preferences')
        .select('menu_order')
        .eq('admin_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar preferências de menu:', error);
      }

      if (data) {
        const menuOrder = (data as unknown as { menu_order: MenuPreferences }).menu_order;
        setPreferences(menuOrder);
      }
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.user_type]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Salvar preferências no banco
  const savePreferences = useCallback(async (newPreferences: MenuPreferences) => {
    if (!profile?.id) return false;

    setSaving(true);
    try {
      // Converter para JSON serializável
      const jsonData = JSON.parse(JSON.stringify(newPreferences));
      
      // Primeiro verificar se já existe
      const { data: existing } = await supabase
        .from('admin_menu_preferences')
        .select('id')
        .eq('admin_id', profile.id)
        .maybeSingle();

      let error;
      if (existing) {
        // Atualizar existente
        const result = await supabase
          .from('admin_menu_preferences')
          .update({
            menu_order: jsonData,
            updated_at: new Date().toISOString()
          })
          .eq('admin_id', profile.id);
        error = result.error;
      } else {
        // Inserir novo
        const result = await supabase
          .from('admin_menu_preferences')
          .insert([{
            admin_id: profile.id,
            menu_order: jsonData
          }]);
        error = result.error;
      }

      if (error) {
        console.error('Erro ao salvar preferências:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar as preferências do menu.",
          variant: "destructive"
        });
        return false;
      }

      setPreferences(newPreferences);
      toast({
        title: "Salvo!",
        description: "Suas preferências de menu foram salvas."
      });
      return true;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile?.id, toast]);

  // Limpar preferências (voltar ao padrão)
  const resetPreferences = useCallback(async () => {
    if (!profile?.id) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_menu_preferences')
        .delete()
        .eq('admin_id', profile.id);

      if (error) {
        console.error('Erro ao resetar preferências:', error);
        return false;
      }

      setPreferences(null);
      toast({
        title: "Resetado!",
        description: "Menu voltou ao padrão."
      });
      return true;
    } catch (error) {
      console.error('Erro ao resetar:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile?.id, toast]);

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    resetPreferences,
    isMasterAdmin: profile?.user_type === 'master_admin'
  };
}

// Função utilitária para aplicar ordenação aos itens do menu
export function applyMenuOrder(
  items: Array<{ title: string; url: string; icon: any; group: string }>,
  preferences: MenuPreferences | null
): Record<string, Array<{ title: string; url: string; icon: any; group: string }>> {
  // Se tem ordenação alfabética ativada
  if (preferences?.sortAlphabetically) {
    // Agrupar por grupo e ordenar alfabeticamente
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Ordenar grupos alfabeticamente
    const sortedGroups: Record<string, typeof items> = {};
    Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .forEach(groupName => {
        // Ordenar itens dentro de cada grupo
        sortedGroups[groupName] = grouped[groupName].sort((a, b) => 
          a.title.localeCompare(b.title, 'pt-BR')
        );
      });

    return sortedGroups;
  }

  // Se tem preferências customizadas
  if (preferences?.groups && preferences.groups.length > 0) {
    const result: Record<string, typeof items> = {};
    const itemsMap = new Map(items.map(item => [item.url, item]));
    const usedUrls = new Set<string>();

    // Aplicar ordem customizada
    preferences.groups.forEach(group => {
      const groupItems: typeof items = [];
      group.items.forEach(url => {
        const item = itemsMap.get(url);
        if (item) {
          groupItems.push({ ...item, group: group.groupName });
          usedUrls.add(url);
        }
      });
      if (groupItems.length > 0) {
        result[group.groupName] = groupItems;
      }
    });

    // Adicionar itens que não estão nas preferências (novos itens)
    items.forEach(item => {
      if (!usedUrls.has(item.url)) {
        if (!result[item.group]) {
          result[item.group] = [];
        }
        result[item.group].push(item);
      }
    });

    return result;
  }

  // Sem preferências - usar ordem padrão
  return items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof items>);
}

// Converte grupos agrupados de volta para preferências
export function groupedItemsToPreferences(
  groupedItems: Record<string, Array<{ title: string; url: string; icon: any; group: string }>>,
  sortAlphabetically: boolean = false
): MenuPreferences {
  const groups: MenuGroup[] = Object.entries(groupedItems).map(([groupName, items]) => ({
    groupName,
    items: items.map(item => item.url)
  }));

  return {
    groups,
    sortAlphabetically
  };
}
