import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, Percent } from 'lucide-react';
import { formatCurrency, calculateDriverEarnings } from '@/utils/driverEarnings';

interface DriverEarningsConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: {
    id: string;
    full_name: string;
  };
  storeId: string;
}

export function DriverEarningsConfigDialog({
  open,
  onOpenChange,
  driver,
  storeId,
}: DriverEarningsConfigDialogProps) {
  const [paymentType, setPaymentType] = useState<'fixed' | 'commission'>('fixed');
  const [fixedAmount, setFixedAmount] = useState('5.00');
  const [commissionPercentage, setCommissionPercentage] = useState([80]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, driver.id, storeId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_earnings_config')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPaymentType(data.payment_type);
        if (data.fixed_amount) setFixedAmount(data.fixed_amount.toString());
        if (data.commission_percentage) setCommissionPercentage([data.commission_percentage]);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const config = {
        driver_id: driver.id,
        store_id: storeId,
        payment_type: paymentType,
        fixed_amount: paymentType === 'fixed' ? parseFloat(fixedAmount) : null,
        commission_percentage: paymentType === 'commission' ? commissionPercentage[0] : null,
        is_active: true,
      };

      const { error } = await supabase
        .from('driver_earnings_config')
        .upsert(config, {
          onConflict: 'driver_id,store_id',
        });

      if (error) throw error;

      toast.success('Configuração salva com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exampleDeliveryFee = 10;
  const exampleEarnings = calculateDriverEarnings(exampleDeliveryFee, {
    payment_type: paymentType,
    fixed_amount: parseFloat(fixedAmount),
    commission_percentage: commissionPercentage[0],
  });
  const storeFee = exampleDeliveryFee - exampleEarnings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Pagamento - {driver.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Como você quer pagar este entregador?</Label>
            <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-medium">Valor Fixo por Entrega</span>
                  </div>
                </Label>
              </div>

              {paymentType === 'fixed' && (
                <div className="ml-6 mt-2">
                  <Label htmlFor="fixed-amount" className="text-sm">Valor por entrega</Label>
                  <Input
                    id="fixed-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    placeholder="5.00"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="commission" id="commission" />
                <Label htmlFor="commission" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    <span className="font-medium">Comissão sobre Taxa de Entrega</span>
                  </div>
                </Label>
              </div>

              {paymentType === 'commission' && (
                <div className="ml-6 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Percentual da comissão</Label>
                    <span className="text-sm font-medium text-primary">{commissionPercentage[0]}%</span>
                  </div>
                  <Slider
                    value={commissionPercentage}
                    onValueChange={setCommissionPercentage}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Entregador recebe {commissionPercentage[0]}% da taxa de entrega
                  </p>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Exemplo de cálculo:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa do pedido:</span>
                <span className="font-medium">{formatCurrency(exampleDeliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregador recebe:</span>
                <span className="font-medium text-green-600">{formatCurrency(exampleEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loja fica com:</span>
                <span className="font-medium text-blue-600">{formatCurrency(storeFee)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
