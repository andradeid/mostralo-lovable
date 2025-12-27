import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { Upload, X, Loader2 } from 'lucide-react';

interface TotemWelcomePanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}

export function TotemWelcomePanel({ config, onChange, onUploadImage }: TotemWelcomePanelProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) {
        onChange({ welcome_image_url: url });
      }
    } finally {
      // Permite selecionar o mesmo arquivo novamente
      e.target.value = '';
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="welcome_title">Título de Boas-Vindas</Label>
        <Input
          id="welcome_title"
          value={config.welcome_title || ''}
          onChange={(e) => onChange({ welcome_title: e.target.value })}
          placeholder="Bem-vindo!"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="welcome_subtitle">Subtítulo / Instrução</Label>
        <Input
          id="welcome_subtitle"
          value={config.welcome_subtitle || ''}
          onChange={(e) => onChange({ welcome_subtitle: e.target.value })}
          placeholder="Toque para começar seu pedido"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Exibir Imagem de Fundo</Label>
          <p className="text-sm text-muted-foreground">Mostrar imagem na tela inicial</p>
        </div>
        <Switch
          checked={config.show_welcome_image ?? true}
          onCheckedChange={(checked) => onChange({ show_welcome_image: checked })}
        />
      </div>

      {config.show_welcome_image && (
        <div className="space-y-2">
          <Label>Imagem de Boas-Vindas</Label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            id="welcome-image-upload"
            disabled={uploading}
          />

          {config.welcome_image_url ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={config.welcome_image_url}
                  alt="Imagem de boas-vindas do totem"
                  className="max-w-full max-h-48 rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => onChange({ welcome_image_url: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? 'Enviando...' : 'Trocar imagem'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <label
                htmlFor="welcome-image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
                onClick={(e) => {
                  // Garante abertura do seletor mesmo com input visualmente oculto
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Enviando...' : 'Clique para enviar uma imagem'}
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
