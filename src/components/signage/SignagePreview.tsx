import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Maximize2 } from 'lucide-react';
import { SignageItem, SignageConfig } from '@/hooks/useSignage';

interface SignagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SignageItem[];
  config: SignageConfig | null;
  publicUrl: string;
}

export function SignagePreview({ open, onOpenChange, items, config, publicUrl }: SignagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeItems = items.filter(item => item.is_active);
  const currentItem = activeItems[currentIndex];

  useEffect(() => {
    if (!open || !isPlaying || activeItems.length === 0) return;

    const duration = currentItem?.duration_seconds || 10;
    const timer = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % activeItems.length);
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [open, isPlaying, currentIndex, activeItems.length, currentItem?.duration_seconds]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [open]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeItems.length) % activeItems.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeItems.length);
  };

  const openFullscreen = () => {
    window.open(publicUrl, '_blank');
  };

  const backgroundColor = config?.background_color || '#000000';
  const transitionDuration = config?.transition_duration_ms || 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Preview do Painel</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {activeItems.length === 0 ? (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Nenhum item ativo para exibir</p>
            </div>
          ) : (
            <>
              {/* Preview Area */}
              <div
                className="aspect-video rounded-lg overflow-hidden relative"
                style={{ backgroundColor }}
              >
                {currentItem && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transition: config?.transition_type === 'none' 
                        ? 'none' 
                        : `opacity ${transitionDuration}ms ease-in-out`
                    }}
                  >
                    {currentItem.file_type === 'video' ? (
                      <video
                        key={currentItem.id}
                        src={currentItem.file_url}
                        className="max-w-full max-h-full object-contain"
                        autoPlay
                        muted
                        loop
                      />
                    ) : (
                      <img
                        key={currentItem.id}
                        src={currentItem.file_url}
                        alt={currentItem.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium">{currentItem?.title}</p>
                  <p className="text-white/70 text-sm">
                    {currentIndex + 1} de {activeItems.length}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={handlePrev}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleNext}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button size="sm" variant="outline" onClick={openFullscreen}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Abrir Tela Cheia
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
