import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  RefreshCw 
} from 'lucide-react';

interface KitchenHeaderProps {
  currentTime: Date;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onRefresh: () => void;
}

export function KitchenHeader({ 
  currentTime, 
  soundEnabled, 
  onSoundToggle, 
  onRefresh 
}: KitchenHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChefHat className="w-8 h-8" />
          KDS - Cozinha
        </h1>
        <p className="text-muted-foreground">
          Display de pedidos em tempo real
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Relógio */}
        <div className="text-2xl font-mono font-bold text-muted-foreground">
          {currentTime.toLocaleTimeString('pt-BR')}
        </div>

        {/* Toggle som */}
        <div className="flex items-center gap-2">
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={onSoundToggle}
          />
          <Label htmlFor="sound-toggle" className="cursor-pointer">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </Label>
        </div>

        {/* Refresh */}
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
