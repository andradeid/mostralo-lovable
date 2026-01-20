import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PauseCircle, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreQuickToggleProps {
  storeId: string | null;
  variant?: 'compact' | 'full';
  onStatusChange?: (isPaused: boolean) => void;
}

export function StoreQuickToggle({ storeId, variant = 'compact', onStatusChange }: StoreQuickToggleProps) {
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: storeData, isLoading, refetch } = useQuery({
    queryKey: ['store-pause-status', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('stores')
        .select('id, business_hours')
        .eq('id', storeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  const isPaused = (storeData?.business_hours as any)?.service_paused === true;

  const handleToggle = async () => {
    if (!storeId || !storeData) return;
    
    setIsToggling(true);
    const newPausedState = !isPaused;
    
    try {
      const currentBusinessHours = (storeData.business_hours as any) || {};
      const updatedBusinessHours = {
        ...currentBusinessHours,
        service_paused: newPausedState
      };

      const { error } = await supabase
        .from('stores')
        .update({ business_hours: updatedBusinessHours })
        .eq('id', storeId);

      if (error) throw error;

      await refetch();
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['store-daily-kpis', storeId] });
      
      onStatusChange?.(newPausedState);
      
      toast({
        title: newPausedState ? '⏸️ Loja fechada' : '✅ Loja aberta',
        description: newPausedState 
          ? 'Sua loja está temporariamente fechada para novos pedidos'
          : 'Sua loja está aberta e recebendo pedidos'
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da loja',
        variant: 'destructive'
      });
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    if (variant === 'compact') {
      return <Skeleton className="h-8 w-28 rounded-full" />;
    }
    return <Skeleton className="h-20 w-full rounded-lg" />;
  }

  if (!storeData) return null;

  // Versão compacta para o Dashboard header
  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
          isPaused 
            ? "border-destructive/50 bg-destructive/10 dark:bg-destructive/20" 
            : "border-green-500/50 bg-green-500/10 dark:bg-green-500/20"
        )}
      >
        {isToggling ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : isPaused ? (
          <PauseCircle className="w-4 h-4 text-destructive" />
        ) : (
          <PlayCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
        )}
        <span className={cn(
          "text-xs font-medium",
          isPaused ? "text-destructive" : "text-green-600 dark:text-green-500"
        )}>
          {isPaused ? 'Fechada' : 'Aberta'}
        </span>
        <Switch
          checked={!isPaused}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          className="h-4 w-8 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-destructive"
        />
      </div>
    );
  }

  // Versão completa para página Minha Loja
  return (
    <Card className={cn(
      "border-2 transition-colors",
      isPaused 
        ? "border-destructive/50 bg-destructive/5" 
        : "border-green-500/50 bg-green-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isToggling ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : isPaused ? (
              <PauseCircle className="w-8 h-8 text-destructive" />
            ) : (
              <PlayCircle className="w-8 h-8 text-green-500" />
            )}
            <div>
              <p className="font-semibold text-base">
                {isPaused ? 'Loja Fechada' : 'Loja Aberta'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPaused 
                  ? 'Novos pedidos estão desabilitados' 
                  : 'Recebendo pedidos normalmente'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:block">
              {isPaused ? 'Abrir' : 'Fechar'}
            </span>
            <Switch
              checked={!isPaused}
              onCheckedChange={handleToggle}
              disabled={isToggling}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-destructive"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
