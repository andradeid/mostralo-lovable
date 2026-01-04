import { Play, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeThumbnail, formatDuration } from "@/lib/youtube-utils";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialView } from "@/hooks/useTutorialViews";

interface TutorialCardProps {
  tutorial: Tutorial;
  view?: TutorialView;
  onClick: () => void;
  isNew?: boolean;
}

export function TutorialCard({ tutorial, view, onClick, isNew }: TutorialCardProps) {
  const thumbnailUrl = tutorial.thumbnail_url || getYouTubeThumbnail(tutorial.youtube_url, 'high');
  const isWatched = view?.completed;
  const hasProgress = view && view.watch_time_seconds > 0 && !view.completed;
  
  // Calcular progresso baseado no tempo assistido vs duração
  const progressPercent = hasProgress && tutorial.duration_minutes > 0
    ? Math.min(100, Math.round((view.watch_time_seconds / (tutorial.duration_minutes * 60)) * 100))
    : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] cursor-pointer",
        "transition-all duration-300 ease-out",
        "hover:scale-105 hover:z-10"
      )}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted shadow-lg">
        <img
          src={thumbnailUrl}
          alt={tutorial.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = getYouTubeThumbnail(tutorial.youtube_url, 'medium');
          }}
        />
        
        {/* Overlay escuro no hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
        
        {/* Botão de play no hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Play className="w-7 h-7 text-primary-foreground fill-current ml-1" />
          </div>
        </div>
        
        {/* Duração */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(tutorial.duration_minutes)}
        </div>
        
        {/* Badge NOVO */}
        {isNew && !isWatched && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary rounded text-xs text-primary-foreground font-bold uppercase">
            Novo
          </div>
        )}
        
        {/* Badge ASSISTIDO */}
        {isWatched && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 rounded text-xs text-white font-bold flex items-center gap-1">
            <Check className="w-3 h-3" />
            Assistido
          </div>
        )}
        
        {/* Barra de progresso */}
        {hasProgress && !isWatched && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Título */}
      <div className="mt-2 px-1">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {tutorial.title}
        </h3>
      </div>
    </div>
  );
}
