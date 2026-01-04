import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TutorialCard } from "./TutorialCard";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialView } from "@/hooks/useTutorialViews";
import { TutorialCategory } from "@/hooks/useTutorialCategories";
import { Button } from "@/components/ui/button";

interface TutorialCategoryCarouselProps {
  category: TutorialCategory;
  tutorials: Tutorial[];
  views: TutorialView[];
  onTutorialClick: (tutorial: Tutorial) => void;
}

export function TutorialCategoryCarousel({ 
  category, 
  tutorials, 
  views, 
  onTutorialClick 
}: TutorialCategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [tutorials]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Verificar se tutorial é novo (menos de 7 dias)
  const isNewTutorial = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getViewForTutorial = (tutorialId: string) => {
    return views.find(v => v.tutorial_id === tutorialId);
  };

  if (tutorials.length === 0) return null;

  return (
    <div className="relative group/carousel mb-8">
      {/* Título da categoria */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 px-4 md:px-8">
        {category.name}
      </h2>
      
      {/* Container do carrossel */}
      <div className="relative">
        {/* Botão esquerdo */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10",
              "w-10 h-10 md:w-12 md:h-12 rounded-full",
              "bg-background/90 hover:bg-background shadow-lg",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        
        {/* Área de scroll */}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide",
            "px-4 md:px-8 py-2",
            "scroll-smooth"
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              view={getViewForTutorial(tutorial.id)}
              onClick={() => onTutorialClick(tutorial)}
              isNew={isNewTutorial(tutorial.created_at)}
            />
          ))}
        </div>
        
        {/* Botão direito */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10",
              "w-10 h-10 md:w-12 md:h-12 rounded-full",
              "bg-background/90 hover:bg-background shadow-lg",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300"
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}
        
        {/* Gradientes laterais para indicar scroll */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
