import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

export type PersonalityType = 'professional' | 'friendly' | 'fun' | 'consultive';
export type EmojiLevel = 'none' | 'moderate' | 'abundant';

export interface PersonalitySettings {
  personality: PersonalityType;
  emojiLevel: EmojiLevel;
  customGreeting: string;
}

interface BotPersonalityCardProps {
  settings: PersonalitySettings;
  onSettingsChange: (settings: PersonalitySettings) => void;
  disabled?: boolean;
}

const personalities: { value: PersonalityType; label: string; emoji: string; description: string; example: string }[] = [
  {
    value: 'professional',
    label: 'Profissional',
    emoji: '🎯',
    description: 'Formal, objetivo e direto ao ponto',
    example: 'Boa tarde! Como posso ajudá-lo hoje?',
  },
  {
    value: 'friendly',
    label: 'Amigável',
    emoji: '😊',
    description: 'Acolhedor, simpático e caloroso',
    example: 'Oi! Que bom ter você aqui! Como posso te ajudar?',
  },
  {
    value: 'fun',
    label: 'Divertido',
    emoji: '🎉',
    description: 'Descontraído, usa gírias e é animado',
    example: 'E aííí! Beleza? Bora pedir algo gostoso?',
  },
  {
    value: 'consultive',
    label: 'Consultivo',
    emoji: '🤝',
    description: 'Especialista que faz perguntas e sugere',
    example: 'Olá! Me conta o que você busca que eu te indico as melhores opções!',
  },
];

const emojiLevels: { value: EmojiLevel; label: string; emoji: string; description: string }[] = [
  { value: 'none', label: 'Nenhum', emoji: '❌', description: 'Sem emojis' },
  { value: 'moderate', label: 'Moderado', emoji: '😊', description: '1-2 por mensagem' },
  { value: 'abundant', label: 'Abundante', emoji: '🎉', description: 'Vários emojis' },
];

export function BotPersonalityCard({ settings, onSettingsChange, disabled }: BotPersonalityCardProps) {
  const selectedPersonality = personalities.find(p => p.value === settings.personality);
  const selectedEmoji = emojiLevels.find(e => e.value === settings.emojiLevel);

  const getPreviewMessage = () => {
    const greeting = settings.customGreeting || selectedPersonality?.example || '';
    
    if (settings.emojiLevel === 'none') {
      return greeting.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    }
    
    if (settings.emojiLevel === 'abundant' && !greeting.includes('🎉')) {
      return `${greeting} 🎉✨`;
    }
    
    return greeting;
  };

  return (
    <Card className={disabled ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Personalidade do Bot
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Define como o bot se comunica com seus clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personalidade */}
        <div className="space-y-3">
          <Label className="text-xs sm:text-sm font-medium">Como o bot deve se comunicar?</Label>
          <RadioGroup
            value={settings.personality}
            onValueChange={(value) => onSettingsChange({ ...settings, personality: value as PersonalityType })}
            disabled={disabled}
            className="grid gap-2"
          >
            {personalities.map((p) => (
              <div
                key={p.value}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  settings.personality === p.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => !disabled && onSettingsChange({ ...settings, personality: p.value })}
              >
                <RadioGroupItem value={p.value} id={p.value} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji}</span>
                    <span className="font-medium text-sm">{p.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  <p className="text-xs italic text-muted-foreground/70 mt-1 truncate">"{p.example}"</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Nível de Emoji */}
        <div className="space-y-3">
          <Label className="text-xs sm:text-sm font-medium">Uso de Emojis</Label>
          <div className="flex flex-wrap gap-2">
            {emojiLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                disabled={disabled}
                onClick={() => onSettingsChange({ ...settings, emojiLevel: level.value })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  settings.emojiLevel === level.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>{level.emoji}</span>
                <span className="font-medium">{level.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedEmoji?.description}
          </p>
        </div>

        {/* Saudação Personalizada */}
        <div className="space-y-2">
          <Label htmlFor="customGreeting" className="text-xs sm:text-sm font-medium">
            Saudação Personalizada (opcional)
          </Label>
          <Input
            id="customGreeting"
            value={settings.customGreeting}
            onChange={(e) => onSettingsChange({ ...settings, customGreeting: e.target.value })}
            placeholder={selectedPersonality?.example}
            disabled={disabled}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para usar a saudação padrão da personalidade escolhida
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-medium">Preview da Saudação</Label>
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-sm italic">"{getPreviewMessage()}"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
