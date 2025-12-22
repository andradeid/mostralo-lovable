import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bell, Loader2, Palette, Layout, Clock, History, Volume2, Mic, ExternalLink, Play, MessageSquare, Sparkles } from 'lucide-react';
import { PasswordCallConfig } from '@/hooks/usePasswordCallConfig';
import { elevenLabsVoices, speakWithWebSpeech, speakWithElevenLabs, getCallText, playBeepSound } from '@/utils/passwordCallTTS';
import { useToast } from '@/hooks/use-toast';

interface PasswordCallConfigPanelProps {
  config: PasswordCallConfig | null;
  onSave: (updates: Partial<PasswordCallConfig>) => Promise<boolean>;
}

const templates = [
  { value: 'classic', label: 'Clássico', description: 'Fundo escuro, número grande' },
  { value: 'modern', label: 'Moderno', description: 'Gradiente com efeito pulse' },
  { value: 'minimalist', label: 'Minimalista', description: 'Discreto e elegante' },
  { value: 'festive', label: 'Festivo', description: 'Com animação de confetti' },
  { value: 'corporate', label: 'Corporativo', description: 'Profissional com logo' },
];

const callTypes = [
  { value: 'password', label: 'Senha' },
  { value: 'order', label: 'Pedido' },
  { value: 'table', label: 'Mesa' },
];

const audioTypes = [
  { value: 'beep', label: 'Beep simples', description: 'Som de notificação padrão' },
  { value: 'web_speech', label: 'Voz sintetizada (gratuito)', description: 'Usa Web Speech API do navegador' },
  { value: 'elevenlabs', label: 'Voz premium (ElevenLabs)', description: 'Voz natural, requer API key' },
];

const voiceTextTemplates = [
  { value: 'simple', label: 'Simples', example: 'Senha 42' },
  { value: 'counter', label: 'Balcão', example: 'Senha 42, compareça ao balcão' },
  { value: 'pickup', label: 'Retirada', example: 'Pedido 42 pronto para retirada' },
];

export function PasswordCallConfigPanel({ config, onSave }: PasswordCallConfigPanelProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Estados existentes
  const [isEnabled, setIsEnabled] = useState(config?.is_enabled ?? false);
  const [callType, setCallType] = useState(config?.call_type ?? 'password');
  const [template, setTemplate] = useState(config?.template ?? 'classic');
  const [showHistory, setShowHistory] = useState(config?.show_history ?? true);
  const [historyCount, setHistoryCount] = useState(config?.history_count ?? 7);
  const [highlightDuration, setHighlightDuration] = useState((config?.highlight_duration_ms ?? 5000) / 1000);
  const [soundEnabled, setSoundEnabled] = useState(config?.sound_enabled ?? true);
  const [primaryColor, setPrimaryColor] = useState(config?.primary_color ?? '#f97316');
  
  // Estados de áudio
  const [audioType, setAudioType] = useState<'beep' | 'web_speech' | 'elevenlabs'>(config?.audio_type ?? 'beep');
  const [voiceTextTemplate, setVoiceTextTemplate] = useState<'simple' | 'counter' | 'pickup'>(config?.voice_text_template ?? 'simple');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(config?.elevenlabs_voice_id ?? '');

  // Estados de texto personalizado
  const [customTextEnabled, setCustomTextEnabled] = useState(config?.custom_text_enabled ?? false);
  const [customTextTemplate, setCustomTextTemplate] = useState(config?.custom_text_template ?? 'Atenção! {tipo} {numero} está pronto!');
  const [customPrefix, setCustomPrefix] = useState(config?.custom_prefix ?? '');
  const [customSuffix, setCustomSuffix] = useState(config?.custom_suffix ?? '');
  const [useGreeting, setUseGreeting] = useState(config?.use_greeting ?? false);

  // Sync com config externo
  useEffect(() => {
    if (config) {
      setIsEnabled(config.is_enabled);
      setCallType(config.call_type);
      setTemplate(config.template);
      setShowHistory(config.show_history);
      setHistoryCount(config.history_count);
      setHighlightDuration(config.highlight_duration_ms / 1000);
      setSoundEnabled(config.sound_enabled);
      setPrimaryColor(config.primary_color);
      setAudioType(config.audio_type ?? 'beep');
      setVoiceTextTemplate(config.voice_text_template ?? 'simple');
      setElevenLabsVoiceId(config.elevenlabs_voice_id ?? '');
      setCustomTextEnabled(config.custom_text_enabled ?? false);
      setCustomTextTemplate(config.custom_text_template ?? 'Atenção! {tipo} {numero} está pronto!');
      setCustomPrefix(config.custom_prefix ?? '');
      setCustomSuffix(config.custom_suffix ?? '');
      setUseGreeting(config.use_greeting ?? false);
    }
  }, [config]);

  // Preview em tempo real
  const previewText = useMemo(() => {
    const callTypeLabel = callTypes.find(t => t.value === callType)?.label || 'Senha';
    return getCallText(voiceTextTemplate, callType, 42, {
      customTextEnabled,
      customTemplate: customTextTemplate,
      prefix: customPrefix,
      suffix: customSuffix,
      useGreeting,
    });
  }, [callType, voiceTextTemplate, customTextEnabled, customTextTemplate, customPrefix, customSuffix, useGreeting]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      is_enabled: isEnabled,
      call_type: callType as 'password' | 'order' | 'table',
      template: template as 'classic' | 'modern' | 'minimalist' | 'festive' | 'corporate',
      show_history: showHistory,
      history_count: historyCount,
      highlight_duration_ms: highlightDuration * 1000,
      sound_enabled: soundEnabled,
      primary_color: primaryColor,
      audio_type: audioType,
      voice_text_template: voiceTextTemplate,
      elevenlabs_voice_id: elevenLabsVoiceId || null,
      custom_text_enabled: customTextEnabled,
      custom_text_template: customTextTemplate,
      custom_prefix: customPrefix || null,
      custom_suffix: customSuffix || null,
      use_greeting: useGreeting,
    });
    setSaving(false);
  };

  const handleTestAudio = async () => {
    setTesting(true);
    const testText = getCallText(voiceTextTemplate, callType, 42, {
      customTextEnabled,
      customTemplate: customTextTemplate,
      prefix: customPrefix,
      suffix: customSuffix,
      useGreeting,
    });
    
    try {
      if (audioType === 'beep') {
        playBeepSound();
      } else if (audioType === 'web_speech') {
        await speakWithWebSpeech(testText);
      } else if (audioType === 'elevenlabs') {
        await speakWithElevenLabs(testText, elevenLabsVoiceId || 'JBFqnCBsd6RMkjVDRZzb');
      }
      toast({ title: 'Áudio reproduzido!' });
    } catch (error) {
      console.error('Erro ao testar áudio:', error);
      toast({ title: 'Erro ao reproduzir áudio', variant: 'destructive' });
    }
    setTesting(false);
  };

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold">Chamada de Senhas</span>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure como as senhas aparecem no painel público
        </p>
      </div>
      <div className="p-4 space-y-6">
        {/* Tipo de Chamada */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Tipo de Chamada
          </Label>
          <Select value={callType} onValueChange={(val) => setCallType(val as 'password' | 'order' | 'table')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {callTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Visual */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Template Visual
          </Label>
          <Select value={template} onValueChange={(val) => setTemplate(val as 'classic' | 'modern' | 'minimalist' | 'festive' | 'corporate')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Histórico */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Mostrar Histórico
            </Label>
            <Switch
              checked={showHistory}
              onCheckedChange={setShowHistory}
            />
          </div>

          {showHistory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantidade no histórico</span>
                <span className="font-medium">{historyCount}</span>
              </div>
              <Slider
                value={[historyCount]}
                onValueChange={([val]) => setHistoryCount(val)}
                min={1}
                max={10}
                step={1}
              />
            </div>
          )}
        </div>

        {/* Duração do Destaque */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duração do Pop-up
            </Label>
            <span className="font-medium">{highlightDuration}s</span>
          </div>
          <Slider
            value={[highlightDuration]}
            onValueChange={([val]) => setHighlightDuration(val)}
            min={3}
            max={15}
            step={1}
          />
        </div>

        {/* Som */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Som de Notificação
          </Label>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>

        {/* Configurações de Áudio (expandido quando som ativado) */}
        {soundEnabled && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mic className="h-4 w-4" />
              Configurações de Áudio
            </div>

            {/* Tipo de Áudio */}
            <div className="space-y-2">
              <Label>Tipo de Áudio</Label>
              <Select value={audioType} onValueChange={(val) => setAudioType(val as 'beep' | 'web_speech' | 'elevenlabs')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audioTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template de Texto (para voz) - só mostra se NÃO está usando texto personalizado */}
            {(audioType === 'web_speech' || audioType === 'elevenlabs') && !customTextEnabled && (
              <div className="space-y-2">
                <Label>Texto da Chamada</Label>
                <Select value={voiceTextTemplate} onValueChange={(val) => setVoiceTextTemplate(val as 'simple' | 'counter' | 'pickup')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceTextTemplates.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <p className="font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground">"{t.example}"</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Texto Personalizado (para voz) */}
            {(audioType === 'web_speech' || audioType === 'elevenlabs') && (
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Texto Personalizado
                  </Label>
                  <Switch
                    checked={customTextEnabled}
                    onCheckedChange={setCustomTextEnabled}
                  />
                </div>

                {customTextEnabled && (
                  <div className="space-y-4 p-3 bg-background rounded-lg border">
                    {/* Template personalizado */}
                    <div className="space-y-2">
                      <Label className="text-xs">Mensagem Principal</Label>
                      <Textarea
                        value={customTextTemplate}
                        onChange={(e) => setCustomTextTemplate(e.target.value)}
                        placeholder="Atenção! {tipo} {numero} está pronto!"
                        className="min-h-[60px] text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use <code className="bg-muted px-1 rounded">{'{tipo}'}</code> para Senha/Pedido/Mesa e{' '}
                        <code className="bg-muted px-1 rounded">{'{numero}'}</code> para o número chamado.
                      </p>
                    </div>

                    {/* Prefixo */}
                    <div className="space-y-2">
                      <Label className="text-xs">Prefixo (opcional)</Label>
                      <Input
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                        placeholder="Ex: Olá cliente!"
                        className="text-sm"
                      />
                    </div>

                    {/* Sufixo */}
                    <div className="space-y-2">
                      <Label className="text-xs">Sufixo (opcional)</Label>
                      <Input
                        value={customSuffix}
                        onChange={(e) => setCustomSuffix(e.target.value)}
                        placeholder="Ex: Obrigado pela preferência!"
                        className="text-sm"
                      />
                    </div>

                    {/* Saudação automática */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          Saudação Automática
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Adiciona "Bom dia/Boa tarde/Boa noite"
                        </p>
                      </div>
                      <Switch
                        checked={useGreeting}
                        onCheckedChange={setUseGreeting}
                      />
                    </div>

                    {/* Preview */}
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
                        <Volume2 className="h-3 w-3" />
                        Preview do Áudio
                      </div>
                      <p className="text-sm italic">"{previewText}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Configurações ElevenLabs */}
            {audioType === 'elevenlabs' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✓ API Key configurada de forma segura no servidor
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A chave está protegida nas Secrets do Supabase e nunca é exposta ao navegador.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Voz</Label>
                  <Select value={elevenLabsVoiceId || 'onwK4e9ZLuTAKqWW03F9'} onValueChange={setElevenLabsVoiceId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                        Recomendadas para Português
                      </div>
                      {elevenLabsVoices.filter(v => v.category === 'recomendada').map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div>
                            <p className="font-medium">{voice.name}</p>
                            <p className="text-xs text-muted-foreground">{voice.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                        Outras Vozes Multilíngues
                      </div>
                      {elevenLabsVoices.filter(v => v.category === 'multilingual').map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div>
                            <p className="font-medium">{voice.name}</p>
                            <p className="text-xs text-muted-foreground">{voice.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modelo multilingual_v2 fala português automaticamente.{' '}
                    <a 
                      href="https://elevenlabs.io/app/voice-library" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ver mais vozes <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Botão Testar */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestAudio}
              disabled={testing}
              className="w-full"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Áudio
            </Button>
          </div>
        )}

        {/* Cor Principal */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor Principal
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1"
              placeholder="#f97316"
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <Button 
          className="w-full" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
