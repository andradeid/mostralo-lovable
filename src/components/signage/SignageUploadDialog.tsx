import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon, Film, X, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileToUpload {
  file: File;
  title: string;
  duration: number;
  preview: string;
  type: 'image' | 'video';
}

interface SignageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: FileToUpload[]) => Promise<void>;
}

export function SignageUploadDialog({ open, onOpenChange, onUpload }: SignageUploadDialogProps) {
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: FileToUpload[] = selectedFiles.map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: isVideo ? 30 : 10,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image'
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFile = (index: number, updates: Partial<FileToUpload>) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], ...updates };
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'Selecione pelo menos um arquivo',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await onUpload(files);
      
      // Limpar previews
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Adicionar Mídias ao Painel
          </DialogTitle>
          <DialogDescription>
            Faça upload de imagens ou vídeos para exibir no seu painel digital.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso sobre formatos de vídeo */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
              📹 Dica para vídeos:
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
              Use <strong>MP4 (H.264)</strong> ou <strong>WebM</strong> para garantir compatibilidade. 
              Vídeos do iPhone (HEVC/H.265) podem não funcionar — exporte em "Mais Compatível" ou converta com HandBrake.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar ou arraste arquivos aqui
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Imagens: JPG, PNG, GIF, WEBP • Vídeos: MP4 (H.264), WEBM
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Lista de arquivos */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label>Arquivos selecionados ({files.length})</Label>
              {files.map((f, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {/* Preview */}
                  <div className="relative w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                    {f.type === 'video' ? (
                      <video src={f.preview} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={f.preview} alt={f.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-0.5 left-0.5 bg-background/80 rounded p-0.5">
                      {f.type === 'video' ? (
                        <Film className="h-3 w-3" />
                      ) : (
                        <ImageIcon className="h-3 w-3" />
                      )}
                    </div>
                  </div>

                  {/* Campos */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={f.title}
                      onChange={(e) => updateFile(index, { title: e.target.value })}
                      placeholder="Título"
                      className="h-8"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={f.duration}
                        onChange={(e) => updateFile(index, { duration: Number(e.target.value) })}
                        className="h-8 w-20"
                        min={1}
                        max={300}
                      />
                      <span className="text-xs text-muted-foreground">seg</span>
                    </div>
                  </div>

                  {/* Remover */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Fazendo upload... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
              {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
