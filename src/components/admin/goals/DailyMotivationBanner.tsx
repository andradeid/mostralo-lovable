import { Card } from '@/components/ui/card';
import { getMotivationalMessage } from '@/utils/motivationalMessages';

interface DailyMotivationBannerProps {
  progress: number;
  streak: number;
}

export const DailyMotivationBanner = ({ progress, streak }: DailyMotivationBannerProps) => {
  const now = new Date();
  const hour = now.getHours();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const message = getMotivationalMessage(progress, streak, hour, daysInMonth, currentDay);

  const getGradientClass = () => {
    switch (message.type) {
      case 'celebration':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50';
      case 'warning':
        return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50';
      case 'achievement':
        return 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50';
      default:
        return 'bg-gradient-to-r from-primary/20 to-blue-500/20 border-primary/50';
    }
  };

  return (
    <Card className={`p-6 border-2 ${getGradientClass()}`}>
      <div className="flex items-start gap-4">
        <div className="text-5xl">{message.emoji}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{message.title}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {message.message}
          </p>
        </div>
      </div>
    </Card>
  );
};
