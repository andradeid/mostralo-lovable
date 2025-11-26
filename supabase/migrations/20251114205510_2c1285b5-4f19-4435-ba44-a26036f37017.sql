-- FASE 1: Adicionar campos para proposta de valores e negociação na tabela driver_invitations
ALTER TABLE driver_invitations 
  ADD COLUMN proposed_payment_type payment_type DEFAULT 'fixed',
  ADD COLUMN proposed_fixed_amount NUMERIC,
  ADD COLUMN proposed_commission_percentage NUMERIC,
  ADD COLUMN invitation_message TEXT,
  ADD COLUMN counter_offer_payment_type payment_type,
  ADD COLUMN counter_offer_fixed_amount NUMERIC,
  ADD COLUMN counter_offer_commission_percentage NUMERIC,
  ADD COLUMN counter_offer_message TEXT,
  ADD COLUMN counter_offer_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN driver_invitations.proposed_payment_type IS 'Tipo de pagamento proposto pelo lojista (fixed ou commission)';
COMMENT ON COLUMN driver_invitations.proposed_fixed_amount IS 'Valor fixo proposto por entrega (em reais)';
COMMENT ON COLUMN driver_invitations.proposed_commission_percentage IS 'Percentual de comissão proposto (0-100)';
COMMENT ON COLUMN driver_invitations.invitation_message IS 'Mensagem opcional do lojista ao entregador';
COMMENT ON COLUMN driver_invitations.counter_offer_payment_type IS 'Tipo de pagamento proposto pelo entregador na contra-oferta';
COMMENT ON COLUMN driver_invitations.counter_offer_fixed_amount IS 'Valor fixo proposto pelo entregador';
COMMENT ON COLUMN driver_invitations.counter_offer_commission_percentage IS 'Percentual proposto pelo entregador';
COMMENT ON COLUMN driver_invitations.counter_offer_message IS 'Mensagem do entregador explicando a contra-proposta';
COMMENT ON COLUMN driver_invitations.counter_offer_at IS 'Data/hora em que a contra-proposta foi feita';