import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { OpenAIConfigCard } from '@/components/shared/OpenAIConfigCard';

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

export function StoreOpenAIConfigModal({ 
  open, 
  onOpenChange, 
  store,
  onSaved 
}: StoreOpenAIConfigModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Configurar OpenAI - {store.name}</DialogTitle>
        </DialogHeader>
        <OpenAIConfigCard 
          context="store" 
          storeId={store.id} 
          storeName={store.name}
          onSaved={() => {
            onSaved?.();
            onOpenChange(false);
          }}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
