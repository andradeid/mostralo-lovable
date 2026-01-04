import { useState, useMemo } from "react";
import { PlayCircle, Search } from "lucide-react";
import { useTutorialCategories } from "@/hooks/useTutorialCategories";
import { useTutorials } from "@/hooks/useTutorials";
import { useMyTutorialViews } from "@/hooks/useTutorialViews";
import { useFeaturedTutorials, Tutorial } from "@/hooks/useTutorials";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { TutorialHeroSection } from "@/components/tutorials/TutorialHeroSection";
import { TutorialCategoryCarousel } from "@/components/tutorials/TutorialCategoryCarousel";
import { ContinueWatchingSection } from "@/components/tutorials/ContinueWatchingSection";
import { TutorialPlayerModal } from "@/components/tutorials/TutorialPlayerModal";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function TutorialsPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { storeId } = useStoreAccess();
  const { data: categories, isLoading: loadingCategories } = useTutorialCategories();
  const { data: allTutorials, isLoading: loadingTutorials } = useTutorials();
  const { data: featuredTutorials } = useFeaturedTutorials();
  const { data: myViews } = useMyTutorialViews();

  // Agrupar tutoriais por categoria
  const tutorialsByCategory = useMemo(() => {
    if (!allTutorials || !categories) return new Map();
    
    const map = new Map<string, Tutorial[]>();
    categories.forEach(cat => {
      const categoryTutorials = allTutorials.filter(t => t.category_id === cat.id);
      if (categoryTutorials.length > 0) {
        map.set(cat.id, categoryTutorials);
      }
    });
    return map;
  }, [allTutorials, categories]);

  // Filtrar por pesquisa
  const filteredCategories = useMemo(() => {
    if (!categories || !searchQuery.trim()) return categories || [];
    
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => {
      const categoryTutorials = tutorialsByCategory.get(cat.id) || [];
      return (
        cat.name.toLowerCase().includes(query) ||
        categoryTutorials.some(t => 
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
        )
      );
    });
  }, [categories, searchQuery, tutorialsByCategory]);

  const handlePlay = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
  };

  const handleInfo = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
  };

  if (loadingCategories || loadingTutorials) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasContent = categories && categories.length > 0 && allTutorials && allTutorials.length > 0;

  return (
    <div className="min-h-screen bg-background -m-6 md:-m-8">
      {/* Header com busca */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-8 py-4">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Tutoriais</h1>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tutoriais..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {!hasContent ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <PlayCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum tutorial disponível</h2>
          <p className="text-muted-foreground max-w-md">
            Em breve novos tutoriais serão adicionados para ajudar você a aproveitar ao máximo a plataforma.
          </p>
        </div>
      ) : (
        <>
          {/* Hero com tutoriais em destaque */}
          {featuredTutorials && featuredTutorials.length > 0 && !searchQuery && (
            <TutorialHeroSection
              tutorials={featuredTutorials}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {/* Continuar assistindo */}
          {myViews && allTutorials && !searchQuery && (
            <ContinueWatchingSection
              tutorials={allTutorials}
              views={myViews}
              onTutorialClick={handlePlay}
            />
          )}

          {/* Carrosséis por categoria */}
          <div className="pb-8">
            {filteredCategories?.map(category => {
              const categoryTutorials = tutorialsByCategory.get(category.id) || [];
              
              // Filtrar tutoriais se houver busca
              const filtered = searchQuery.trim()
                ? categoryTutorials.filter(t =>
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : categoryTutorials;

              if (filtered.length === 0) return null;

              return (
                <TutorialCategoryCarousel
                  key={category.id}
                  category={category}
                  tutorials={filtered}
                  views={myViews || []}
                  onTutorialClick={handlePlay}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Modal de player */}
      <TutorialPlayerModal
        tutorial={selectedTutorial}
        open={!!selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        storeId={storeId || undefined}
      />
    </div>
  );
}
