import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClinicalNote {
  id: string;
  patient_id: string;
  store_id: string;
  note_type: string | null;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

export type ClinicalNoteFormData = Pick<ClinicalNote, 'patient_id' | 'note_type' | 'content'> & { store_id: string };

export function useClinicalNotes(patientId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ['clinical-notes', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClinicalNote[];
    },
    enabled: !!patientId,
  });

  const createNote = useMutation({
    mutationFn: async (noteData: ClinicalNoteFormData) => {
      const { data, error } = await (supabase as any)
        .from('clinical_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) throw error;
      return data as ClinicalNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      toast({
        title: "Nota clínica registrada",
        description: "A nota foi registrada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClinicalNote> & { id: string }) => {
      const { data: result, error } = await (supabase as any)
        .from('clinical_notes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ClinicalNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      toast({
        title: "Nota atualizada",
        description: "A nota foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await (supabase as any)
        .from('clinical_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      toast({
        title: "Nota removida",
        description: "A nota foi removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    createNote,
    updateNote,
    deleteNote,
    refetch: notesQuery.refetch,
  };
}
