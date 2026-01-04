import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl, formatDuration } from "@/lib/youtube-utils";
import { Tutorial } from "@/hooks/useTutorials";
import { useRecordTutorialView } from "@/hooks/useTutorialViews";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TutorialPlayerModalProps {
  tutorial: Tutorial | null;
  open: boolean;
  onClose: () => void;
  storeId?: string;
}

export function TutorialPlayerModal({ tutorial, open, onClose, storeId }: TutorialPlayerModalProps) {
  const recordView = useRecordTutorialView();
  const startTimeRef = useRef<number>(0);

  // Registrar visualização quando abre o modal
  useEffect(() => {
    if (open && tutorial) {
      startTimeRef.current = Date.now();
      recordView.mutate({
        tutorialId: tutorial.id,
        watchTimeSeconds: 0,
        completed: false,
        storeId
      });
    }
  }, [open, tutorial?.id]);

  // Registrar tempo assistido quando fecha
  const handleClose = () => {
    if (tutorial && startTimeRef.current > 0) {
      const watchTimeSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const totalDurationSeconds = tutorial.duration_minutes * 60;
      // Considerar completo se assistiu mais de 80%
      const completed = totalDurationSeconds > 0 && watchTimeSeconds >= totalDurationSeconds * 0.8;
      
      recordView.mutate({
        tutorialId: tutorial.id,
        watchTimeSeconds,
        completed,
        storeId
      });
    }
    onClose();
  };

  if (!tutorial) return null;

  const embedUrl = getYouTubeEmbedUrl(tutorial.youtube_url);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 bg-background border-border overflow-hidden">
        <DialogTitle className="sr-only">{tutorial.title}</DialogTitle>
        
        {/* Botão fechar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-2 top-2 z-50 rounded-full bg-background/80 hover:bg-background"
        >
          <X className="w-5 h-5" />
        </Button>
        
        {/* Player de vídeo */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={tutorial.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        
        {/* Informações do tutorial */}
        <div className="p-4 md:p-6 space-y-3">
          <div className="flex items-start gap-3 justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {tutorial.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(tutorial.duration_minutes)}
                </Badge>
                {tutorial.is_featured && (
                  <Badge variant="default" className="text-xs bg-primary">
                    Destaque
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {tutorial.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tutorial.description}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
