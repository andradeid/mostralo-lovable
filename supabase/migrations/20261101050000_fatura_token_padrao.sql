-- Toda fatura de assinatura nasce com o token do link de pagamento (/pagar/<token>).
-- Antes o token só era criado por algumas funções; faturas criadas à mão pelo master ficavam sem link.
alter table public.subscription_invoices alter column public_token set default encode(extensions.gen_random_bytes(16), 'hex');
