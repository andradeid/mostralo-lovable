import { AccountabilityMessage } from '@/utils/accountabilityMessages';
import { cn } from '@/lib/utils';

interface AccountabilityCardProps {
  message: AccountabilityMessage;
}

const toneStyles = {
  celebration: 'border-green-500/30 bg-green-500/5',
  encouragement: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  strong: 'border-red-500/30 bg-red-500/5',
};

export const AccountabilityCard = ({ message }: AccountabilityCardProps) => {
  const style = toneStyles[message.tone as keyof typeof toneStyles] || 'border-border bg-muted/30';

  return (
    <div className={cn("rounded-xl border px-5 py-4", style)}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{message.emoji}</span>
        <div className="min-w-0">
          <p className="font-bold text-sm">{message.title}</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};
