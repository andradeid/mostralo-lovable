import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NavigationAppSelectorProps {
  storeId: string;
}

export const NavigationAppSelector = ({ storeId }: NavigationAppSelectorProps) => {
  const [preferredApp, setPreferredApp] = useState<'google_maps' | 'waze'>('google_maps');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreference();
  }, [storeId]);

  const loadPreference = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('preferred_navigation_app')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      
      if (data?.preferred_navigation_app) {
        setPreferredApp(data.preferred_navigation_app as 'google_maps' | 'waze');
      }
    } catch (error) {
      console.error('Erro ao carregar preferência:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (value: string) => {
    const newValue = value as 'google_maps' | 'waze';
    setPreferredApp(newValue);

    try {
      const { error } = await supabase
        .from('stores')
        .update({ preferred_navigation_app: newValue })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Preferência salva',
        description: `App de navegação padrão atualizado para ${newValue === 'google_maps' ? 'Google Maps' : 'Waze'}`,
      });
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a preferência',
        variant: 'destructive',
      });
      // Reverter mudança em caso de erro
      loadPreference();
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          App de Navegação Preferido
        </CardTitle>
        <CardDescription>
          Escolha qual app será destacado ao visualizar endereços de clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={preferredApp} onValueChange={handleChange}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="google_maps" id="google_maps" />
              <Label htmlFor="google_maps" className="flex-1 cursor-pointer">
                <div className="font-medium">Google Maps</div>
                <div className="text-sm text-muted-foreground">
                  App de navegação do Google
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="waze" id="waze" />
              <Label htmlFor="waze" className="flex-1 cursor-pointer">
                <div className="font-medium">Waze</div>
                <div className="text-sm text-muted-foreground">
                  App de navegação colaborativo
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
