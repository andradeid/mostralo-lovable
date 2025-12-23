import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Printer, MessageCircle, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ExternalReceiptActionsProps {
  receiptRef: React.RefObject<HTMLDivElement>;
  invoice: {
    id: string;
    amount: number;
    paid_at: string | null;
    external_clients: {
      name: string;
    } | null;
  };
}

export function ExternalReceiptActions({ receiptRef, invoice }: ExternalReceiptActionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const receiptUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/external-receipt/${invoice.id}` 
    : '';

  // Print/PDF
  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const content = receiptRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${invoice.external_clients?.name || 'Mostralo'}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            @media print {
              body { padding: 0; }
              @page { size: A5; margin: 10mm; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [receiptRef, invoice.external_clients?.name]);

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      toast.success('Link copiado!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar link');
    }
  }, [receiptUrl]);

  // Share WhatsApp
  const handleShareWhatsApp = useCallback(() => {
    const message = `✅ *Recibo de Pagamento - Mostralo*

Pagamento confirmado!

👤 Cliente: ${invoice.external_clients?.name || 'N/A'}
💰 Valor: ${formatCurrency(invoice.amount)}
📅 Pago em: ${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('pt-BR') : 'N/A'}

📄 Ver recibo completo:
${receiptUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [invoice, receiptUrl]);

  // Share Email
  const handleShareEmail = useCallback(() => {
    const subject = `Recibo de Pagamento - ${invoice.external_clients?.name || 'Mostralo'}`;
    const body = `Olá!

Segue o recibo do pagamento realizado:

Cliente: ${invoice.external_clients?.name || 'N/A'}
Valor: ${formatCurrency(invoice.amount)}
Data: ${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('pt-BR') : 'N/A'}

Acesse o recibo completo: ${receiptUrl}

Atenciosamente,
Mostralo`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }, [invoice, receiptUrl]);

  // Native Share (mobile)
  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      toast.error('Compartilhamento não suportado neste navegador');
      return;
    }

    try {
      await navigator.share({
        title: `Recibo de Pagamento - ${invoice.external_clients?.name || 'Mostralo'}`,
        text: `Pagamento de ${formatCurrency(invoice.amount)} confirmado!`,
        url: receiptUrl,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
      }
    }
  }, [invoice, receiptUrl]);

  const canShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className="space-y-3">
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir/PDF</span>
        </Button>
        <Button 
          onClick={handleCopyLink}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          <span>Copiar Link</span>
        </Button>
      </div>

      {/* Share Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={handleShareWhatsApp}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </Button>
        <Button 
          onClick={handleShareEmail}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          <span>Email</span>
        </Button>
      </div>

      {/* Native Share (mobile) */}
      {canShare && (
        <Button 
          onClick={handleNativeShare}
          variant="secondary"
          className="w-full flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartilhar</span>
        </Button>
      )}
    </div>
  );
}
