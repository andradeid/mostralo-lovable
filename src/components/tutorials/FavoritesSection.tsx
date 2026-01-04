import { Heart } from "lucide-react";
import { useMyFavorites } from "@/hooks/useTutorialFavorites";
import { useMyTutorialViews } from "@/hooks/useTutorialViews";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialCard } from "./TutorialCard";

interface FavoritesSectionProps {
  tutorials: Tutorial[];
  onTutorialClick: (tutorial: Tutorial) => void;
}

export function FavoritesSection({ tutorials, onTutorialClick }: FavoritesSectionProps) {
  const { data: favorites, isLoading } = useMyFavorites();
  const { data: views } = useMyTutorialViews();

  if (isLoading || !favorites?.length) return null;

  // Filtrar tutoriais que estão nos favoritos
  const favoriteTutorials = tutorials.filter(t => 
    favorites.some(f => f.tutorial_id === t.id)
  );

  if (!favoriteTutorials.length) return null;

  const getViewForTutorial = (tutorialId: string) => {
    return views?.find(v => v.tutorial_id === tutorialId);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-4 md:px-8">
        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        <h2 className="text-lg font-semibold">Meus Favoritos</h2>
        <span className="text-sm text-muted-foreground">
          ({favoriteTutorials.length})
        </span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-hide">
        {favoriteTutorials.map((tutorial) => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            view={getViewForTutorial(tutorial.id)}
            onClick={() => onTutorialClick(tutorial)}
          />
        ))}
      </div>
    </section>
  );
}
