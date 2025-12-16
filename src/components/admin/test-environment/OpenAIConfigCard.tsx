import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Check, X, ExternalLink, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface EvolutionConfig {
  id: string;
  api_url: string;
  openai_creds_id: string | null;
  openai_default_model: string | null;
  openai_max_tokens: number | null;
  is_active: boolean;
}

export function OpenAIConfigCard() {
  const [config, setConfig] = useState<EvolutionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('evolution_config')
          .select('id, api_url, openai_creds_id, openai_default_model, openai_max_tokens, is_active')
          .eq('is_active', true)
          .single();

        if (!error && data) {
          setConfig(data);
        }
      } catch (err) {
        console.error('Erro ao buscar config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasOpenAI = !!config?.openai_creds_id;

  return (
    <Card className={hasOpenAI ? 'border-green-500/20' : 'border-amber-500/20'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          Configurações OpenAI
        </CardTitle>
        <CardDescription>
          Status da integração com a Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Principal */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {hasOpenAI ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-amber-500" />
            )}
            <span className="font-medium">
              {hasOpenAI ? 'Credenciais Configuradas' : 'Credenciais Pendentes'}
            </span>
          </div>
          <Badge variant={hasOpenAI ? 'default' : 'secondary'}>
            {hasOpenAI ? '✅ Pronto' : '⚠️ Configurar'}
          </Badge>
        </div>

        {/* Grid de Configurações */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Modelo</p>
            <p className="font-medium text-sm">
              {config?.openai_default_model || 'gpt-4-turbo'}
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Max Tokens</p>
            <p className="font-medium text-sm">
              {config?.openai_max_tokens || 1000}
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Creds ID</p>
            <p className="font-mono text-xs truncate">
              {config?.openai_creds_id ? `${config.openai_creds_id.slice(0, 8)}...` : 'Não configurado'}
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium text-sm flex items-center gap-1">
              {config?.is_active ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Ativo
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Inativo
                </>
              )}
            </p>
          </div>
        </div>

        {/* Explicação */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
          <p className="text-sm font-medium">ℹ️ Como funciona a integração:</p>
          <ol className="text-xs text-muted-foreground space-y-1">
            <li>1. A chave da OpenAI é cadastrada na <strong>Evolution API</strong></li>
            <li>2. A Evolution retorna um <code className="bg-muted px-1 rounded">openai_creds_id</code></li>
            <li>3. Ao criar um bot, usamos esse ID para vincular às credenciais</li>
            <li>4. A Evolution faz as chamadas à OpenAI automaticamente</li>
          </ol>
        </div>

        {/* Link para Evolution */}
        {config?.api_url && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={config.api_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Evolution API
            </a>
          </Button>
        )}

        {!hasOpenAI && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>⚠️ Ação necessária:</strong> Configure as credenciais da OpenAI na Evolution API 
              para que o bot possa responder mensagens.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
