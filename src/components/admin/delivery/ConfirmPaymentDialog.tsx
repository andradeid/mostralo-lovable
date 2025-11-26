import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Upload, X, FileImage } from 'lucide-react';
import { formatCurrency } from '@/utils/driverEarnings';
import { useAuth } from '@/hooks/use-auth';

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earningIds: string[];
  totalAmount: number;
  driverName: string;
  driverId: string;
  onSuccess: () => void;
}

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  earningIds,
  totalAmount,
  driverName,
  driverId,
  onSuccess,
}: ConfirmPaymentDialogProps) {
  const { profile } = useAuth();
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG ou PDF.');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setReceiptFile(file);

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleConfirm = async () => {
    if (!reference.trim()) {
      toast.error('Por favor, informe uma referência para o pagamento');
      return;
    }

    setLoading(true);
    try {
      let receiptUrl = null;

      // Upload do comprovante se houver
      if (receiptFile && profile) {
        // Buscar store_id do perfil do usuário
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', profile.id)
          .single();

        if (storeData) {
          const fileExt = receiptFile.name.split('.').pop();
          const filePath = `${storeData.id}/${driverId}/${Date.now()}_${earningIds[0]}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-receipts')
            .upload(filePath, receiptFile);

          if (uploadError) {
            console.error('Error uploading receipt:', uploadError);
            toast.error('Erro ao fazer upload do comprovante');
          } else {
            const { data: urlData } = supabase.storage
              .from('payment-receipts')
              .getPublicUrl(filePath);
            receiptUrl = urlData.publicUrl;
          }
        }
      }

      // Atualizar pagamentos
      const { error } = await supabase
        .from('driver_earnings')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: reference,
          payment_receipt_url: receiptUrl,
        })
        .in('id', earningIds);

      if (error) throw error;

      toast.success(`Pagamento de ${formatCurrency(totalAmount)} confirmado!`);
      onSuccess();
      onOpenChange(false);
      setReference('');
      setNotes('');
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error('Erro ao confirmar pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Confirmar Pagamento - {driverName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Você está pagando <span className="font-semibold">{earningIds.length}</span> entregas
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referência do Pagamento *</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: Pagamento Semanal 01/2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pix realizado, comprovante enviado por WhatsApp"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Comprovante de Pagamento (Opcional)</Label>
            <div className="space-y-2">
              {!receiptFile ? (
                <div className="relative">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou PDF (máx. 5MB)
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium truncate">
                        {receiptFile.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {receiptPreview && (
                    <div className="relative w-full h-32 bg-muted rounded overflow-hidden">
                      <img
                        src={receiptPreview}
                        alt="Preview do comprovante"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
