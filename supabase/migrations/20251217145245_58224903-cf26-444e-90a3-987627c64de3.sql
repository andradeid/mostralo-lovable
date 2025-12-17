-- Aprovar o pagamento PIX já confirmado
UPDATE payment_approvals 
SET status = 'approved', 
    approved_at = NOW(),
    admin_notes = 'Pagamento PIX confirmado automaticamente via EFI - EndToEndId: E00416968202512171446vBQbXc6Ku1Q'
WHERE id = '93bb0e6d-0a01-43cd-ba26-0d8f10b78784';

-- Ativar a loja
UPDATE stores 
SET status = 'active', 
    subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE id = 'a6ab9357-bd8f-4bd5-805d-e51c77fd5d39';

-- Aprovar o profile
UPDATE profiles 
SET approval_status = 'approved'
WHERE id = 'aa82f203-9bd2-4ae0-8ea0-ca0191789009';