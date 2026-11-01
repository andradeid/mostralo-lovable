// Mídia da campanha e inserção de variáveis.
// Código movido da WhatsAppCampaignNewPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

export type UseCampaignMediaDeps = { [K in 'toast' | 'storeId' | 'setMediaFile' | 'setMediaPreview' | 'setUploadingMedia' | 'form' | 'setForm']: any };

export function useCampaignMedia(deps: UseCampaignMediaDeps) {
  const { toast, storeId, setMediaFile, setMediaPreview, setUploadingMedia, form, setForm } = deps;
  // Upload de mídia
  const handleMediaUpload = async (file: File) => {
    if (!storeId) return;
    
    setUploadingMedia(true);
    try {
      // Detectar tipo
      let mediaType: 'image' | 'video' | 'document';
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else {
        mediaType = 'document';
      }
      
      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload para bucket
      const { error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(fileName);
      
      setForm(prev => ({ 
        ...prev, 
        media_url: publicUrl,
        media_type: mediaType 
      }));
      
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMediaFile(file);
      
      toast({
        title: "Mídia enviada!",
        description: "Arquivo carregado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = async () => {
    // Tentar remover do storage se tiver URL
    if (form.media_url && storeId) {
      const path = form.media_url.split('/campaign-media/')[1];
      if (path) {
        await supabase.storage.from('campaign-media').remove([path]);
      }
    }
    
    setMediaFile(null);
    setMediaPreview(null);
    setForm(prev => ({ ...prev, media_url: '', media_type: '' }));
  };

  // Inserir variável na mensagem
  const insertVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      custom_message: prev.custom_message + variable
    }));
  };


  return {
    handleMediaUpload,
    removeMedia,
    insertVariable,
  };
}
