import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQRCode } from "@/hooks/useQRCode";

interface QRCodeDisplayProps {
  url: string;
  label: string;
  description?: string;
  size?: number;
  showActions?: boolean;
}

export function QRCodeDisplay({ 
  url, 
  label, 
  description,
  size = 150,
  showActions = true 
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const qrDataUrl = useQRCode(url, size);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-2 rounded-lg shadow-sm">
        {qrDataUrl ? (
          <img 
            src={qrDataUrl} 
            alt={`QR Code - ${label}`}
            width={size}
            height={size}
            className="block"
          />
        ) : (
          <div 
            className="animate-pulse bg-gray-200" 
            style={{ width: size, height: size }} 
          />
        )}
      </div>
      <div className="text-center">
        <p className="font-medium text-xs md:text-sm">{label}</p>
        {description && (
          <p className="text-[10px] md:text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {showActions && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="ml-1">Copiar</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-7 px-2 text-xs"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              <span className="ml-1">Abrir</span>
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
