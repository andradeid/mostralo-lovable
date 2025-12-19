import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Key, Eye, EyeOff, TestTube, Save, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoreOpenAIConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: {
    id: string;
    name: string;
    slug: string;
  };
  onSaved?: () => void;
}

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

export function StoreOpenAIConfigModal({ 
  open, 
  onOpenChange, 
  store,
  onSaved 
}: StoreOpenAIConfigModalProps) {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4-turbo');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStoreConfig();
    }
  }, [open, store.id]);

  const fetchStoreConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('openai_api_key')
        .eq('id', store.id)
        .single();

      if (!error && data) {
        setHasExistingKey(!!data.openai_api_key);
      }
    } catch (err) {
      console.error('Erro ao buscar config da loja:', err);
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
            openaiApiKey: keyToTest || undefined,
            useSavedKey: !keyToTest && hasExistingKey,
            storeId: store.id,
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
      // Salvar diretamente na tabela stores
      const { error } = await supabase
        .from('stores')
        .update({ 
          openai_api_key: apiKey.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('✅ API Key OpenAI salva para a loja!');
      setApiKey('');
      setIsEditing(false);
      setHasExistingKey(true);
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    setSavingKey(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ 
          openai_api_key: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('API Key removida da loja');
      setHasExistingKey(false);
      setApiKey('');
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover API Key');
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configurar OpenAI - {store.name}
          </DialogTitle>
          <DialogDescription>
            Configure a API Key OpenAI específica para esta loja
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status atual */}
            {hasExistingKey && (
              <div className="p-3 rounded-lg flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
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
                  className="pr-10 text-sm"
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
                  className="text-primary hover:underline"
                >
                  Obter chave
                </a>
              </p>
            </div>

            {/* Modelo e Max Tokens (info) */}
            <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
              <p>O modelo e max tokens são configurados globalmente na aba Evolution.</p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
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
              
              {hasExistingKey && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveKey}
                  disabled={savingKey}
                >
                  Remover API Key
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
