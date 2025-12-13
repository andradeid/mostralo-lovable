import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ProfilePhotoUpload({ value, onChange, className }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validação de tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('salesperson-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('salesperson-photos')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Foto enviada com sucesso!");
    } catch (error: unknown) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extrair o path do arquivo da URL
      const urlParts = value.split('/');
      const filePath = `profile-photos/${urlParts[urlParts.length - 1]}`;

      await supabase.storage
        .from('salesperson-photos')
        .remove([filePath]);

      onChange("");
      toast.success("Foto removida");
    } catch (error) {
      console.error("Erro ao remover:", error);
      onChange("");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label>Foto de Perfil *</Label>
      
      <div className="flex flex-col items-center gap-4">
        {/* Preview */}
        <div className="relative">
          <div 
            className={cn(
              "w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden",
              value ? "border-primary" : "border-muted-foreground/30",
              !value && "bg-muted"
            )}
          >
            {value ? (
              <img 
                src={value} 
                alt="Foto de perfil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-muted-foreground/50" />
            )}
          </div>
          
          {/* Botão remover */}
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input oculto */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        {/* Botão de upload */}
        <Button
          type="button"
          variant={value ? "outline" : "default"}
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              {value ? "Trocar Foto" : "Adicionar Foto"}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Envie uma foto sua para identificação.<br/>
          Formatos aceitos: JPG, PNG (máx. 2MB)
        </p>
      </div>
    </div>
  );
}
