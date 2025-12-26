import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Globe, Sun, Moon, Sunrise } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BotTimezoneCardProps {
  storeId: string | null;
  disabled?: boolean;
}

const BRAZIL_TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)', description: 'SP, RJ, MG, PR, SC, RS, BA, SE, AL, PE, PB, RN, CE, PI, MA, GO, DF, ES, MS, TO' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)', description: 'AM, RR, RO, parte oeste do PA' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)', description: 'MT' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)', description: 'AC, parte do AM' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)', description: 'Arquipélago de Fernando de Noronha' },
];

function getGreetingFromHour(hour: number): { greeting: string; icon: React.ReactNode } {
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Bom dia', icon: <Sunrise className="h-4 w-4 text-amber-500" /> };
  } else if (hour >= 12 && hour < 18) {
    return { greeting: 'Boa tarde', icon: <Sun className="h-4 w-4 text-orange-500" /> };
  } else {
    return { greeting: 'Boa noite', icon: <Moon className="h-4 w-4 text-indigo-500" /> };
  }
}

export function BotTimezoneCard({ storeId, disabled }: BotTimezoneCardProps) {
  const { toast } = useToast();
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [currentTime, setCurrentTime] = useState('');
  const [currentHour, setCurrentHour] = useState(12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch store timezone on mount
  useEffect(() => {
    if (!storeId) return;
    
    const fetchTimezone = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('timezone')
          .eq('id', storeId)
          .single();
        
        if (!error && data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimezone();
  }, [storeId]);

  // Update current time display every second
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        setCurrentTime(formatter.format(now));
        
        const hourFormatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: timezone,
          hour: '2-digit',
          hour12: false
        });
        setCurrentHour(parseInt(hourFormatter.format(now)));
      } catch {
        setCurrentTime('--:--:--');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const handleTimezoneChange = async (newTimezone: string) => {
    if (!storeId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ timezone: newTimezone })
        .eq('id', storeId);

      if (error) throw error;

      setTimezone(newTimezone);
      toast({
        title: "Fuso horário atualizado",
        description: "O bot usará o novo horário para saudações",
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o fuso horário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const { greeting, icon } = getGreetingFromHour(currentHour);
  const selectedTz = BRAZIL_TIMEZONES.find(tz => tz.value === timezone);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          Fuso Horário da Loja
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm break-words">
          Define o horário usado pelo bot para saudações inteligentes
        </CardDescription>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Timezone</Label>
          <Select 
            value={timezone} 
            onValueChange={handleTimezoneChange}
            disabled={disabled || loading || saving}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Selecione o fuso horário" />
            </SelectTrigger>
            <SelectContent>
              {BRAZIL_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex flex-col">
                    <span className="text-sm">{tz.label}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{tz.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTz && (
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words line-clamp-2">
              {selectedTz.description}
            </p>
          )}
        </div>

        {/* Current time display */}
        <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Horário atual:</span>
            </div>
            <span className="text-base sm:text-lg font-mono font-bold shrink-0">{currentTime}</span>
          </div>
          
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {icon}
              <span className="text-xs sm:text-sm">Saudação ativa:</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-primary shrink-0">"{greeting}"</span>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
          💡 O bot usará automaticamente a saudação correta (Bom dia / Boa tarde / Boa noite) 
          baseada no horário da sua loja.
        </p>
      </CardContent>
    </Card>
  );
}
