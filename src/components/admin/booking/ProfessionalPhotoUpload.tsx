import { useState, useRef } from 'react';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfessionalPhotoUploadProps {
  currentPhotoUrl: string | null;
  professionalName: string;
  onPhotoChange: (url: string) => void;
  disabled?: boolean;
}

export function ProfessionalPhotoUpload({
  currentPhotoUrl,
  professionalName,
  onPhotoChange,
  disabled
}: ProfessionalPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `professionals/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('professional-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('professional-photos')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onPhotoChange(publicUrl);
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onPhotoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Foto do Profissional
      </label>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={previewUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {professionalName ? getInitials(professionalName) : <Camera className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          
          {previewUrl && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
              onClick={handleRemovePhoto}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {previewUrl ? 'Trocar Foto' : 'Enviar Foto'}
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WEBP. Máximo 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
