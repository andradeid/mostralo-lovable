import { resolvePricingText, pricingCatalogText } from '@/components/pricing/PricingText';
import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { useState } from 'react';
import { Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface FeaturesCopyButtonProps {
  pageText: string;
}

export function FeaturesCopyButton({ pageText }: FeaturesCopyButtonProps) {
  const { plans: liveCatalogPlans } = useMostraloPlans();

  const [copied, setCopied] = useState(false);

  const copyPageText = async () => {
    try {
      await navigator.clipboard.writeText(resolvePricingText(pageText, liveCatalogPlans) + pricingCatalogText(liveCatalogPlans));
      setCopied(true);
      toast.success("Texto copiado para área de transferência!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar texto");
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden lg:block">
      <Button
        onClick={copyPageText}
        variant="outline"
        size="sm"
        className="gap-2 bg-background shadow-lg"
      >
        {copied ? <FileText className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copiado!' : 'Copiar Tudo'}
      </Button>
    </div>
  );
}
