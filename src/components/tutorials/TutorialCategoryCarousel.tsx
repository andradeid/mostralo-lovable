import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TutorialCard } from "./TutorialCard";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialView } from "@/hooks/useTutorialViews";
import { TutorialCategory } from "@/hooks/useTutorialCategories";
import { Button } from "@/components/ui/button";
import { useMySubscriptions, useToggleSubscription } from "@/hooks/useCategorySubscriptions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  const { data: subscriptions } = useMySubscriptions();
  const { mutate: toggleSubscription, isPending } = useToggleSubscription();
  
  const isSubscribed = subscriptions?.some(s => s.category_id === category.id) || false;

  // Progresso da categoria
  const categoryProgress = (() => {
    const total = tutorials.length;
    const watched = tutorials.filter(t => views.some(v => v.tutorial_id === t.id && v.completed)).length;
    return { total, watched, percent: total > 0 ? Math.round((watched / total) * 100) : 0 };
  })();

  const handleToggleSubscription = () => {
    if (!isPending) toggleSubscription({ categoryId: category.id, isSubscribed });
  };

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
      if (ref) ref.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [tutorials]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  const isNewTutorial = (createdAt: string) => {
    const diffDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getViewForTutorial = (tutorialId: string) => views.find(v => v.tutorial_id === tutorialId);

  if (tutorials.length === 0) return null;

  return (
    <div className="relative group/carousel mb-8">
      {/* Título da categoria com progresso */}
      <div className="flex items-center gap-3 mb-3 px-4 md:px-8">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {category.name}
        </h2>
        
        {/* Progresso da categoria */}
        {categoryProgress.watched > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {categoryProgress.watched}/{categoryProgress.total}
          </span>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSubscribed ? "secondary" : "ghost"}
              size="sm"
              onClick={handleToggleSubscription}
              disabled={isPending}
              className={cn(
                "h-7 gap-1 text-[10px]",
                isSubscribed && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {isSubscribed ? (
                <><Bell className="w-3 h-3 fill-current" /><span className="hidden sm:inline">Seguindo</span></>
              ) : (
                <><BellOff className="w-3 h-3" /><span className="hidden sm:inline">Seguir</span></>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSubscribed ? "Parar notificações" : "Receber notificações de novos tutoriais"}
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Carrossel */}
      <div className="relative">
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2 z-10",
              "w-9 h-9 rounded-full",
              "bg-background/90 hover:bg-background shadow-lg",
              "opacity-0 group-hover/carousel:opacity-100",
              "transition-all duration-300"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 py-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tutorials.map((tutorial, index) => (
            <div
              key={tutorial.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
            >
              <TutorialCard
                tutorial={tutorial}
                view={getViewForTutorial(tutorial.id)}
                onClick={() => onTutorialClick(tutorial)}
                isNew={isNewTutorial(tutorial.created_at)}
              />
            </div>
          ))}
        </div>
        
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 z-10",
              "w-9 h-9 rounded-full",
              "bg-background/90 hover:bg-background shadow-lg",
              "opacity-0 group-hover/carousel:opacity-100",
              "transition-all duration-300"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
        
        {/* Gradientes */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none transition-opacity duration-300",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none transition-opacity duration-300",
          canScrollRight ? "opacity-100" : "opacity-0"
        )} />
      </div>
    </div>
  );
}
