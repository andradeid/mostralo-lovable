// Pedido com envio por transportadora (Melhor Envio): serviço, prazo, endereço e código de rastreio.
// A etiqueta ainda é gerada no site do Melhor Envio (fase 2: gerar pelo Mostralo).
import { useEffect, useState } from 'react';
import { Copy, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { brl } from '@/lib/brl';
import { addressLine, deliveryDaysText, parseShippingAddress, trackingUrl } from '@/lib/shipping/shippingClient';

interface ShippingRecord {
  service_name?: string;
  price?: number;
  carrier_price?: number;
  free?: boolean;
  delivery_days?: number | null;
  address?: unknown;
  environment?: string;
}

export function OrderShippingCard({ orderId, shipping, trackingCode, customerName, onSaved }: {
  orderId: string;
  shipping: unknown;
  trackingCode: string | null;
  customerName: string;
  onSaved?: () => void;
}) {
  const s = (shipping ?? {}) as ShippingRecord;
  const address = parseShippingAddress(s.address);
  const [code, setCode] = useState(trackingCode ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setCode(trackingCode ?? ''), [trackingCode]);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(`${customerName}\n${addressLine(address)}`);
      toast.success('Endereço copiado.');
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  const saveCode = async () => {
    setSaving(true);
    const value = code.trim().toUpperCase() || null;
    const { error } = await supabase.from('orders').update({ tracking_code: value }).eq('id', orderId);
    setSaving(false);
    if (error) {
      console.error('[frete] Erro ao salvar rastreio:', error);
      toast.error('Não foi possível salvar o código de rastreio.');
      return;
    }
    toast.success(value ? 'Código de rastreio salvo.' : 'Código de rastreio removido.');
    onSaved?.();
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold text-lg flex items-center gap-2"><Truck className="h-5 w-5" /> Envio</h3>
      <p className="text-sm">
        <strong>{s.service_name ?? 'Transportadora'}</strong> · prazo informado: {deliveryDaysText(s.delivery_days ?? null)}
        {' · '}{s.free ? `Grátis para o cliente (custa ${brl(s.carrier_price)})` : brl(s.price)}
        {s.environment === 'sandbox' && <span className="ml-2 text-xs text-orange-700">(conta de teste)</span>}
      </p>
      {address && <p className="text-sm text-muted-foreground">{addressLine(address)}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copyAddress} disabled={!address}>
          <Copy className="h-4 w-4 mr-2" />Copiar endereço
        </Button>
        <Button type="button" variant="outline" size="sm" disabled title="Em breve: gerar a etiqueta pelo Mostralo">
          Gerar etiqueta · em breve
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`tracking-${orderId}`}>Código de rastreio</Label>
        <div className="flex gap-2">
          <Input id={`tracking-${orderId}`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex.: AB123456789BR" className="max-w-xs" />
          <Button type="button" onClick={saveCode} disabled={saving || (code.trim().toUpperCase() || null) === (trackingCode ?? null)}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
          </Button>
        </div>
        {trackingCode && (
          <a href={trackingUrl(trackingCode)} target="_blank" rel="noopener noreferrer" className="text-xs underline text-muted-foreground">
            Ver rastreio
          </a>
        )}
      </div>
    </div>
  );
}
