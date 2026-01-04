import { TutorialCard } from "./TutorialCard";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialView } from "@/hooks/useTutorialViews";

interface ContinueWatchingSectionProps {
  tutorials: Tutorial[];
  views: TutorialView[];
  onTutorialClick: (tutorial: Tutorial) => void;
}

export function ContinueWatchingSection({ tutorials, views, onTutorialClick }: ContinueWatchingSectionProps) {
  // Filtrar tutoriais que foram iniciados mas não completados
  const inProgressViews = views.filter(v => v.watch_time_seconds > 0 && !v.completed);
  
  // Encontrar os tutoriais correspondentes
  const inProgressTutorials = inProgressViews
    .map(view => ({
      tutorial: tutorials.find(t => t.id === view.tutorial_id),
      view
    }))
    .filter((item): item is { tutorial: Tutorial; view: TutorialView } => !!item.tutorial)
    .sort((a, b) => new Date(b.view.viewed_at).getTime() - new Date(a.view.viewed_at).getTime())
    .slice(0, 10);

  if (inProgressTutorials.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 px-4 md:px-8">
        Continuar Assistindo
      </h2>
      
      <div 
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {inProgressTutorials.map(({ tutorial, view }) => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            view={view}
            onClick={() => onTutorialClick(tutorial)}
          />
        ))}
      </div>
    </div>
  );
}
