import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppearanceStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export function AppearanceStep({ formData, updateFormData }: AppearanceStepProps) {
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File, type: 'logo' | 'cover') => {
    try {
      setUploading(type);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${type}.${fileExt}`;
      const filePath = `stores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      const fieldName = type === 'logo' ? 'logo_url' : 'cover_url';
      updateFormData({ [fieldName]: data.publicUrl });

      toast({
        title: "Sucesso",
        description: `${type === 'logo' ? 'Logo' : 'Capa'} enviado com sucesso!`,
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (type: 'logo' | 'cover') => {
    const fieldName = type === 'logo' ? 'logo_url' : 'cover_url';
    updateFormData({ [fieldName]: '' });
  };

  const handleFileSelect = (type: 'logo' | 'cover') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadImage(file, type);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo da Loja</Label>
        <div className="border-2 border-dashed border-muted rounded-lg p-6">
          {formData.logo_url ? (
            <div className="relative">
              <img
                src={formData.logo_url}
                alt="Logo"
                className="w-32 h-32 object-contain mx-auto rounded-lg bg-muted"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2"
                onClick={() => removeImage('logo')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Image className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhuma logo selecionada</p>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => handleFileSelect('logo')}
              disabled={uploading === 'logo'}
            >
              {uploading === 'logo' ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.logo_url ? 'Alterar Logo' : 'Enviar Logo'}
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Recomendado: 200x200px, formato PNG com fundo transparente
        </p>
      </div>

      {/* Capa */}
      <div className="space-y-2">
        <Label>Imagem de Capa</Label>
        <div className="border-2 border-dashed border-muted rounded-lg p-6">
          {formData.cover_url ? (
            <div className="relative">
              <img
                src={formData.cover_url}
                alt="Capa"
                className="w-full h-48 object-cover rounded-lg bg-muted"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeImage('cover')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-2 h-48 flex flex-col justify-center">
              <Image className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhuma capa selecionada</p>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => handleFileSelect('cover')}
              disabled={uploading === 'cover'}
            >
              {uploading === 'cover' ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.cover_url ? 'Alterar Capa' : 'Enviar Capa'}
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Recomendado: 1200x400px, formato JPG ou PNG
        </p>
      </div>

      {/* Cores do Tema */}
      <div className="space-y-4">
        <h4 className="font-medium">Cores do Tema</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Cor Primária</Label>
            <div className="flex space-x-2">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => updateFormData({ primary_color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => updateFormData({ primary_color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Cor Secundária</Label>
            <div className="flex space-x-2">
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) => updateFormData({ secondary_color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={formData.secondary_color}
                onChange={(e) => updateFormData({ secondary_color: e.target.value })}
                placeholder="#10B981"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layout dos Produtos */}
      <div className="space-y-2">
        <Label>Layout de Exibição dos Produtos</Label>
        <Select 
          value={formData.product_display_layout} 
          onValueChange={(value) => updateFormData({ product_display_layout: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grade (Grid)</SelectItem>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="carousel">Carrossel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Preview das Cores:</h4>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: formData.primary_color }}
            />
            <span className="text-sm">Primária</span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: formData.secondary_color }}
            />
            <span className="text-sm">Secundária</span>
          </div>
        </div>
      </div>
    </div>
  );
}