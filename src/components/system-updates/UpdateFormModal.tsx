import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface UpdateImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'fix' | 'improvement' | 'security';
  importance: 'normal' | 'important' | 'critical';
  release_date: string;
  is_published: boolean;
  system_update_images?: UpdateImage[];
}

interface UpdateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  update?: SystemUpdate | null;
  onSuccess: () => void;
}

type FormData = {
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'fix' | 'improvement' | 'security';
  importance: 'normal' | 'important' | 'critical';
  release_date: string;
  is_published: boolean;
};

const defaultFormData: FormData = {
  version: '',
  title: '',
  description: '',
  category: 'feature',
  importance: 'normal',
  release_date: new Date().toISOString().split('T')[0],
  is_published: false
};

export function UpdateFormModal({ open, onOpenChange, update, onSuccess }: UpdateFormModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [images, setImages] = useState<UpdateImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (update) {
      setFormData({
        version: update.version,
        title: update.title,
        description: update.description,
        category: update.category as 'feature' | 'fix' | 'improvement' | 'security',
        importance: update.importance as 'normal' | 'important' | 'critical',
        release_date: update.release_date,
        is_published: update.is_published
      });
      setImages(update.system_update_images || []);
    } else {
      setFormData(defaultFormData);
      setImages([]);
    }
    setNewImages([]);
  }, [update, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      const image = images.find(img => img.id === imageId);
      if (image) {
        // Deletar do storage
        const path = image.image_url.split('/').pop();
        if (path) {
          await supabase.storage.from('system-update-images').remove([path]);
        }
        
        // Deletar do banco
        await supabase.from('system_update_images').delete().eq('id', imageId);
        setImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
    }
  };

  const uploadImages = async (updateId: string) => {
    const uploadedImages: { image_url: string; caption: string | null; display_order: number }[] = [];

    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${updateId}/${Date.now()}_${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('system-update-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('system-update-images')
        .getPublicUrl(fileName);

      uploadedImages.push({
        image_url: publicUrl,
        caption: null,
        display_order: images.length + i
      });
    }

    if (uploadedImages.length > 0) {
      const { error: insertError } = await supabase
        .from('system_update_images')
        .insert(uploadedImages.map(img => ({
          ...img,
          update_id: updateId
        })));

      if (insertError) {
        console.error('Erro ao salvar imagens:', insertError);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let updateId = update?.id;

      if (update) {
        // Atualizar
        const { error } = await supabase
          .from('system_updates')
          .update(formData)
          .eq('id', update.id);

        if (error) throw error;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('system_updates')
          .insert({
            ...formData,
            created_by: profile?.id
          })
          .select('id')
          .single();

        if (error) throw error;
        updateId = data.id;
      }

      // Upload de novas imagens
      if (newImages.length > 0 && updateId) {
        setUploadingImages(true);
        await uploadImages(updateId);
        setUploadingImages(false);
      }

      toast({
        title: update ? 'Atualização editada' : 'Atualização criada',
        description: 'As alterações foram salvas com sucesso.'
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar atualização.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {update ? 'Editar Atualização' : 'Nova Atualização'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Versão</Label>
              <Input
                id="version"
                placeholder="v1.0.0"
                value={formData.version}
                onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release_date">Data</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={e => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Título da atualização"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">🚀 Nova Funcionalidade</SelectItem>
                  <SelectItem value="fix">🐛 Correção</SelectItem>
                  <SelectItem value="improvement">⚡ Melhoria</SelectItem>
                  <SelectItem value="security">🔒 Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Importância</Label>
              <Select
                value={formData.importance}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, importance: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">⚠️ Importante</SelectItem>
                  <SelectItem value="critical">🚨 Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Markdown)</Label>
            <Textarea
              id="description"
              placeholder="## O que mudou?&#10;&#10;- Item 1&#10;- Item 2&#10;&#10;**Importante:** texto em negrito"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={8}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Suporta Markdown: **negrito**, *itálico*, - listas, [links](url)
            </p>
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <Label>Screenshots</Label>
            
            {/* Imagens existentes */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map(img => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.image_url}
                      alt={img.caption || 'Screenshot'}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Novas imagens */}
            {newImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {newImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Nova imagem ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para adicionar screenshots
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                Publicar imediatamente
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingImages ? 'Enviando imagens...' : 'Salvando...'}
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
