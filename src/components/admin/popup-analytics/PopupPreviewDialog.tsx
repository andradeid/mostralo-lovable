import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { POPUP_VARIATIONS } from '@/components/landing/diagnosticPopupVariations';

interface PopupPreviewDialogProps {
  variation: 'A' | 'B' | 'C' | 'D' | null;
  onClose: () => void;
}

export const PopupPreviewDialog = ({ variation, onClose }: PopupPreviewDialogProps) => {
  if (!variation) return null;

  const content = POPUP_VARIATIONS[variation];

  const highlightNao = (text: string) => {
    return text.replace(/NÃO/g, '<span class="text-red-500 font-bold">NÃO</span>');
  };

  return (
    <Dialog open={!!variation} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Preview Badge */}
        <Badge className="absolute top-2 left-2 z-10 bg-yellow-500 text-yellow-950">
          PREVIEW - Variação {variation}
        </Badge>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-muted transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6 pt-10 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Search className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">{content.title}</h2>
            <p 
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: highlightNao(content.subtitle) }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {content.description}
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full" onClick={onClose}>
              {content.ctaText}
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
              {content.closeText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
