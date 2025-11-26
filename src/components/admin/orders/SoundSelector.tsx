import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { playNewOrderSound, NotificationSound, soundNames, getSelectedSound, setSelectedSound } from "@/utils/soundPlayer";
import { useState } from "react";
import { toast } from "sonner";

export function SoundSelector() {
  const [selectedSound, setSelectedSoundState] = useState<NotificationSound>(getSelectedSound());
  const [open, setOpen] = useState(false);

  const handleSoundChange = (sound: NotificationSound) => {
    setSelectedSoundState(sound);
    setSelectedSound(sound);
    
    // Tocar som apenas uma vez para preview
    playNewOrderSound(sound);
    
    toast.success('Som de notificação alterado!', {
      description: `Agora usando: ${soundNames[sound]}`
    });
  };

  const handleTestSound = async (sound: NotificationSound, event: React.MouseEvent) => {
    event.stopPropagation();
    const success = await playNewOrderSound(sound);
    if (!success) {
      toast.error('Não foi possível tocar o som', {
        description: 'Verifique as permissões do navegador'
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Escolher Som</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Som de Notificação</h4>
            <p className="text-sm text-muted-foreground">
              Escolha o som que tocará quando um novo pedido chegar
            </p>
          </div>

          <RadioGroup
            value={selectedSound}
            onValueChange={(value) => handleSoundChange(value as NotificationSound)}
            className="space-y-3"
          >
            {(Object.keys(soundNames) as NotificationSound[]).map((sound) => (
              <div
                key={sound}
                className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <RadioGroupItem value={sound} id={sound} />
                <Label
                  htmlFor={sound}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {soundNames[sound]}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleTestSound(sound, e)}
                  className="h-8 w-8 p-0"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                {selectedSound === sound && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
