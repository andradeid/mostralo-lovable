import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, QrCode } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export type PixKeyType = 'EVP' | 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE';

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
  // Campos do /send/request-payment
  pixKey: string;
  pixType: PixKeyType;
  pixName?: string;
  title?: string;
  text?: string;
  footer?: string;
  itemName?: string;
  invoiceNumber?: string;
  generateEfiPix: boolean;
}

export function MasterPixDialog({ open, onOpenChange, onSend, sending, defaultDescription }: MasterPixDialogProps) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState(60);
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<PixKeyType>('EVP');
  const [pixName, setPixName] = useState('');
  const [title, setTitle] = useState('Detalhes do pedido');
  const [text, setText] = useState('');
  const [footer, setFooter] = useState('');
  const [itemName, setItemName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [generateEfiPix, setGenerateEfiPix] = useState(true);

  useEffect(() => {
    if (open) {
      if (defaultDescription) {
        setDescription(defaultDescription);
        setText(defaultDescription);
      }
      setAmount(0);
      setExpirationMinutes(60);
    }
  }, [open, defaultDescription]);

  const handleSubmit = () => {
    if (amount <= 0 || !pixKey.trim()) return;
    onSend({
      amount,
      description: description.trim() || 'Cobrança Mostralo',
      expirationMinutes,
      pixKey: pixKey.trim(),
      pixType,
      pixName: pixName.trim() || undefined,
      title: title.trim() || undefined,
      text: text.trim() || undefined,
      footer: footer.trim() || undefined,
      itemName: itemName.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      generateEfiPix,
    });
  };

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Solicitar Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Envia o botão nativo "Revisar e Pagar" do WhatsApp + PIX Copia e Cola via EFI
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

          {/* Tipo de chave PIX */}
          <div className="space-y-1.5">
            <Label>Tipo da Chave PIX *</Label>
            <Select value={pixType} onValueChange={(v) => setPixType(v as PixKeyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EVP">Chave Aleatória (EVP)</SelectItem>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
                <SelectItem value="EMAIL">E-mail</SelectItem>
                <SelectItem value="PHONE">Telefone</SelectItem>
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
                pixType === 'CPF' ? '000.000.000-00'
                : pixType === 'CNPJ' ? '00.000.000/0000-00'
                : pixType === 'EMAIL' ? 'email@exemplo.com'
                : pixType === 'PHONE' ? '5511999999999'
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
              placeholder="Nome exibido no fluxo de pagamento"
            />
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-title">Título</Label>
            <Input
              id="pix-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Detalhes do pedido"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-text">Mensagem</Label>
            <Input
              id="pix-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Pedido #123 pronto para pagamento"
            />
          </div>

          {/* Rodapé */}
          <div className="space-y-1.5">
            <Label htmlFor="pix-footer">Rodapé</Label>
            <Input
              id="pix-footer"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Ex: Loja Exemplo"
            />
          </div>

          {/* Item e Fatura */}
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

          {/* Toggle EFI */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Gerar PIX Copia e Cola (EFI)</p>
              <p className="text-xs text-muted-foreground">Gera cobrança dinâmica + QR Code via EFI</p>
            </div>
            <Switch checked={generateEfiPix} onCheckedChange={setGenerateEfiPix} />
          </div>

          {generateEfiPix && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pix-description">Descrição EFI</Label>
                <Input
                  id="pix-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Mensalidade Plano Pro"
                  maxLength={140}
                />
              </div>
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
                <p className="text-xs text-muted-foreground">Mínimo 5 min, máximo 24 horas</p>
              </div>
            </>
          )}
        </div>

        {/* Preview */}
        {amount > 0 && pixKey && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium text-foreground">Resumo:</p>
            <p className="text-muted-foreground">💰 {formattedAmount}</p>
            <p className="text-muted-foreground">🔑 {pixType}: {pixKey}</p>
            {text && <p className="text-muted-foreground">💬 {text}</p>}
            {generateEfiPix && <p className="text-xs text-muted-foreground mt-1 italic">+ PIX Copia e Cola via EFI será gerado</p>}
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
              <QrCode className="w-4 h-4 mr-1" />
            )}
            Enviar Cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
