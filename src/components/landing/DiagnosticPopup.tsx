import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { POPUP_VARIATIONS } from './diagnosticPopupVariations';
import { getRandomVariation, trackPopupEvent } from '@/hooks/usePopupAnalytics';

const POPUP_KEY = 'diagnostic_popup_shown';
const VARIATION_KEY = 'diagnostic_popup_variation';

export const DiagnosticPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [variation, setVariation] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se popup está desativado (toggle do admin)
    if (localStorage.getItem('popup_ab_enabled') === 'false') return;

    // Verificar modo preview via URL
    const params = new URLSearchParams(window.location.search);
    const previewVariation = params.get('popup_preview') as 'A' | 'B' | 'C' | 'D' | null;
    
    if (previewVariation && ['A', 'B', 'C', 'D'].includes(previewVariation)) {
      setVariation(previewVariation);
      setIsPreviewMode(true);
      setIsOpen(true);
      return;
    }

    // Se já foi mostrado nesta sessão, não mostrar novamente
    if (sessionStorage.getItem(POPUP_KEY)) return;

    // Recuperar ou sortear variação
    let selectedVariation = sessionStorage.getItem(VARIATION_KEY) as 'A' | 'B' | 'C' | 'D' | null;
    if (!selectedVariation) {
      selectedVariation = getRandomVariation();
      sessionStorage.setItem(VARIATION_KEY, selectedVariation);
    }
    setVariation(selectedVariation);

    // Mostrar popup após 4 segundos
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(POPUP_KEY, 'true');
      trackPopupEvent(selectedVariation!, 'shown');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleCTA = () => {
    if (!isPreviewMode) {
      trackPopupEvent(variation, 'clicked_cta');
    }
    setIsOpen(false);
    navigate('/diagnostico-delivery');
  };

  const handleClose = () => {
    if (!isPreviewMode) {
      trackPopupEvent(variation, 'closed');
    }
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (!isPreviewMode) {
        trackPopupEvent(variation, 'clicked_outside');
      }
      setIsOpen(false);
    }
  };

  const content = POPUP_VARIATIONS[variation];

  // Destacar a palavra "NÃO" no subtítulo
  const highlightedSubtitle = content.subtitle.replace(
    /NÃO/g,
    '<span class="text-destructive font-bold">NÃO</span>'
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        <div className="relative bg-gradient-to-br from-background via-background to-muted/30 p-6">
          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/80 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Ícone */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
          </div>

          <DialogHeader className="space-y-3 text-center">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {content.title}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p
                  className="text-base font-medium text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: highlightedSubtitle }}
                />
                <p className="text-sm text-muted-foreground">
                  {content.description}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Botões */}
          <div className="flex flex-col gap-2 mt-6">
            <Button
              onClick={handleCTA}
              className="w-full font-semibold"
              size="lg"
            >
              {content.ctaText}
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              size="sm"
            >
              {content.closeText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
