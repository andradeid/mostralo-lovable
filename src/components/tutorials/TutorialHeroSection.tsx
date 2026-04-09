import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeThumbnail, formatDuration } from "@/lib/youtube-utils";
import { Tutorial } from "@/hooks/useTutorials";
import { Button } from "@/components/ui/button";

interface TutorialHeroSectionProps {
  tutorials: Tutorial[];
  onPlay: (tutorial: Tutorial) => void;
  onInfo: (tutorial: Tutorial) => void;
}

export function TutorialHeroSection({ tutorials, onPlay, onInfo }: TutorialHeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentTutorial = tutorials[currentIndex];

  useEffect(() => {
    if (tutorials.length <= 1) return;
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % tutorials.length);
        setIsAnimating(false);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [tutorials.length]);

  const goTo = (index: number) => {
    if (index === currentIndex || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  };

  const goNext = () => goTo((currentIndex + 1) % tutorials.length);
  const goPrev = () => goTo((currentIndex - 1 + tutorials.length) % tutorials.length);

  if (!currentTutorial) return null;

  const thumbnailUrl = currentTutorial.thumbnail_url || getYouTubeThumbnail(currentTutorial.youtube_url, 'maxres');

  return (
    <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] overflow-hidden mb-6">
      {/* Background */}
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-all duration-500",
          isAnimating && "opacity-0 scale-105"
        )}
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
      
      {/* Gradientes */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      
      {/* Conteúdo */}
      <div className={cn(
        "absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-14 max-w-2xl",
        "transition-all duration-500",
        isAnimating && "opacity-0 translate-y-4"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded">
            Em Destaque
          </span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="w-3 h-3" />
            {formatDuration(currentTutorial.duration_minutes)}
          </span>
        </div>
        
        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 line-clamp-2 leading-tight">
          {currentTutorial.title}
        </h1>
        
        {currentTutorial.description && (
          <p className="text-xs md:text-sm text-muted-foreground mb-5 line-clamp-2 max-w-lg">
            {currentTutorial.description}
          </p>
        )}
        
        <div className="flex gap-2.5">
          <Button
            size="default"
            onClick={() => onPlay(currentTutorial)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            <Play className="w-4 h-4 fill-current" />
            Assistir Agora
          </Button>
          <Button
            size="default"
            variant="secondary"
            onClick={() => onInfo(currentTutorial)}
            className="gap-2 bg-secondary/80 backdrop-blur-sm"
          >
            <Info className="w-4 h-4" />
            Detalhes
          </Button>
        </div>
      </div>
      
      {/* Navegação */}
      {tutorials.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/40 hover:bg-background/70 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/40 hover:bg-background/70 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {tutorials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
