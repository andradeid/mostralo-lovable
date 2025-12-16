import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Sparkles, CheckCircle, Eye, EyeOff, TestTube, Save, Key, Info } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

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
    const testWithSavedKey = !apiKey.trim() && hasOpenAI;
    
    if (!apiKey.trim() && !hasOpenAI) {
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
            openaiApiKey: testWithSavedKey ? undefined : apiKey,
            useSavedKey: testWithSavedKey,
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
      toast.error('Erro ao testar a chave');
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
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ Configuração salva!');
        setApiKey('');
        setIsEditing(false);
        fetchConfig();
      } else {
        toast.error(result.error || 'Erro ao salvar');
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingKey(false);
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Configurar OpenAI
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Configure suas credenciais da OpenAI para o bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de API Key - Igual Evolution */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4" />
            API Key *
          </Label>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={hasOpenAI && !isEditing ? '' : 'sk-proj-xxxxxxxxxxxxxxxxxxxx'}
              value={hasOpenAI && !isEditing ? '●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●' : apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsEditing(true);
              }}
              className="pr-10 text-sm"
              readOnly={hasOpenAI && !isEditing}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => {
                if (hasOpenAI && !isEditing) {
                  setIsEditing(true);
                  setApiKey('');
                } else {
                  setShowApiKey(!showApiKey);
                }
              }}
            >
              {hasOpenAI && !isEditing ? (
                <Eye className="h-4 w-4" />
              ) : showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Token da API da OpenAI -{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Obter chave
            </a>
          </p>
        </div>

        {/* Modelo e Max Tokens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Modelo</Label>
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
          <div className="space-y-1.5">
            <Label className="text-sm">Max Tokens</Label>
            <Input
              type="number"
              min={100}
              max={4000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="text-sm"
            />
          </div>
        </div>

        {/* Switch Status da Integração - Igual Evolution */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-sm">Status da Integração</Label>
            <p className="text-xs text-muted-foreground">Ativar/desativar</p>
          </div>
          <Switch
            checked={config?.is_active || false}
            disabled
          />
        </div>

        {/* Badge Conectado! - Igual Evolution */}
        {hasOpenAI && (
          <div className="p-3 md:p-4 rounded-lg flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Conectado!</span>
          </div>
        )}

        {/* Botões de Ação - Empilhados Mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestKey}
            disabled={testingKey || (!apiKey.trim() && !hasOpenAI)}
            className="flex-1"
          >
            {testingKey ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Testar
          </Button>
          <Button
            size="sm"
            onClick={handleSaveKey}
            disabled={savingKey || (!apiKey.trim() && !isEditing)}
            className="flex-1"
          >
            {savingKey ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>

        {/* Info explicativo */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            A credencial será criada automaticamente na Evolution quando você ativar o bot na aba "🤖 Bot".
          </p>
        </div>

        {/* Info de configuração atual */}
        {hasOpenAI && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Configuração Atual</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Modelo:</span>
                <p className="font-medium truncate">{config?.openai_default_model || 'gpt-4-turbo'}</p>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Max Tokens:</span>
                <p className="font-medium">{config?.openai_max_tokens || 1000}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
