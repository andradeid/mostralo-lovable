-- Corrigir fatura atual que foi paga mas ficou como pending
UPDATE subscription_invoices 
SET 
  pix_txid = '1N6zDCLoFOpdGDvvZmve0gs8ah5SIbK1',
  payment_status = 'paid',
  paid_at = '2025-12-23T05:17:44.000Z',
  payment_method = 'pix',
  notes = 'Corrigido manualmente - Pagamento PIX confirmado em 23/12/2025'
WHERE id = '62f8df0f-b954-4154-b3ea-9998dcd21257';

-- Estender assinatura da loja
UPDATE stores 
SET 
  status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE id = '79fedd36-6e19-42d6-b331-79f9ad777180';