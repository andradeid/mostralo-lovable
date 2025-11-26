import { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bike } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDriverPresence } from '@/hooks/useDriverPresence';

interface DriverBadgeProps {
  driverId: string | null;
}

export function DriverBadge({ driverId }: DriverBadgeProps) {
  const [driverName, setDriverName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isOnline = useDriverPresence(driverId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    if (!driverId) {
      setDriverName(null);
      return;
    }

    // Buscar nome e avatar do entregador
    const fetchDriverInfo = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', driverId)
        .single();

      if (data) {
        setDriverName(data.full_name || 'Entregador');
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchDriverInfo();
  }, [driverId]);

  if (!driverId || !driverName) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <Avatar className="h-10 w-10 border-2 border-primary">
        <AvatarImage src={avatarUrl || undefined} alt={driverName} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(driverName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate">
            {driverName}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
          <span className="text-xs text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
