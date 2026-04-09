import { useState, useMemo } from "react";
import { PlayCircle, Search, Layers, Trophy, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useTutorialCategories } from "@/hooks/useTutorialCategories";
import { useTutorials } from "@/hooks/useTutorials";
import { useMyTutorialViews } from "@/hooks/useTutorialViews";
import { useFeaturedTutorials, Tutorial } from "@/hooks/useTutorials";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { TutorialHeroSection } from "@/components/tutorials/TutorialHeroSection";
import { TutorialCategoryCarousel } from "@/components/tutorials/TutorialCategoryCarousel";
import { ContinueWatchingSection } from "@/components/tutorials/ContinueWatchingSection";
import { TutorialPlayerModal } from "@/components/tutorials/TutorialPlayerModal";
import { TutorialNotificationsBell } from "@/components/tutorials/TutorialNotificationsBell";
import { FavoritesSection } from "@/components/tutorials/FavoritesSection";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TutorialsPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  
  const { storeId } = useStoreAccess();
  const { data: categories, isLoading: loadingCategories } = useTutorialCategories();
  const { data: allTutorials, isLoading: loadingTutorials } = useTutorials();
  const { data: featuredTutorials } = useFeaturedTutorials();
  const { data: myViews } = useMyTutorialViews();

  // Estatísticas globais de progresso
  const progressStats = useMemo(() => {
    if (!allTutorials || !myViews) return { total: 0, watched: 0, inProgress: 0, percent: 0, totalMinutes: 0, watchedMinutes: 0 };
    
    const total = allTutorials.length;
    const watched = myViews.filter(v => v.completed).length;
    const inProgress = myViews.filter(v => v.watch_time_seconds > 0 && !v.completed).length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    const totalMinutes = allTutorials.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);
    const watchedMinutes = myViews.reduce((acc, v) => acc + Math.round(v.watch_time_seconds / 60), 0);
    
    return { total, watched, inProgress, percent, totalMinutes, watchedMinutes };
  }, [allTutorials, myViews]);

  // Agrupar tutoriais por categoria
  const tutorialsByCategory = useMemo(() => {
    if (!allTutorials || !categories) return new Map();
    const map = new Map<string, Tutorial[]>();
    categories.forEach(cat => {
      const categoryTutorials = allTutorials.filter(t => t.category_id === cat.id);
      if (categoryTutorials.length > 0) map.set(cat.id, categoryTutorials);
    });
    return map;
  }, [allTutorials, categories]);

  // Filtrar por categoria selecionada e pesquisa
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    let filtered = categories;
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter(cat => cat.id === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat => {
        const categoryTutorials = tutorialsByCategory.get(cat.id) || [];
        return (
          cat.name.toLowerCase().includes(query) ||
          categoryTutorials.some(t => 
            t.title.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
          )
        );
      });
    }
    return filtered;
  }, [categories, selectedCategoryId, searchQuery, tutorialsByCategory]);

  const hasActiveFilter = selectedCategoryId !== "all" || searchQuery.trim() !== "";

  const handlePlay = (tutorial: Tutorial) => setSelectedTutorial(tutorial);
  const handleInfo = (tutorial: Tutorial) => setSelectedTutorial(tutorial);

  if (loadingCategories || loadingTutorials) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasContent = categories && categories.length > 0 && allTutorials && allTutorials.length > 0;

  return (
    <div className="-m-6 min-h-screen bg-background">
      {/* Header fixo com busca e filtro */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 md:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <PlayCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">Central de Aprendizado</h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Domine a plataforma com tutoriais em vídeo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-card">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 sm:w-56 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-card"
              />
            </div>
            <TutorialNotificationsBell 
              onNotificationClick={(tutorialId) => {
                const tutorial = allTutorials?.find(t => t.id === tutorialId);
                if (tutorial) setSelectedTutorial(tutorial);
              }}
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
          {featuredTutorials && featuredTutorials.length > 0 && !hasActiveFilter && (
            <TutorialHeroSection
              tutorials={featuredTutorials}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {/* Barra de progresso global */}
          {!hasActiveFilter && progressStats.total > 0 && (
            <div className="px-4 md:px-8 mb-6">
              <div className="bg-card border border-border/50 rounded-xl p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-foreground text-sm">Seu Progresso</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {progressStats.watched} concluído{progressStats.watched !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {progressStats.inProgress} em andamento
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      {progressStats.watchedMinutes} min assistidos
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressStats.percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {progressStats.watched} de {progressStats.total} tutoriais
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    {progressStats.percent}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Continuar assistindo */}
          {myViews && allTutorials && !hasActiveFilter && (
            <ContinueWatchingSection
              tutorials={allTutorials}
              views={myViews}
              onTutorialClick={handlePlay}
            />
          )}

          {/* Favoritos */}
          {allTutorials && !hasActiveFilter && (
            <FavoritesSection
              tutorials={allTutorials}
              onTutorialClick={handlePlay}
            />
          )}

          {/* Carrosséis por categoria */}
          <div className="pb-8">
            {filteredCategories?.map(category => {
              const categoryTutorials = tutorialsByCategory.get(category.id) || [];
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
