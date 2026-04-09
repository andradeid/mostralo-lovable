import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LegacyPageData, LegacyPageInput } from "@/types/legacyPage";

/** Busca página legacy por store_id (para o editor admin) */
export function useLegacyPageByStore(storeId: string | undefined) {
  return useQuery({
    queryKey: ['legacy-page', 'store', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('store_legacy_pages' as any)
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as LegacyPageData | null;
    },
    enabled: !!storeId,
  });
}

/** Busca página legacy por slug (para a página pública) */
export function useLegacyPageBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['legacy-page', 'slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('store_legacy_pages' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as LegacyPageData | null;
    },
    enabled: !!slug,
  });
}

/** Mutation para salvar (upsert) página legacy */
export function useSaveLegacyPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<LegacyPageData>) => {
      if (id) {
        // Update
        const { data, error } = await supabase
          .from('store_legacy_pages' as any)
          .update(input as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return (data as unknown) as LegacyPageData;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('store_legacy_pages' as any)
          .insert(input as any)
          .select()
          .single();
        if (error) throw error;
        return (data as unknown) as LegacyPageData;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['legacy-page'] });
      toast({ title: "Página salva com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar página",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
