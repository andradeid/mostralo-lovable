import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Copy, 
  Eye, 
  Edit, 
  Trash2, 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileText,
  File,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Play,
  Pause
} from "lucide-react";
import { toast } from "sonner";

interface MediaCardProps {
  media: {
    id: string;
    title: string;
    description?: string;
    category: string;
    niche: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    file_type?: string;
    thumbnail_url?: string;
    is_active: boolean;
  };
  isAdmin?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
  onEdit?: (media: any) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  onPreview?: (media: any) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'video': return <Video className="h-8 w-8" />;
    case 'audio': return <Music className="h-8 w-8" />;
    case 'imagem': return <ImageIcon className="h-8 w-8" />;
    case 'pdf': return <FileText className="h-8 w-8" />;
    default: return <File className="h-8 w-8" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'video': return 'bg-purple-500/20 text-purple-400';
    case 'audio': return 'bg-green-500/20 text-green-400';
    case 'imagem': return 'bg-blue-500/20 text-blue-400';
    case 'pdf': return 'bg-red-500/20 text-red-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function MediaCard({ 
  media, 
  isAdmin = false,
  dragHandleProps,
  isDragging = false,
  onEdit, 
  onDelete, 
  onToggleActive,
  onPreview 
}: MediaCardProps) {
  const [copying, setCopying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Web Audio API refs para contornar restrições de segurança do navegador
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Cleanup da Web Audio API ao desmontar
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          // Ignorar erro se já parou
        }
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Inicializar AudioContext se necessário
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Carregar áudio se ainda não foi carregado
      if (!audioBufferRef.current) {
        setIsLoading(true);
        console.log('Carregando áudio via Web Audio API:', media.file_url);
        
        const response = await fetch(media.file_url);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar áudio: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('ArrayBuffer carregado:', arrayBuffer.byteLength, 'bytes');
        
        // Decodificar o áudio
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
        console.log('Áudio decodificado:', audioBufferRef.current.duration, 'segundos');
        
        setIsLoading(false);
      }
      
      if (isPlaying) {
        // Pausar
        console.log('Pausando áudio');
        if (audioSourceRef.current) {
          pauseTimeRef.current = audioContextRef.current!.currentTime - startTimeRef.current;
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
        }
        setIsPlaying(false);
      } else {
        // Reproduzir
        console.log('Iniciando reprodução');
        
        // Criar novo source node (necessário a cada play)
        audioSourceRef.current = audioContextRef.current!.createBufferSource();
        audioSourceRef.current.buffer = audioBufferRef.current;
        audioSourceRef.current.connect(audioContextRef.current!.destination);
        
        audioSourceRef.current.onended = () => {
          console.log('Áudio finalizado');
          setIsPlaying(false);
          pauseTimeRef.current = 0;
        };
        
        // Retomar do ponto onde parou
        const offset = pauseTimeRef.current || 0;
        startTimeRef.current = audioContextRef.current!.currentTime - offset;
        audioSourceRef.current.start(0, offset);
        
        console.log('Reprodução iniciada com sucesso');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast.error("Não foi possível reproduzir", {
        action: {
          label: "Abrir",
          onClick: () => window.open(media.file_url, '_blank')
        }
      });
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(media.file_url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    } finally {
      setCopying(false);
    }
  };

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

  // Componente de waveform animado
  const AudioWaveform = ({ playing, loading }: { playing: boolean; loading: boolean }) => (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${
            loading ? 'bg-green-400/50 animate-pulse' : 'bg-green-400'
          } ${playing ? 'animate-waveform' : ''}`}
          style={{
            animationDelay: playing ? `${i * 0.15}s` : undefined,
            height: playing ? undefined : '8px'
          }}
        />
      ))}
    </div>
  );

  // Determine thumbnail to display
  const getThumbnail = () => {
    // If has custom thumbnail, use it
    if (media.thumbnail_url) {
      return (
        <img 
          src={media.thumbnail_url} 
          alt={media.title}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      );
    }
    
    // For images, use the file itself as thumbnail
    if (media.category === 'imagem') {
      return (
        <img 
          src={media.file_url} 
          alt={media.title}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      );
    }

    // For audio, show player with waveform
    if (media.category === 'audio') {
      return (
        <div 
          className="w-full h-32 flex flex-col items-center justify-center gap-3 
                     bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-t-lg 
                     cursor-pointer hover:from-green-500/30 hover:to-green-600/40 
                     transition-all"
          onClick={handlePlayPause}
        >
          {/* Waveform animado */}
          <AudioWaveform playing={isPlaying} loading={isLoading} />
          
          {/* Botão Play/Pause */}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                          ${isPlaying ? 'bg-green-500/40' : 'bg-green-500/30'} 
                          hover:bg-green-500/50 transition-colors`}>
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 text-green-400" />
            ) : (
              <Play className="h-5 w-5 text-green-400 ml-0.5" />
            )}
          </div>
          
          {/* Texto de status */}
          <p className="text-xs text-green-400/80">
            {isLoading ? "Carregando..." : isPlaying ? "♪ Reproduzindo..." : "Clique para ouvir"}
          </p>
        </div>
      );
    }
    
    // For other types, show icon
    return (
      <div className={`w-full h-32 flex items-center justify-center rounded-t-lg ${getCategoryColor(media.category)}`}>
        {getCategoryIcon(media.category)}
      </div>
    );
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${!media.is_active && isAdmin ? 'opacity-60' : ''} ${isDragging ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}>
      <div className="relative">
        {getThumbnail()}
        
        {/* Drag handle (admin only) */}
        {isAdmin && dragHandleProps && (
          <div 
            {...dragHandleProps}
            className="absolute top-2 right-2 cursor-grab active:cursor-grabbing bg-background/80 rounded p-1 z-10"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Category badge */}
        <Badge className={`absolute top-2 left-2 ${getCategoryColor(media.category)}`}>
          {media.category}
        </Badge>
        
        {/* Active status (admin only) */}
        {isAdmin && !media.is_active && (
          <Badge variant="destructive" className="absolute top-10 right-2">
            Inativo
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="font-medium text-sm line-clamp-1">{media.title}</h3>
          {media.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {media.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {media.niche}
          </Badge>
          {media.file_size && (
            <span>{formatFileSize(media.file_size)}</span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 flex-1"
            onClick={() => onPreview?.(media)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 flex-1"
            onClick={handleCopyLink}
            disabled={copying}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {isAdmin && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => onToggleActive?.(media.id, !media.is_active)}
              >
                {media.is_active ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => onEdit?.(media)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-destructive hover:text-destructive"
                onClick={() => onDelete?.(media.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
