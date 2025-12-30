import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SalesChannelPausedBannerProps {
  message: string;
  className?: string;
}

export function SalesChannelPausedBanner({ message, className = '' }: SalesChannelPausedBannerProps) {
  return (
    <Alert 
      className={`bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 ${className}`}
    >
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
        {message}
      </AlertDescription>
    </Alert>
  );
}
