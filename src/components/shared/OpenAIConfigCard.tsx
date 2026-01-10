import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Key, 
  Eye, 
  EyeOff, 
  TestTube, 
  Save, 
  CheckCircle, 
  Sparkles,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AVAILABLE_MODELS = [
  { value: 'gpt-5-2025-08-07', label: '🚀 GPT-5 (Mais Poderoso)' },
  { value: 'gpt-5-mini-2025-08-07', label: '⚡ GPT-5 Mini (Rápido)' },
  { value: 'gpt-5-nano-2025-08-07', label: '💨 GPT-5 Nano (Ultra Rápido)' },
  { value: 'gpt-4.1-2025-04-14', label: '🎯 GPT-4.1 (Abril 2025)' },
  { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini' },
  { value: 'o3-2025-04-16', label: '🧠 O3 (Raciocínio Avançado)' },
  { value: 'o4-mini-2025-04-16', label: '🧠 O4 Mini (Raciocínio)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Recomendado)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];

interface OpenAIConfigCardProps {
  context: 'master' | 'store';
  storeId?: string;
  storeName?: string;
  configId?: string;
  onSaved?: () => void;
  className?: string;
}

export function OpenAIConfigCard({ 
  context, 
  storeId, 
  storeName,
  configId,
  onSaved,
  className 
}: OpenAIConfigCardProps) {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4-turbo');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isEnabled, setIsEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [syncingCreds, setSyncingCreds] = useState(false);
  const [hasCredsId, setHasCredsId] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [context, storeId, configId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      if (context === 'master') {
        // Buscar config do master_whatsapp_config
        const { data: masterConfig } = await supabase
          .from('master_whatsapp_config')
          .select('openai_api_key')
          .single();

        // Buscar modelo e tokens do evolution_config
        const { data: evolutionConfig } = await supabase
          .from('evolution_config')
          .select('openai_default_model, openai_max_tokens, openai_creds_id')
          .eq('is_active', true)
          .single();

        if (masterConfig) {
          setHasExistingKey(!!masterConfig.openai_api_key);
        }
        if (evolutionConfig) {
          setModel(evolutionConfig.openai_default_model || 'gpt-4-turbo');
          setMaxTokens(evolutionConfig.openai_max_tokens || 1000);
          setHasCredsId(!!evolutionConfig.openai_creds_id);
        }
      } else if (context === 'store' && storeId) {
        // Buscar config da loja
        const { data: storeConfig } = await supabase
          .from('stores')
          .select('openai_api_key')
          .eq('id', storeId)
          .single();

        // Buscar modelo global do evolution_config
        const { data: evolutionConfig } = await supabase
          .from('evolution_config')
          .select('openai_default_model, openai_max_tokens')
          .eq('is_active', true)
          .single();

        if (storeConfig) {
          setHasExistingKey(!!storeConfig.openai_api_key);
        }
        if (evolutionConfig) {
          setModel(evolutionConfig.openai_default_model || 'gpt-4-turbo');
          setMaxTokens(evolutionConfig.openai_max_tokens || 1000);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim() || '';
    
    if (!keyToTest && !hasExistingKey) {
      toast.error('Digite a chave da API');
      return;
    }

    setTestingKey(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-credentials-sync', {
        body: {
          action: 'test',
          openaiApiKey: keyToTest || undefined,
          useSavedKey: !keyToTest && hasExistingKey,
        },
      });

      if (error) {
        console.error('Erro ao testar chave:', error);
        toast.error(error.message || 'Erro ao testar a chave');
        return;
      }

      if (data?.success) {
        toast.success('✅ Chave válida! A API da OpenAI está funcionando.');
      } else {
        toast.error(data?.error || 'Chave inválida');
      }
    } catch (error) {
      console.error('Erro ao testar chave:', error);
      toast.error('Erro ao testar a chave');
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim() && isEditing) {
      toast.error('Digite a chave da API');
      return;
    }

    setSavingKey(true);
    try {
      if (context === 'master') {
        // Salvar API Key no master_whatsapp_config
        const { error: masterError } = await supabase
          .from('master_whatsapp_config')
          .update({ 
            openai_api_key: apiKey.trim() || undefined,
            updated_at: new Date().toISOString()
          })
          .not('id', 'is', null);

        if (masterError) throw masterError;

        // Salvar modelo e tokens no evolution_config
        const { error: evolutionError } = await supabase
          .from('evolution_config')
          .update({ 
            openai_default_model: model,
            openai_max_tokens: maxTokens,
            updated_at: new Date().toISOString()
          })
          .eq('is_active', true);

        if (evolutionError) throw evolutionError;

        toast.success('✅ Configuração OpenAI salva!');
      } else if (context === 'store' && storeId) {
        // Salvar na loja
        const { error } = await supabase
          .from('stores')
          .update({ 
            openai_api_key: apiKey.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId);

        if (error) throw error;

        toast.success('✅ API Key OpenAI salva para a loja!');
      }

      setApiKey('');
      setIsEditing(false);
      setHasExistingKey(true);
      onSaved?.();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    setSavingKey(true);
    try {
      if (context === 'master') {
        const { error } = await supabase
          .from('master_whatsapp_config')
          .update({ 
            openai_api_key: null,
            updated_at: new Date().toISOString()
          })
          .not('id', 'is', null);

        if (error) throw error;
      } else if (context === 'store' && storeId) {
        const { error } = await supabase
          .from('stores')
          .update({ 
            openai_api_key: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId);

        if (error) throw error;
      }

      toast.success('API Key removida');
      setHasExistingKey(false);
      setApiKey('');
      onSaved?.();
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover API Key');
    } finally {
      setSavingKey(false);
    }
  };

  // Sincronizar credenciais da Evolution API automaticamente
  const handleSyncEvolutionCreds = async () => {
    setSyncingCreds(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-evolution-creds');

      if (error) {
        console.error('Erro ao sincronizar:', error);
        toast.error(error.message || 'Erro ao sincronizar credenciais');
        return;
      }

      if (data?.success) {
        toast.success(`✅ Credenciais sincronizadas! ID: ${data.openai_creds_id}`);
        setHasCredsId(true);
        fetchConfig(); // Recarregar dados
        onSaved?.();
      } else {
        toast.error(data?.error || 'Falha ao sincronizar');
        if (data?.hint) {
          toast.info(data.hint);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar credenciais da Evolution');
    } finally {
      setSyncingCreds(false);
    }
  };

  const title = context === 'master' 
    ? 'Configurar OpenAI' 
    : `Configurar OpenAI${storeName ? ` - ${storeName}` : ''}`;

  const description = context === 'master'
    ? 'Configure suas credenciais da OpenAI para os bots'
    : 'Configure a API Key OpenAI específica para esta loja';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status atual */}
            {hasExistingKey && (
              <div className="p-3 rounded-lg flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">API Key configurada!</span>
              </div>
            )}

            {/* Campo de API Key */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4" />
                API Key *
              </Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={hasExistingKey && !isEditing ? '' : 'sk-proj-xxxxxxxxxxxxxxxxxxxx'}
                  value={hasExistingKey && !isEditing ? '●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●' : apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setIsEditing(true);
                  }}
                  className="pr-10 text-sm font-mono"
                  readOnly={hasExistingKey && !isEditing}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => {
                    if (hasExistingKey && !isEditing) {
                      setIsEditing(true);
                      setApiKey('');
                    } else {
                      setShowApiKey(!showApiKey);
                    }
                  }}
                >
                  {hasExistingKey && !isEditing ? (
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
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Obter chave
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Modelo e Max Tokens - só para Master */}
            {context === 'master' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Modelo</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
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
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                    min={100}
                    max={4000}
                  />
                </div>
              </div>
            )}

            {/* Info para lojas */}
            {context === 'store' && (
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p>O modelo e max tokens são configurados globalmente no painel Master.</p>
              </div>
            )}

            {/* Status da integração - só para Master */}
            {context === 'master' && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Status da Integração</Label>
                  <p className="text-xs text-muted-foreground">Ativar/desativar uso da OpenAI</p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={testingKey || (!apiKey.trim() && !hasExistingKey)}
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
                disabled={savingKey || (!apiKey.trim() && !isEditing && !hasExistingKey)}
                className="flex-1"
              >
                {savingKey ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
              {hasExistingKey && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveKey}
                  disabled={savingKey}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Sincronização Evolution - só para Master */}
            {context === 'master' && (
              <div className="space-y-2">
                <div className={`p-3 rounded-lg flex items-center justify-between ${hasCredsId ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                  <div className="flex items-center gap-2">
                    {hasCredsId ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className={`text-sm font-medium ${hasCredsId ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {hasCredsId ? 'Evolution Creds ID configurado' : 'Evolution Creds ID não configurado'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncEvolutionCreds}
                    disabled={syncingCreds}
                  >
                    {syncingCreds ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Busca automaticamente o ID das credenciais OpenAI da Evolution API
                </p>
              </div>
            )}

            {/* Info box */}
            {context === 'master' && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                <p>ℹ️ A credencial será usada automaticamente pelos bots de Vendas, Recrutamento e Suporte quando ativados.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
