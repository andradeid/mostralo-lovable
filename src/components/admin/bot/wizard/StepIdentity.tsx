import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AssistantIdentity, PersonalityStyle, EmojiLevel } from "./types";

interface StepIdentityProps {
  value: AssistantIdentity;
  onChange: (identity: AssistantIdentity) => void;
}

const personalities: { value: PersonalityStyle; label: string; emoji: string; description: string; example: string }[] = [
  { value: 'professional', label: 'Profissional', emoji: '🎯', description: 'Formal e objetivo', example: 'Como posso ajudá-lo hoje?' },
  { value: 'friendly', label: 'Amigável', emoji: '😊', description: 'Acolhedor e simpático', example: 'Oi! Que bom ter você aqui!' },
  { value: 'fun', label: 'Divertido', emoji: '🎉', description: 'Descontraído e animado', example: 'E aííí! Beleza? Bora!' },
  { value: 'consultive', label: 'Consultivo', emoji: '🤝', description: 'Especialista que sugere', example: 'Me conta o que você busca!' },
];

const emojiLevels: { value: EmojiLevel; label: string; emoji: string; description: string }[] = [
  { value: 'none', label: 'Nenhum', emoji: '❌', description: 'Sem emojis' },
  { value: 'moderate', label: 'Moderado', emoji: '😊', description: '1-2 por mensagem' },
  { value: 'abundant', label: 'Abundante', emoji: '🎉', description: 'Vários emojis' },
];

export function StepIdentity({ value, onChange }: StepIdentityProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h3 className="text-sm sm:text-base font-semibold">Identidade do Assistente</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Como ele se apresenta e se comunica
        </p>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="bot-name" className="text-sm font-medium">Nome do Assistente</Label>
        <Input
          id="bot-name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Ex: Raquel, Ana, Carlos..."
          className="text-sm"
        />
      </div>

      {/* Personalidade */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Estilo de comunicação</Label>
        <div className="grid gap-2">
          {personalities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ ...value, personality: p.value })}
              className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg border transition-colors text-left ${
                value.personality === p.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <span className="text-lg">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{p.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Level */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Uso de Emojis</Label>
        <div className="flex gap-2">
          {emojiLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange({ ...value, emojiLevel: level.value })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors flex-1 justify-center ${
                value.emojiLevel === level.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <span>{level.emoji}</span>
              <span className="font-medium text-xs sm:text-sm">{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saudação */}
      <div className="space-y-2">
        <Label htmlFor="greeting" className="text-sm font-medium">
          Saudação personalizada <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="greeting"
          value={value.greeting}
          onChange={(e) => onChange({ ...value, greeting: e.target.value })}
          placeholder={personalities.find(p => p.value === value.personality)?.example}
          className="text-sm"
        />
      </div>
    </div>
  );
}
