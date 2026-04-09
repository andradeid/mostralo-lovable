import { Play } from "lucide-react";
import { TutorialCard } from "./TutorialCard";
import { Tutorial } from "@/hooks/useTutorials";
import { TutorialView } from "@/hooks/useTutorialViews";

interface ContinueWatchingSectionProps {
  tutorials: Tutorial[];
  views: TutorialView[];
  onTutorialClick: (tutorial: Tutorial) => void;
}

export function ContinueWatchingSection({ tutorials, views, onTutorialClick }: ContinueWatchingSectionProps) {
  const inProgressViews = views.filter(v => v.watch_time_seconds > 0 && !v.completed);
  
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
      <div className="flex items-center gap-2 mb-4 px-4 md:px-8">
        <Play className="w-5 h-5 text-primary fill-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          Continuar Assistindo
        </h2>
        <span className="text-xs text-muted-foreground">
          ({inProgressTutorials.length})
        </span>
      </div>
      
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
