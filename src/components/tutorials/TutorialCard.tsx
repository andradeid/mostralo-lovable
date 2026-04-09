import { Play, Check, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeThumbnail, formatDuration } from "@/lib/youtube-utils";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialView } from "@/hooks/useTutorialViews";
import { useMyFavorites, useToggleFavorite } from "@/hooks/useTutorialFavorites";

interface TutorialCardProps {
  tutorial: Tutorial;
  view?: TutorialView;
  onClick: () => void;
  isNew?: boolean;
}

export function TutorialCard({ tutorial, view, onClick, isNew }: TutorialCardProps) {
  const { data: favorites } = useMyFavorites();
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();
  
  const isFavorite = favorites?.some(f => f.tutorial_id === tutorial.id) || false;
  const thumbnailUrl = tutorial.thumbnail_url || getYouTubeThumbnail(tutorial.youtube_url, 'high');
  const isWatched = view?.completed;
  const hasProgress = view && view.watch_time_seconds > 0 && !view.completed;
  
  const progressPercent = hasProgress && tutorial.duration_minutes > 0
    ? Math.min(100, Math.round((view.watch_time_seconds / (tutorial.duration_minutes * 60)) * 100))
    : 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPending) {
      toggleFavorite({ tutorialId: tutorial.id, isFavorite });
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] cursor-pointer",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.03] hover:z-10",
      )}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted shadow-lg ring-1 ring-border/20 group-hover:ring-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-300">
        <img
          src={thumbnailUrl}
          alt={tutorial.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getYouTubeThumbnail(tutorial.youtube_url, 'medium');
          }}
        />
        
        {/* Overlay no hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
        
        {/* Botão de play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>
        
        {/* Duração */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[10px] text-white font-medium flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDuration(tutorial.duration_minutes)}
        </div>
        
        {/* Favorito */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10",
            "bg-black/40 hover:bg-black/60 backdrop-blur-sm",
            "transition-all duration-200",
            "hover:scale-110 active:scale-95",
            isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          <Heart 
            className={cn(
              "w-3.5 h-3.5 transition-all duration-200",
              isFavorite ? "fill-red-500 text-red-500" : "text-white"
            )} 
          />
        </button>
        
        {/* Badge NOVO */}
        {isNew && !isWatched && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary rounded text-[10px] text-primary-foreground font-bold uppercase tracking-wider">
            Novo
          </div>
        )}
        
        {/* Badge ASSISTIDO */}
        {isWatched && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500/90 backdrop-blur-sm rounded text-[10px] text-white font-bold flex items-center gap-1">
            <Check className="w-3 h-3" />
            Concluído
          </div>
        )}
        
        {/* Barra de progresso */}
        {hasProgress && !isWatched && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-muted/50">
            <div 
              className="h-full bg-primary rounded-r-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Info abaixo do thumbnail */}
      <div className="mt-2.5 px-0.5">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
          {tutorial.title}
        </h3>
        {tutorial.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
            {tutorial.description}
          </p>
        )}
        {/* Progress text */}
        {hasProgress && !isWatched && (
          <p className="text-[10px] text-primary mt-1 font-medium">
            {progressPercent}% concluído
          </p>
        )}
      </div>
    </div>
  );
}
