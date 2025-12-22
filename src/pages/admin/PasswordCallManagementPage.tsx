import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Megaphone, 
  Copy, 
  ExternalLink, 
  Info,
  Tv,
  Lightbulb,
  ChevronDown,
  Maximize,
  Wifi,
  Settings
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { usePasswordCallConfig } from '@/hooks/usePasswordCallConfig';
import { usePasswordCalls } from '@/hooks/usePasswordCalls';
import { PasswordCallKeypad } from '@/components/signage/PasswordCallKeypad';
import { PasswordCallConfigPanel } from '@/components/signage/PasswordCallConfigPanel';
import { supabase } from '@/integrations/supabase/client';

export default function PasswordCallManagementPage() {
  const { storeId } = useStoreAccess();
  const { config, loading: configLoading, saveConfig } = usePasswordCallConfig(storeId);
  const { calls, loading: callsLoading } = usePasswordCalls({ storeId, limit: 10, realtime: true });
  const { toast } = useToast();
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  // Buscar slug da loja
  useEffect(() => {
    if (storeId) {
      supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single()
        .then(({ data }) => {
          if (data) setStoreSlug(data.slug);
        });
    }
  }, [storeId]);

  const publicUrl = storeSlug ? `${window.location.origin}/painel/${storeSlug}` : '';

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast({ title: 'Link copiado!' });
    }
  };

  if (configLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Stats
  const todayCalls = calls.filter(c => {
    const today = new Date();
    const callDate = new Date(c.created_at);
    return callDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Chamada de Senhas
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema de chamada de senhas, pedidos ou mesas para exibição em TVs
          </p>
        </div>
        <Badge variant={config?.is_enabled ? 'default' : 'secondary'} className="w-fit">
          {config?.is_enabled ? 'Ativo' : 'Desativado'}
        </Badge>
      </div>

      {/* Layout 2 colunas: Teclado + Card de Informações */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Coluna 1: Teclado */}
        <div className="shrink-0">
          <PasswordCallKeypad storeId={storeId} config={config} />
        </div>

        {/* Coluna 2: Card único com todas as informações */}
        <Card className="flex flex-col flex-1">
          <CardContent className="p-4 space-y-4">
            {/* Seção: Configurações */}
            <div>
              <h3 className="flex items-center gap-2 font-medium text-sm mb-3">
                <Settings className="h-4 w-4 text-primary" />
                Configurações
              </h3>
              <PasswordCallConfigPanel config={config} onSave={saveConfig} />
            </div>

            <div className="border-t" />

            {/* Seção: Como usar */}
            <div>
              <h3 className="flex items-center gap-2 font-medium text-sm mb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Como usar
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-1">1</div>
                  <span className="text-muted-foreground">Ative o sistema</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-1">2</div>
                  <span className="text-muted-foreground">Abra na TV</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-1">3</div>
                  <span className="text-muted-foreground">Use o teclado</span>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> F11 = tela cheia</span>
                <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Mantenha conectado</span>
              </div>
            </div>

            {storeSlug && (
              <>
                <div className="border-t" />

                {/* Seção: Painel TV */}
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-sm mb-3">
                    <Tv className="h-4 w-4 text-primary" />
                    Painel TV
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input value={publicUrl} readOnly className="bg-muted text-xs h-9 flex-1" />
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => window.open(publicUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Copie o link e abra no navegador da TV
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
