-- Comprovantes de pagamento: buckets privados. Quem abre o arquivo precisa de link assinado,
-- que só sai para quem passa nas regras de SELECT abaixo. O front já grava o caminho do arquivo
-- e gera o link assinado na hora (src/lib/privateFiles.ts); registros antigos com a URL pública
-- continuam funcionando (o caminho é extraído da URL).
-- Reversão: update storage.buckets set public = true
--   where id in ('subscription-receipts', 'payment-receipts', 'dental-payment-receipts');

update storage.buckets
set public = false
where id in ('subscription-receipts', 'payment-receipts', 'dental-payment-receipts');

-- 1. subscription-receipts  (caminho: <store_id>/<fatura>-<data>.<ext>)
--    Já existem: dono da loja envia/vê e master vê/gerencia ("Store owners can ... receipts",
--    "Lojistas podem ... comprovantes", "Master admin(s) ..."). Somam-se: administrador da loja
--    (store_admin) também envia e vê, pois a tela de assinatura aceita loja selecionada.
create policy "Subscription receipts read by store admin or master"
on storage.objects for select to authenticated
using (
  bucket_id = 'subscription-receipts'
  and (
    public.is_master_admin()
    or public.is_store_admin_of((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
  )
);

create policy "Subscription receipts upload by store admin"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'subscription-receipts'
  and (
    public.is_master_admin()
    or public.is_store_admin_of((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
  )
);

-- 2. payment-receipts  (caminho: <store_id>/<driver_id ou professional_id>/<arquivo>)
--    Repasse a entregador (driver_earnings) e comissão de profissional (professional_commissions).
--    Já existem: dono da loja envia/vê/altera/apaga, master vê, entregador vê os seus.
--    A regra antiga do entregador converte a pasta para uuid; troca por comparação de texto.
alter policy "Drivers can view their own payment receipts" on storage.objects to service_role;

create policy "Payment receipts read by store team, payee or master"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and (
    public.is_master_admin()
    or public.is_store_admin_of((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
    -- entregador: a 2ª pasta é o id dele (driver_earnings.driver_id = profiles.id)
    or (storage.foldername(name))[2] = (select auth.uid())::text
    -- profissional: a 2ª pasta é o id do cadastro dele em professionals
    or exists (
      select 1 from public.professionals p
      where p.id::text = (storage.foldername(name))[2]
        and p.store_id::text = (storage.foldername(name))[1]
        and p.user_id = (select auth.uid())
    )
  )
);

create policy "Payment receipts upload by store admin"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (
    public.is_master_admin()
    or public.is_store_admin_of((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
  )
);

-- 3. dental-payment-receipts  (caminho: <patient_id>/<arquivo>)
--    Nada a criar: "Dental receipts by patient store team" (migração 20261031250000) já cobre
--    leitura e envio pela equipe da loja do paciente e pelo master; as regras abertas antigas
--    já foram restritas ao service_role.

-- 4. (Opcional, fora destes 3 buckets) salesperson-payment-proofs: o master grava em
--    proofs/<salesperson_id>/..., mas a regra "Vendedores podem ver comprovantes de seus
--    pagamentos" compara a 1ª pasta ("proofs") com o id do vendedor, então o vendedor não
--    consegue abrir o próprio comprovante. Correção sugerida (conferir antes de aplicar):
-- create policy "Salesperson reads own payout proofs"
-- on storage.objects for select to authenticated
-- using (
--   bucket_id = 'salesperson-payment-proofs'
--   and (storage.foldername(name))[1] = 'proofs'
--   and (storage.foldername(name))[2] in (
--     select sp.id::text from public.salespeople sp where sp.user_id = (select auth.uid())
--   )
-- );
