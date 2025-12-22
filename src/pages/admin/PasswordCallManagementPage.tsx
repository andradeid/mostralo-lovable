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

      {/* Grid 4 colunas (desktop) / 2 colunas (tablet/mobile) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Teclado de Chamada */}
        <PasswordCallKeypad storeId={storeId} config={config} />

        {/* 2. Configurações */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-0 overflow-auto max-h-[300px]">
            <PasswordCallConfigPanel config={config} onSave={saveConfig} />
          </CardContent>
        </Card>

        {/* 3. Como usar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Como usar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-0 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">1</div>
              <p className="text-muted-foreground">Ative nas configurações ao lado</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">2</div>
              <p className="text-muted-foreground">Copie o link e abra na TV</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">3</div>
              <p className="text-muted-foreground">Use o teclado para chamar</p>
            </div>
            <div className="border-t pt-2 mt-2 space-y-1">
              <p className="flex items-center gap-1 text-muted-foreground">
                <Maximize className="h-3 w-3" /> F11 = tela cheia
              </p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <Wifi className="h-3 w-3" /> Mantenha conectado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Painel de Exibição */}
        {storeSlug && (
          <Card className="flex flex-col">
            <CardHeader className="pb-2 py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tv className="h-4 w-4 text-primary" />
                Painel TV
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center space-y-2 pt-0">
              <div className="flex items-center gap-1">
                <Input value={publicUrl} readOnly className="bg-muted text-xs h-8" />
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyLink}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => window.open(publicUrl, '_blank')}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-2.5 w-2.5" />
                F11 para tela cheia
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
