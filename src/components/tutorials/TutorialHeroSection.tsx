import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Auto-rotate a cada 8 segundos
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
    <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden mb-8">
      {/* Background Image */}
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-all duration-500",
          isAnimating && "opacity-0 scale-105"
        )}
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
      
      {/* Gradiente escuro */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Conteúdo */}
      <div className={cn(
        "absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 max-w-3xl",
        "transition-all duration-500",
        isAnimating && "opacity-0 translate-y-4"
      )}>
        {/* Badge de destaque */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase rounded">
            Em Destaque
          </span>
          <span className="text-muted-foreground text-sm">
            {formatDuration(currentTutorial.duration_minutes)}
          </span>
        </div>
        
        {/* Título */}
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 line-clamp-2">
          {currentTutorial.title}
        </h1>
        
        {/* Descrição */}
        {currentTutorial.description && (
          <p className="text-sm md:text-base text-muted-foreground mb-6 line-clamp-3 max-w-xl">
            {currentTutorial.description}
          </p>
        )}
        
        {/* Botões */}
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => onPlay(currentTutorial)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            Assistir
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => onInfo(currentTutorial)}
            className="gap-2"
          >
            <Info className="w-5 h-5" />
            Mais Informações
          </Button>
        </div>
      </div>
      
      {/* Navegação */}
      {tutorials.length > 1 && (
        <>
          {/* Setas */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          
          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {tutorials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "bg-muted-foreground/50 hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
