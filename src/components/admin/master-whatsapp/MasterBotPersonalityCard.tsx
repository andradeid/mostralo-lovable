import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Briefcase, SmilePlus, PartyPopper, GraduationCap, X, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotPersonality, BotEmojiUsage } from "@/hooks/useMasterWhatsAppConfig";

interface MasterBotPersonalityCardProps {
  botName: string;
  personality: BotPersonality;
  emojiUsage: BotEmojiUsage;
  customGreeting: string;
  onBotNameChange: (name: string) => void;
  onPersonalityChange: (p: BotPersonality) => void;
  onEmojiUsageChange: (e: BotEmojiUsage) => void;
  onCustomGreetingChange: (g: string) => void;
}

const personalities: {
  value: BotPersonality;
  label: string;
  icon: typeof Briefcase;
  description: string;
  example: string;
}[] = [
  { value: 'profissional', label: 'Profissional', icon: Briefcase, description: 'Formal, objetivo e direto ao ponto', example: '"Olá! Como posso ajudá-lo hoje?"' },
  { value: 'amigavel', label: 'Amigável', icon: SmilePlus, description: 'Acolhedor, simpático e caloroso', example: '"Oi! Que bom ter você aqui! Como posso te ajudar?"' },
  { value: 'divertido', label: 'Divertido', icon: PartyPopper, description: 'Descontraído, usa gírias e é animado', example: '"E aííí! Beleza? Bora pedir algo gostoso?"' },
  { value: 'consultivo', label: 'Consultivo', icon: GraduationCap, description: 'Especialista que faz perguntas e sugere', example: '"Olá! Me conta o que você busca que eu te indico as melhores opções!"' },
];

const emojiOptions: { value: BotEmojiUsage; label: string; icon: typeof X; description: string }[] = [
  { value: 'nenhum', label: 'Nenhum', icon: X, description: 'Sem emojis' },
  { value: 'moderado', label: 'Moderado', icon: Smile, description: 'Emojis ocasionais' },
  { value: 'abundante', label: 'Abundante', icon: PartyPopper, description: 'Vários emojis' },
];

function getGreetingPreview(personality: BotPersonality, customGreeting: string, emojiUsage: BotEmojiUsage): string {
  if (customGreeting.trim()) {
    const emojis = emojiUsage === 'abundante' ? ' 🎉✨' : emojiUsage === 'moderado' ? ' 😊' : '';
    return `"${customGreeting}${emojis}"`;
  }
  const p = personalities.find(p => p.value === personality);
  return p?.example || '';
}

export function MasterBotPersonalityCard({
  botName,
  personality,
  emojiUsage,
  customGreeting,
  onBotNameChange,
  onPersonalityChange,
  onEmojiUsageChange,
  onCustomGreetingChange,
}: MasterBotPersonalityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Personalidade do Assistente</CardTitle>
        </div>
        <CardDescription>Define como o assistente se comunica em todos os bots</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome do Assistente */}
        <div className="space-y-2">
          <Label className="font-medium">Nome do Assistente</Label>
          <Input
            value={botName}
            onChange={(e) => onBotNameChange(e.target.value)}
            placeholder="Ex: Luna, Max, Bella..."
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            Este nome será usado por todos os bots (Vendas, Recrutamento e Suporte).
          </p>
        </div>

        {/* Personalidade */}
        <div className="space-y-3">
          <Label className="font-medium">Como o assistente deve se comunicar?</Label>
          <div className="space-y-2">
            {personalities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPersonalityChange(p.value)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left",
                  personality === p.value
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="mt-0.5">
                  <input
                    type="radio"
                    checked={personality === p.value}
                    onChange={() => onPersonalityChange(p.value)}
                    className="accent-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p.icon className={cn("w-4 h-4", personality === p.value ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium text-sm">{p.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.description}</span>
                  <p className="text-xs text-primary/70 italic mt-0.5">{p.example}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Uso de Emojis */}
        <div className="space-y-2">
          <Label className="font-medium">Uso de Emojis</Label>
          <div className="flex gap-2 flex-wrap">
            {emojiOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant={emojiUsage === opt.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer gap-1.5 px-3 py-1.5 text-sm transition-all",
                  emojiUsage === opt.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => onEmojiUsageChange(opt.value)}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{emojiOptions.find(e => e.value === emojiUsage)?.description}</p>
        </div>

        {/* Saudação Personalizada */}
        <div className="space-y-2">
          <Label className="font-medium">Saudação Personalizada (opcional)</Label>
          <Input
            value={customGreeting}
            onChange={(e) => onCustomGreetingChange(e.target.value)}
            placeholder="Deixe em branco para usar a saudação padrão da personalidade escolhida"
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para usar a saudação padrão da personalidade escolhida
          </p>
        </div>

        {/* Preview da Saudação */}
        <div className="space-y-1.5">
          <Label className="font-medium text-xs">Preview da Saudação</Label>
          <div className="p-3 rounded-lg border bg-primary/5 text-sm text-primary italic">
            {getGreetingPreview(personality, customGreeting, emojiUsage)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
