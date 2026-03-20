import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, CreditCard, QrCode } from 'lucide-react';

interface MasterPixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: MasterPixRequestData) => void;
  sending: boolean;
  defaultDescription?: string;
}

export interface MasterPixRequestData {
  amount: number;
  description: string;
  expirationMinutes: number;
}

export function MasterPixDialog({ open, onOpenChange, onSend, sending, defaultDescription }: MasterPixDialogProps) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState(60);

  useEffect(() => {
    if (open) {
      if (defaultDescription) setDescription(defaultDescription);
      setAmount(0);
      setExpirationMinutes(60);
    }
  }, [open, defaultDescription]);

  const handleSubmit = () => {
    if (amount <= 0) return;
    onSend({
      amount,
      description: description.trim() || 'Cobrança Mostralo',
      expirationMinutes,
    });
  };

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Gerar PIX Copia e Cola
          </DialogTitle>
          <DialogDescription>
            Gera uma cobrança PIX via EFI e envia o código Copia e Cola + QR Code pelo WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-amount">Valor *</Label>
            <CurrencyInput
              id="pix-amount"
              value={amount}
              onChange={setAmount}
              placeholder="0,00"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-description">Descrição</Label>
            <Input
              id="pix-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mensalidade Plano Pro"
              maxLength={140}
            />
          </div>

          {/* Expiração */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-expiration">Válido por (minutos)</Label>
            <Input
              id="pix-expiration"
              type="number"
              value={expirationMinutes}
              onChange={(e) => setExpirationMinutes(Math.max(5, Math.min(1440, parseInt(e.target.value) || 60)))}
              min={5}
              max={1440}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 5 min, máximo 24 horas
            </p>
          </div>
        </div>

        {/* Preview */}
        {amount > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium text-foreground">Resumo:</p>
            <p className="text-muted-foreground">💰 {formattedAmount}</p>
            <p className="text-muted-foreground">📝 {description || 'Cobrança Mostralo'}</p>
            <p className="text-muted-foreground">⏱️ Válido por {expirationMinutes} min</p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Será gerado via EFI (PIX Copia e Cola + QR Code)
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={sending || amount <= 0}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <QrCode className="w-4 h-4 mr-1" />
            )}
            Gerar e Enviar PIX
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
