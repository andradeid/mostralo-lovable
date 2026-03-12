import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, CreditCard } from 'lucide-react';
import { formatPixKey, getPixKeyTypeName, type PixKeyType } from '@/utils/pixValidation';

interface PaymentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: PaymentRequestData) => void;
  sending: boolean;
  defaultPixName?: string;
  defaultText?: string;
  defaultAmount?: number;
  defaultItemName?: string;
  defaultFooter?: string;
}

export interface PaymentRequestData {
  amount: number;
  pixKey: string;
  pixType: PixKeyType;
  pixName?: string;
  text?: string;
  itemName?: string;
  invoiceNumber?: string;
  footer?: string;
}

const PIX_TYPE_MAP: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'EMAIL',
  phone: 'PHONE',
  random: 'EVP',
};

export function PaymentRequestDialog({ open, onOpenChange, onSend, sending, defaultPixName, defaultText, defaultAmount, defaultItemName }: PaymentRequestDialogProps) {
  const [amount, setAmount] = useState(0);
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<PixKeyType>('random');
  const [pixName, setPixName] = useState('');
  const [text, setText] = useState('');
  const [itemName, setItemName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Pre-fill when dialog opens
  useEffect(() => {
    if (open) {
      if (defaultPixName) setPixName(defaultPixName);
      if (defaultText) setText(defaultText);
      if (defaultAmount && defaultAmount > 0) setAmount(defaultAmount);
      if (defaultItemName) setItemName(defaultItemName);
    }
  }, [open, defaultPixName, defaultText, defaultAmount, defaultItemName]);

  const handleSubmit = () => {
    if (amount <= 0 || !pixKey.trim()) return;
    onSend({
      amount,
      pixKey: pixKey.trim(),
      pixType,
      pixName: pixName.trim() || undefined,
      text: text.trim() || undefined,
      itemName: itemName.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
    });
    // Reset form
    setAmount(0);
    setPixKey('');
    setPixType('random');
    setPixName('');
    setText('');
    setItemName('');
    setInvoiceNumber('');
  };

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Solicitar Pagamento
          </DialogTitle>
          <DialogDescription>
            Envie uma solicitação de pagamento via PIX pelo WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Valor *</Label>
            <CurrencyInput
              id="payment-amount"
              value={amount}
              onChange={setAmount}
              placeholder="0,00"
            />
          </div>

          {/* Tipo de chave PIX */}
          <div className="space-y-1.5">
            <Label>Tipo da Chave PIX *</Label>
            <Select value={pixType} onValueChange={(v) => setPixType(v as PixKeyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Chave Aleatória (EVP)</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chave PIX */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-key">Chave PIX *</Label>
            <Input
              id="pix-key"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder={
                pixType === 'cpf' ? '000.000.000-00'
                : pixType === 'cnpj' ? '00.000.000/0000-00'
                : pixType === 'email' ? 'email@exemplo.com'
                : pixType === 'phone' ? '(11) 99999-9999'
                : 'UUID da chave aleatória'
              }
            />
          </div>

          {/* Nome do recebedor */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-name">Nome do recebedor</Label>
            <Input
              id="pix-name"
              value={pixName}
              onChange={(e) => setPixName(e.target.value)}
              placeholder="Nome que aparece na cobrança"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-text">Mensagem</Label>
            <Input
              id="payment-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Pedido #123 pronto para pagamento"
            />
          </div>

          {/* Linha colapsada com item e nota fiscal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-name" className="text-xs">Nome do item</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Produto/Serviço"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-number" className="text-xs">Nº da fatura</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="PED-001"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {amount > 0 && pixKey && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium text-foreground">Resumo da cobrança:</p>
            <p className="text-muted-foreground">💰 {formattedAmount}</p>
            <p className="text-muted-foreground">🔑 {getPixKeyTypeName(pixType)}: {pixKey}</p>
            {text && <p className="text-muted-foreground">💬 {text}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={sending || amount <= 0 || !pixKey.trim()}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CreditCard className="w-4 h-4 mr-1" />
            )}
            Enviar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
