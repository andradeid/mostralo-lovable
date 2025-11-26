export type PaymentType = 'fixed' | 'commission';

export interface EarningsConfig {
  payment_type: PaymentType;
  fixed_amount?: number;
  commission_percentage?: number;
}

export function calculateDriverEarnings(
  deliveryFee: number,
  config?: EarningsConfig
): number {
  if (!config) return deliveryFee;
  
  if (config.payment_type === 'fixed') {
    return config.fixed_amount || deliveryFee;
  }
  
  const percentage = config.commission_percentage || 100;
  return deliveryFee * (percentage / 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
