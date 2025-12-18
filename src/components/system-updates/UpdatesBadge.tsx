import { Badge } from '@/components/ui/badge';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';

export function UpdatesBadge() {
  const { unreadCount, loading, canViewUpdates } = useUnreadUpdates();

  if (loading || !canViewUpdates || unreadCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className="ml-auto animate-pulse bg-red-600 text-white text-xs px-2 py-0.5"
    >
      {unreadCount}
    </Badge>
  );
}
