import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Plus, Trash2, Pill, Loader2, PackageSearch } from "lucide-react";
import { useBotConversationalSettings } from "@/hooks/useBotConversationalSettings";

interface BotConversationalSettingsCardProps {
  storeId: string;
  disabled?: boolean;
}

export function BotConversationalSettingsCard({ storeId, disabled }: BotConversationalSettingsCardProps) {
  const { settings, loading, saving, saveSettings } = useBotConversationalSettings(storeId);
  const [newPhrase, setNewPhrase] = useState('');
  const [newUnavailablePhrase, setNewUnavailablePhrase] = useState('');

  const handleAddPhrase = () => {
    if (!newPhrase.trim()) return;
    saveSettings({ generic_phrases: [...settings.generic_phrases, newPhrase.trim()] });
    setNewPhrase('');
  };

  const handleRemovePhrase = (index: number) => {
    saveSettings({ generic_phrases: settings.generic_phrases.filter((_, i) => i !== index) });
  };

  const handleUpdatePhrase = (index: number, value: string) => {
    const updated = [...settings.generic_phrases];
    updated[index] = value;
    saveSettings({ generic_phrases: updated });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
          Configurações Conversacional
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure o comportamento do atendimento informal
        </p>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-4">
        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="never-links" className="text-xs sm:text-sm cursor-pointer">
              🚫 Nunca enviar links
            </Label>
            <Switch
              id="never-links"
              checked={settings.never_send_links}
              onCheckedChange={(v) => saveSettings({ never_send_links: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="send-photos" className="text-xs sm:text-sm cursor-pointer">
              📸 Enviar fotos dos produtos
            </Label>
            <Switch
              id="send-photos"
              checked={settings.send_product_photos}
              onCheckedChange={(v) => saveSettings({ send_product_photos: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="informal-tone" className="text-xs sm:text-sm cursor-pointer">
              😊 Tom informal e acolhedor
            </Label>
            <Switch
              id="informal-tone"
              checked={settings.informal_tone}
              onCheckedChange={(v) => saveSettings({ informal_tone: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="recommend-generics" className="text-xs sm:text-sm cursor-pointer">
              💊 Recomendar genéricos
            </Label>
            <Switch
              id="recommend-generics"
              checked={settings.recommend_generics}
              onCheckedChange={(v) => saveSettings({ recommend_generics: v })}
              disabled={disabled || saving}
            />
          </div>
        </div>

        {/* Mensagem de fechamento */}
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm font-medium">Mensagem de fechamento do pedido</Label>
          <Textarea
            value={settings.closing_message}
            onChange={(e) => saveSettings({ closing_message: e.target.value })}
            placeholder="Ex: Obrigada! Seu pedido será preparado 🙏"
            className="text-xs sm:text-sm min-h-[60px]"
            disabled={disabled || saving}
          />
        </div>

        {/* Frases de recomendação de genéricos */}
        {settings.recommend_generics && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-green-500 shrink-0" />
              <Label className="text-xs sm:text-sm font-medium">Frases de recomendação de genéricos</Label>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              O bot usará aleatoriamente uma dessas frases ao sugerir medicamentos genéricos
            </p>

            <div className="space-y-2">
              {settings.generic_phrases.map((phrase, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={phrase}
                    onChange={(e) => handleUpdatePhrase(index, e.target.value)}
                    className="flex-1 h-8 text-xs sm:text-sm"
                    disabled={disabled || saving}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemovePhrase(index)}
                    disabled={disabled || saving || settings.generic_phrases.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Nova frase de recomendação..."
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                className="flex-1 h-8 text-xs sm:text-sm"
                disabled={disabled || saving}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPhrase()}
              />
              <Button
                size="sm"
                onClick={handleAddPhrase}
                disabled={disabled || !newPhrase.trim() || saving}
                className="h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
