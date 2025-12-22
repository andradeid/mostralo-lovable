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

      {/* Link do Painel */}
      {storeSlug && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Link do Painel de Exibição</p>
                <div className="flex items-center gap-2">
                  <Input value={publicUrl} readOnly className="bg-muted" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(publicUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Abra este link na TV da sua loja</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chamadas Hoje</p>
                <p className="text-2xl font-bold">{todayCalls}</p>
              </div>
              <Megaphone className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Chamada</p>
                <p className="text-lg font-bold capitalize">
                  {config?.call_type === 'password' ? 'Senha' : 
                   config?.call_type === 'order' ? 'Pedido' : 
                   config?.call_type === 'table' ? 'Mesa' : 'Senha'}
                </p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Template</p>
                <p className="text-lg font-bold capitalize">{config?.template || 'Moderno'}</p>
              </div>
              <Tv className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções de Uso */}
      <Collapsible defaultOpen={!config?.is_enabled}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Como usar o Sistema de Chamadas</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Passo a passo */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ative o módulo nas configurações</p>
                    <p className="text-sm text-muted-foreground">Use o painel de configurações ao lado para ativar e personalizar as chamadas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Copie o link e abra na TV</p>
                    <p className="text-sm text-muted-foreground">Cole o link no navegador (Chrome, Edge) do dispositivo de exibição.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    3
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Use o teclado para chamar</p>
                      <p className="text-sm text-muted-foreground">Digite o número e pressione "Chamar" - a chamada aparecerá na TV em tempo real.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dicas */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">Dicas importantes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <Settings className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Use <strong>tela cheia</strong> (F11) para melhor visualização.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <Tv className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Configure o <strong>som</strong> para alertar os clientes.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <Wifi className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Mantenha <strong>internet conectada</strong> para sincronização.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teclado de Chamada */}
        <div className="lg:col-span-2">
          <PasswordCallKeypad storeId={storeId} config={config} />
        </div>

        {/* Configurações */}
        <div>
          <PasswordCallConfigPanel config={config} onSave={saveConfig} />
        </div>
      </div>
    </div>
  );
}
