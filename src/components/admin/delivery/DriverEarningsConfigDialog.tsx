import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, Percent, Shield } from 'lucide-react';
import { formatCurrency, calculateDriverEarnings, PaymentType } from '@/utils/driverEarnings';

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
  const [paymentType, setPaymentType] = useState<PaymentType>('fixed');
  const [fixedAmount, setFixedAmount] = useState('5.00');
  const [commissionPercentage, setCommissionPercentage] = useState([80]);
  const [minimumAmount, setMinimumAmount] = useState('7.00');
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
        setPaymentType(data.payment_type as PaymentType);
        if (data.fixed_amount) setFixedAmount(data.fixed_amount.toString());
        if (data.commission_percentage) setCommissionPercentage([data.commission_percentage]);
        if (data.minimum_amount) setMinimumAmount(data.minimum_amount.toString());
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
        minimum_amount: paymentType === 'minimum_guaranteed' ? parseFloat(minimumAmount) : null,
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

  // Exemplos de cálculo
  const exampleDeliveryFee = 10;
  const exampleEarnings = calculateDriverEarnings(exampleDeliveryFee, {
    payment_type: paymentType,
    fixed_amount: parseFloat(fixedAmount),
    commission_percentage: commissionPercentage[0],
    minimum_amount: parseFloat(minimumAmount),
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
            <RadioGroup value={paymentType} onValueChange={(value: PaymentType) => setPaymentType(value)}>
              {/* Opção Valor Fixo */}
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-medium">Valor Fixo por Entrega</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sempre o mesmo valor, independente da taxa
                  </p>
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

              {/* Opção Mínimo Garantido */}
              <div className="flex items-center space-x-2 rounded-lg border p-4 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <RadioGroupItem value="minimum_guaranteed" id="minimum_guaranteed" />
                <Label htmlFor="minimum_guaranteed" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Mínimo Garantido</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paga o maior valor entre a taxa e o mínimo
                  </p>
                </Label>
              </div>

              {paymentType === 'minimum_guaranteed' && (
                <div className="ml-6 mt-2 space-y-3">
                  <div>
                    <Label htmlFor="minimum-amount" className="text-sm">Valor mínimo garantido</Label>
                    <Input
                      id="minimum-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minimumAmount}
                      onChange={(e) => setMinimumAmount(e.target.value)}
                      placeholder="7.00"
                      className="mt-1"
                    />
                  </div>
                  <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-3 text-xs space-y-1">
                    <p className="font-medium text-green-800 dark:text-green-200">📊 Exemplos:</p>
                    <p className="text-green-700 dark:text-green-300">• Taxa R$ 5 → Recebe {formatCurrency(parseFloat(minimumAmount) || 7)} (mínimo)</p>
                    <p className="text-green-700 dark:text-green-300">• Taxa R$ {minimumAmount || 7} → Recebe {formatCurrency(parseFloat(minimumAmount) || 7)} (igual)</p>
                    <p className="text-green-700 dark:text-green-300">• Taxa R$ 20 → Recebe R$ 20,00 (taxa real)</p>
                  </div>
                </div>
              )}

              {/* Opção Comissão */}
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="commission" id="commission" />
                <Label htmlFor="commission" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    <span className="font-medium">Comissão sobre Taxa</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentual da taxa de entrega
                  </p>
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

          {/* Exemplo de cálculo para fixed e commission */}
          {paymentType !== 'minimum_guaranteed' && (
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
          )}
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
