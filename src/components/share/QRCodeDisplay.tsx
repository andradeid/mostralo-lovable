import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  
  // Usar API gratuita para gerar QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=svg`;

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
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <img 
          src={qrCodeUrl} 
          alt={`QR Code - ${label}`}
          width={size}
          height={size}
          className="block"
        />
      </div>
      <div className="text-center">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8"
          >
            {copied ? (
              <Check className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Copiar
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
