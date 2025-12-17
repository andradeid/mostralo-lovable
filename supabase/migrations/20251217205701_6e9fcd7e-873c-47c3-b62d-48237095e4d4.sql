-- Aplicar cupom ANDRADE ao pagamento do usuário joaofilhocarmo@hotmail.com
UPDATE payment_approvals
SET 
  coupon_id = '4a430ce9-b865-4786-9c70-3600c910cd8d',
  coupon_discount = 378.01,
  payment_amount = 19.89,
  pix_txid = NULL,
  pix_location = NULL,
  pix_qrcode_base64 = NULL,
  pix_copia_cola = NULL,
  pix_expires_at = NULL,
  updated_at = NOW()
WHERE id = 'ee07e631-6dd5-4480-8f19-969414d0eddf';