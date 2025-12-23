import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExternalInvoice {
  id: string;
  amount: number;
  description: string;
  due_date: string;
  paid_at: string | null;
  payment_status: string | null;
  invoice_number: string | null;
  client?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
}

interface SendExternalReceiptWhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: ExternalInvoice | null;
}

export function SendExternalReceiptWhatsAppModal({
  open,
  onOpenChange,
  invoice,
}: SendExternalReceiptWhatsAppModalProps) {
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  useEffect(() => {
    if (open && invoice) {
      setPhone(invoice.client?.phone || '');
      checkWhatsAppStatus();
    }
  }, [open, invoice]);

  const checkWhatsAppStatus = async () => {
    try {
      setWhatsAppStatus('loading');
      const { data, error } = await supabase
        .from('master_whatsapp_config')
        .select('instance_status')
        .limit(1)
        .single();

      if (error || !data) {
        setWhatsAppStatus('disconnected');
        return;
      }

      setWhatsAppStatus(data.instance_status === 'connected' ? 'connected' : 'disconnected');
    } catch {
      setWhatsAppStatus('disconnected');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMessagePreview = () => {
    if (!invoice) return '';

    const clientName = invoice.client?.name || 'Cliente';
    const serviceName = invoice.service?.name || invoice.description || 'Serviço';
    const amount = formatCurrency(invoice.amount);
    const paidDate = invoice.paid_at 
      ? format(new Date(invoice.paid_at), "dd/MM/yyyy", { locale: ptBR })
      : 'N/A';
    const invoiceNumber = invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase();
    const receiptLink = `${window.location.origin}/external-receipt/${invoice.id}`;

    return `✅ *Recibo de Pagamento - Mostralo*

Pagamento confirmado! 🎉

📄 *Recibo:* #${invoiceNumber}
👤 *Cliente:* ${clientName}
📋 *Serviço:* ${serviceName}
💰 *Valor:* ${amount}
📅 *Pago em:* ${paidDate}

📄 *Ver recibo completo:*
${receiptLink}

Obrigado pela confiança!`;
  };

  const handleSend = async () => {
    if (!invoice || !phone) {
      toast.error('Número de telefone é obrigatório');
      return;
    }

    if (whatsAppStatus !== 'connected') {
      toast.error('WhatsApp Master não está conectado');
      return;
    }

    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-external-receipt-whatsapp', {
        body: {
          invoice_id: invoice.id,
          phone_number: phone,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Recibo enviado por WhatsApp com sucesso!');
        onOpenChange(false);
      } else {
        throw new Error(data?.error || 'Erro ao enviar recibo');
      }
    } catch (error) {
      console.error('Erro ao enviar recibo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar recibo por WhatsApp');
    } finally {
      setIsSending(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar Recibo por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie o recibo da fatura #{invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()} para o cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status do WhatsApp */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">WhatsApp Master:</span>
            {whatsAppStatus === 'loading' ? (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando...
              </Badge>
            ) : whatsAppStatus === 'connected' ? (
              <Badge variant="default" className="gap-1 bg-green-600">
                <CheckCircle className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>

          {/* Campo de telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Preview da mensagem */}
          <div className="space-y-2">
            <Label>Preview da mensagem</Label>
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <pre className="text-xs whitespace-pre-wrap font-sans">
                  {getMessagePreview()}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSending || whatsAppStatus !== 'connected' || !phone}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Recibo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
