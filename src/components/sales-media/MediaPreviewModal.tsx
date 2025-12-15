import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Play, Pause, Volume2 } from "lucide-react";
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

function AudioPlayer({ fileUrl, title }: { fileUrl: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    try {
      if (!audioBufferRef.current) {
        setIsLoading(true);
        
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
        setDuration(audioBufferRef.current.duration);
        setIsLoading(false);
      }

      if (isPlaying) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (audioSourceRef.current) {
          pauseTimeRef.current += audioContextRef.current!.currentTime - startTimeRef.current;
          setCurrentTime(pauseTimeRef.current);
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
        }
        setIsPlaying(false);
      } else {
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current!.destination);
        
        source.onended = () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (pauseTimeRef.current >= audioBufferRef.current!.duration - 0.1) {
            pauseTimeRef.current = 0;
            setCurrentTime(0);
          }
          setIsPlaying(false);
        };
        
        startTimeRef.current = audioContextRef.current!.currentTime;
        source.start(0, pauseTimeRef.current);
        audioSourceRef.current = source;
        setIsPlaying(true);

        intervalRef.current = setInterval(() => {
          const elapsed = pauseTimeRef.current + (audioContextRef.current!.currentTime - startTimeRef.current);
          setCurrentTime(Math.min(elapsed, audioBufferRef.current!.duration));
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast.error("Erro ao carregar áudio", {
        action: {
          label: "Abrir",
          onClick: () => window.open(fileUrl, '_blank')
        }
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background border rounded-lg p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlayPause}
          disabled={isLoading}
          className="h-12 w-12 rounded-full"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="h-2 bg-muted rounded-full mt-1">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
        
        <Volume2 className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
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
            <AudioPlayer fileUrl={media.file_url} title={media.title} />
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
