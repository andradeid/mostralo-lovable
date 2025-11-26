import { useDriverPresence } from '@/hooks/useDriverPresence';
import { DeliveryDriverCard } from './DeliveryDriverCard';

interface DeliveryDriver {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface DriverStats {
  driver_id: string;
  total_deliveries: number;
  active_deliveries: number;
  total_earnings: number;
  pending_earnings: number;
}

interface DeliveryDriverCardWithPresenceProps {
  driver: DeliveryDriver;
  stats?: DriverStats;
  onUpdate: () => void;
  storeId: string;
}

export function DeliveryDriverCardWithPresence({
  driver,
  stats,
  onUpdate,
  storeId,
}: DeliveryDriverCardWithPresenceProps) {
  const isOnline = useDriverPresence(driver.id);

  return (
    <DeliveryDriverCard
      driver={driver}
      stats={stats}
      onUpdate={onUpdate}
      isOnline={isOnline}
      storeId={storeId}
    />
  );
}
