import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Check, X, ExternalLink, Eye, EyeOff, TestTube, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionConfig {
  id: string;
  api_url: string;
  openai_creds_id: string | null;
  openai_default_model: string | null;
  openai_max_tokens: number | null;
  is_active: boolean;
}

const AVAILABLE_MODELS = [
  // Mais Recentes (2025)
  { value: 'gpt-5-2025-08-07', label: '🚀 GPT-5 (Mais Poderoso)' },
  { value: 'gpt-5-mini-2025-08-07', label: '⚡ GPT-5 Mini (Rápido)' },
  { value: 'gpt-5-nano-2025-08-07', label: '💨 GPT-5 Nano (Ultra Rápido)' },
  // GPT-4.1 (2025)
  { value: 'gpt-4.1-2025-04-14', label: '🎯 GPT-4.1 (Abril 2025)' },
  { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini' },
  // Reasoning Models
  { value: 'o3-2025-04-16', label: '🧠 O3 (Raciocínio Avançado)' },
  { value: 'o4-mini-2025-04-16', label: '🧠 O4 Mini (Raciocínio)' },
  // Modelos Clássicos
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Recomendado)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];

export function OpenAIConfigCard() {
  const [config, setConfig] = useState<EvolutionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4-turbo');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [syncingKey, setSyncingKey] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_config')
        .select('id, api_url, openai_creds_id, openai_default_model, openai_max_tokens, is_active')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setConfig(data);
        if (data.openai_default_model) setModel(data.openai_default_model);
        if (data.openai_max_tokens) setMaxTokens(data.openai_max_tokens);
      }
    } catch (err) {
      console.error('Erro ao buscar config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite a chave da API');
      return;
    }

    setTestingKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/openai-credentials-sync',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'test',
            openaiApiKey: apiKey,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ Chave válida! A API da OpenAI está funcionando.');
      } else {
        toast.error(result.error || 'Chave inválida');
      }
    } catch (error: any) {
      console.error('Erro ao testar chave:', error);
      if (error.name === 'AbortError') {
        toast.error('Timeout: A requisição demorou muito');
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão: Verifique sua internet ou tente novamente');
      } else {
        toast.error('Erro ao testar a chave: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite a chave da API');
      return;
    }

    setSavingKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(
        'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/openai-credentials-sync',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'save',
            openaiApiKey: apiKey,
            model,
            maxTokens,
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ Chave salva com sucesso! Campo limpo por segurança.');
        setApiKey('');
        fetchConfig();
      } else {
        toast.error(result.error || 'Erro ao salvar');
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      if (error.name === 'AbortError') {
        toast.error('Timeout: A requisição demorou muito');
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão: Verifique sua internet ou tente novamente');
      } else {
        toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setSavingKey(false);
    }
  };

  const handleSyncEvolution = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite a chave da API para sincronizar');
      return;
    }

    setSyncingKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(
        'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/openai-credentials-sync',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'sync',
            openaiApiKey: apiKey,
            model,
            maxTokens,
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ Sincronizado com Evolution! Campo limpo por segurança.');
        setApiKey('');
        fetchConfig();
      } else {
        toast.error(result.error || 'Erro ao sincronizar');
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      if (error.name === 'AbortError') {
        toast.error('Timeout: A requisição demorou muito');
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão: Verifique sua internet ou tente novamente');
      } else {
        toast.error('Erro ao sincronizar: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setSyncingKey(false);
    }
  };

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
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          Configurar OpenAI
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Configure e sincronize suas credenciais da OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de Configuração */}
        <div className="space-y-4">
          {/* API Key - Campo Verde Completo quando Configurado */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm">API Key da OpenAI *</Label>
            
            {/* Campo Verde com Badge quando Configurado */}
            {hasOpenAI && !apiKey ? (
              <div className="relative">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border-2 border-green-500 rounded-lg transition-all duration-300">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-700 dark:text-green-400">✅ Chave Configurada</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Sua chave está salva com segurança</p>
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setApiKey(' ')}
                  className="text-xs text-muted-foreground mt-1 p-0 h-auto"
                >
                  Alterar chave →
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxx"
                  value={apiKey === ' ' ? '' : apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Obtenha em{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>

          {/* Modelo e Max Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm">Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens" className="text-sm">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={100}
                max={4000}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="text-sm"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Botão de Teste - Verde quando configurado */}
            {hasOpenAI && !apiKey ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 border-2 border-green-500 rounded-md transition-all duration-300">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">✓ Chave Válida</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={testingKey || !apiKey.trim() || apiKey === ' '}
                className="flex-1"
              >
                {testingKey ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Testar Chave
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveKey}
              disabled={savingKey || !apiKey.trim() || apiKey === ' '}
              className="flex-1"
            >
              {savingKey ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button
              size="sm"
              onClick={handleSyncEvolution}
              disabled={syncingKey || !apiKey.trim() || apiKey === ' '}
              className="flex-1"
            >
              {syncingKey ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar Evolution
            </Button>
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Status Atual</p>
          
          {/* Status Principal com Animação */}
          <div className={`flex items-center justify-between p-3 rounded-lg mb-3 transition-all duration-500 ${
            hasOpenAI 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {hasOpenAI ? (
                <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full animate-scale-in">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <X className="h-5 w-5 text-amber-500" />
              )}
              <span className={`font-medium text-sm ${hasOpenAI ? 'text-green-700 dark:text-green-400' : ''}`}>
                {hasOpenAI ? 'Credenciais Configuradas' : 'Credenciais Pendentes'}
              </span>
            </div>
            <Badge 
              variant={hasOpenAI ? 'default' : 'secondary'} 
              className={`text-xs transition-all duration-300 ${hasOpenAI ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {hasOpenAI ? '✅ Pronto' : '⚠️ Configurar'}
            </Badge>
          </div>

          {/* Grid de Configurações com Animações */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
              hasOpenAI ? 'bg-green-500/5 border border-green-500/20' : 'bg-muted/30'
            }`}>
              <p className="text-xs text-muted-foreground">Modelo</p>
              <p className={`font-medium text-xs sm:text-sm truncate ${hasOpenAI ? 'text-green-700 dark:text-green-400' : ''}`}>
                {config?.openai_default_model || 'gpt-4-turbo'}
              </p>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
              hasOpenAI ? 'bg-green-500/5 border border-green-500/20' : 'bg-muted/30'
            }`}>
              <p className="text-xs text-muted-foreground">Max Tokens</p>
              <p className={`font-medium text-xs sm:text-sm ${hasOpenAI ? 'text-green-700 dark:text-green-400' : ''}`}>
                {config?.openai_max_tokens || 1000}
              </p>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
              hasOpenAI ? 'bg-green-500/5 border border-green-500/20' : 'bg-muted/30'
            }`}>
              <p className="text-xs text-muted-foreground">Creds ID</p>
              <p className={`font-mono text-xs truncate ${hasOpenAI ? 'text-green-700 dark:text-green-400' : ''}`}>
                {config?.openai_creds_id ? `${config.openai_creds_id.slice(0, 8)}...` : 'Não configurado'}
              </p>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
              hasOpenAI ? 'bg-green-500/5 border border-green-500/20' : 'bg-muted/30'
            }`}>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`font-medium text-xs sm:text-sm flex items-center gap-1 ${hasOpenAI ? 'text-green-700 dark:text-green-400' : ''}`}>
                {config?.is_active ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
        </div>

        {/* Link para Evolution */}
        {config?.api_url && (
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            <a href={config.api_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Evolution API
            </a>
          </Button>
        )}

        {!hasOpenAI && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>⚠️ Ação necessária:</strong> Insira sua chave da OpenAI acima e clique em 
              "Sincronizar Evolution" para habilitar o bot.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
