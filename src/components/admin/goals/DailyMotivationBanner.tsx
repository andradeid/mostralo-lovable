import { getMotivationalMessage } from '@/utils/motivationalMessages';
import { cn } from '@/lib/utils';

interface DailyMotivationBannerProps {
  progress: number;
  streak: number;
}

const typeStyles = {
  celebration: 'border-yellow-500/30 bg-yellow-500/5',
  warning: 'border-red-500/30 bg-red-500/5',
  achievement: 'border-purple-500/30 bg-purple-500/5',
};

export const DailyMotivationBanner = ({ progress, streak }: DailyMotivationBannerProps) => {
  const now = new Date();
  const hour = now.getHours();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const message = getMotivationalMessage(progress, streak, hour, daysInMonth, currentDay);
  const style = typeStyles[message.type as keyof typeof typeStyles] || 'border-primary/30 bg-primary/5';

  return (
    <div className={cn("rounded-xl border px-4 py-3", style)}>
      <div className="flex items-start gap-2.5">
        <span className="text-xl shrink-0">{message.emoji}</span>
        <div className="min-w-0">
          <p className="font-bold text-xs">{message.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-3">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};
