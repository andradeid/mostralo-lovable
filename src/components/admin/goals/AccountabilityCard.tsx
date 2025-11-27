import { Card } from '@/components/ui/card';
import { AccountabilityMessage } from '@/utils/accountabilityMessages';

interface AccountabilityCardProps {
  message: AccountabilityMessage;
}

export const AccountabilityCard = ({ message }: AccountabilityCardProps) => {
  const getGradientClass = () => {
    switch (message.tone) {
      case 'celebration':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50';
      case 'encouragement':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50';
      case 'strong':
        return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50';
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
          <p className="text-base leading-relaxed whitespace-pre-line">
            {message.message}
          </p>
        </div>
      </div>
    </Card>
  );
};
