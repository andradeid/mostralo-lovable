import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface MediaPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    id: string;
    title: string;
    description?: string;
    category: string;
    file_url: string;
    file_name: string;
    file_type?: string;
  } | null;
}

export function MediaPreviewModal({ open, onOpenChange, media }: MediaPreviewModalProps) {
  if (!media) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = media.file_url;
    link.download = media.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download iniciado!");
  };

  const handleOpenExternal = () => {
    window.open(media.file_url, '_blank');
  };

  const renderPreview = () => {
    switch (media.category) {
      case 'video':
        return (
          <video 
            controls 
            className="w-full max-h-[60vh] rounded-lg"
            src={media.file_url}
          >
            Seu navegador não suporta vídeos.
          </video>
        );
      
      case 'audio':
        return (
          <div className="w-full p-8 bg-muted rounded-lg flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
            <p className="text-lg font-medium">{media.title}</p>
            <audio controls className="w-full max-w-md" src={media.file_url}>
              Seu navegador não suporta áudio.
            </audio>
          </div>
        );
      
      case 'imagem':
        return (
          <img 
            src={media.file_url} 
            alt={media.title}
            className="w-full max-h-[60vh] object-contain rounded-lg"
          />
        );
      
      case 'pdf':
        return (
          <div className="w-full h-[60vh]">
            <iframe 
              src={media.file_url} 
              className="w-full h-full rounded-lg border"
              title={media.title}
            />
          </div>
        );
      
      default:
        return (
          <div className="w-full p-8 bg-muted rounded-lg flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-4xl">📄</span>
            </div>
            <p className="text-lg font-medium">{media.title}</p>
            <p className="text-muted-foreground">
              Este tipo de arquivo não pode ser visualizado diretamente.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{media.title}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPreview()}
          
          {media.description && (
            <p className="mt-4 text-muted-foreground">{media.description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
