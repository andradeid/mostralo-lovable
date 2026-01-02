import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, RotateCcw, ExternalLink } from 'lucide-react';
import { POPUP_VARIATIONS } from '@/components/landing/diagnosticPopupVariations';
import { PopupPreviewDialog } from './PopupPreviewDialog';
import { toast } from 'sonner';

export const PopupPreviewSection = () => {
  const [previewVariation, setPreviewVariation] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isPopupEnabled, setIsPopupEnabled] = useState(() => {
    return localStorage.getItem('popup_ab_enabled') !== 'false';
  });

  const handleTogglePopup = (enabled: boolean) => {
    localStorage.setItem('popup_ab_enabled', String(enabled));
    setIsPopupEnabled(enabled);
    toast.success(enabled ? 'Popup ativado' : 'Popup desativado');
  };

  const handleResetSession = () => {
    sessionStorage.removeItem('popup_shown');
    sessionStorage.removeItem('popup_variation');
    sessionStorage.removeItem('popup_session_id');
    toast.success('Sessão resetada! Acesse a landing page para ver o popup novamente.');
  };

  const handleOpenInNewTab = (variation: 'A' | 'B' | 'C' | 'D') => {
    window.open(`/?popup_preview=${variation}`, '_blank');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Ferramentas de Teste
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Visualize as variações e controle o popup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle de ativação */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="popup-toggle" className="text-sm font-medium">
                Popup Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Controla se o popup aparece na landing page (seu navegador)
              </p>
            </div>
            <Switch
              id="popup-toggle"
              checked={isPopupEnabled}
              onCheckedChange={handleTogglePopup}
            />
          </div>

          {/* Botões de preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Preview das Variações</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((v) => (
                <div key={v} className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setPreviewVariation(v)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Var. {v}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[10px] h-6 text-muted-foreground"
                    onClick={() => handleOpenInNewTab(v)}
                  >
                    <ExternalLink className="h-2.5 w-2.5 mr-1" />
                    Nova aba
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Textos resumidos das variações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((v) => (
              <div key={v} className="p-2 border rounded text-xs">
                <span className="font-bold text-primary">Var. {v}:</span>{' '}
                <span className="text-muted-foreground line-clamp-1">
                  {POPUP_VARIATIONS[v].title}
                </span>
              </div>
            ))}
          </div>

          {/* Botão de reset */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleResetSession}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Resetar Sessão (ver popup novamente na landing)
          </Button>
        </CardContent>
      </Card>

      <PopupPreviewDialog
        variation={previewVariation}
        onClose={() => setPreviewVariation(null)}
      />
    </>
  );
};
