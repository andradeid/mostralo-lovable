import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useDriverPresence } from '@/hooks/useDriverPresence';
import { UserX } from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface DriverSelectorProps {
  storeId: string;
  selectedDriverId: string | null;
  onSelect: (driverId: string | null) => void;
  deliveryType: 'delivery' | 'pickup';
}

const DriverOption = ({ driver }: { driver: Driver }) => {
  const isOnline = useDriverPresence(driver.id);
  
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative">
        <Avatar className="h-6 w-6">
          <AvatarImage src={driver.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{driver.full_name[0]}</AvatarFallback>
        </Avatar>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <span className="flex-1">{driver.full_name}</span>
      {isOnline && (
        <Badge variant="outline" className="text-xs h-5">
          Online
        </Badge>
      )}
    </div>
  );
};

export function DriverSelector({ storeId, selectedDriverId, onSelect, deliveryType }: DriverSelectorProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storeId && deliveryType === 'delivery') {
      fetchDrivers();
    }
  }, [storeId, deliveryType]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Buscar IDs dos entregadores da loja
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('store_id', storeId)
        .eq('role', 'delivery_driver');

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setDrivers([]);
        return;
      }

      const driverIds = userRoles.map(r => r.user_id);

      // Buscar perfis dos entregadores
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', driverIds)
        .eq('is_blocked', false)
        .eq('is_deleted', false);

      if (driversError) throw driversError;

      setDrivers(driversData || []);
    } catch (error) {
      console.error('Erro ao buscar entregadores:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  if (deliveryType !== 'delivery') return null;

  return (
    <Select 
      value={selectedDriverId || 'none'} 
      onValueChange={(v) => onSelect(v === 'none' ? null : v)}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione um entregador (opcional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2 py-1">
            <UserX className="h-4 w-4 text-muted-foreground" />
            <span>Sem entregador (atribuir depois)</span>
          </div>
        </SelectItem>
        {drivers.map(driver => (
          <SelectItem key={driver.id} value={driver.id}>
            <DriverOption driver={driver} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
