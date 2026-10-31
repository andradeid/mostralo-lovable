-- Fecha gravações e leituras abertas a qualquer visitante (chave pública do site).
-- Padrão: regra escrita para o "sistema" valia para todos; agora vale só para o servidor
-- (service_role) ou para a equipe certa. Funções do banco que gravam nessas tabelas são
-- security definer e continuam funcionando.

-- 1. Links curtos: só o servidor cria e altera (antes qualquer um trocava o destino)
alter policy "Sistema pode criar short links" on public.short_links to service_role;
alter policy "Sistema pode atualizar clicks" on public.short_links to service_role;

-- 2. Entregadores
alter policy "Sistema pode inserir ganhos" on public.driver_earnings to service_role;
alter policy "Sistema pode inserir notificações" on public.driver_notifications to service_role;
create policy "Store team can notify drivers"
  on public.driver_notifications for insert to authenticated
  with check (
    public.is_master_admin()
    or exists (select 1 from public.stores s where s.owner_id = (select auth.uid()))
    or public.has_role((select auth.uid()), 'store_admin'::app_role)
  );

-- 3. Vendedores: vendas, bônus, contratos, cadastro e aceite de termos
alter policy "Sistema pode inserir vendas" on public.salesperson_sales to service_role;
alter policy "Sistema pode inserir conquistas" on public.salesperson_bonus_achievements to service_role;
alter policy "Sistema pode inserir contratos" on public.salesperson_contracts to service_role;
create policy "Salesperson can insert own contract"
  on public.salesperson_contracts for insert to authenticated
  with check (
    public.is_master_admin()
    or salesperson_id in (select sp.id from public.salespeople sp where sp.user_id = (select auth.uid()))
  );
alter policy "Público pode criar vendedores (auto-cadastro)" on public.salespeople to service_role;
alter policy "System can insert terms acceptance" on public.salesperson_terms_acceptance to service_role;

-- 4. Propostas comerciais: a página pública usa a função proposal-actions (servidor)
alter policy "Public can view proposal by slug" on public.commercial_proposals to service_role;
alter policy "Anyone can insert activity logs" on public.proposal_activity_log to service_role;

-- 5. Logs e registros internos
alter policy "Sistema pode inserir logs" on public.admin_audit_log to service_role;
create policy "Master admin can insert audit log"
  on public.admin_audit_log for insert to authenticated
  with check (public.is_master_admin());
alter policy "System can insert usage records" on public.promotion_usage to service_role;
alter policy "System can insert reminders" on public.lead_follow_up_reminders to service_role;
alter policy "Service role can insert logs" on public.recurring_invoice_logs to service_role;
alter policy "Service role can insert sentinela logs" on public.sentinela_logs to service_role;
alter policy "Allow insert from service role" on public.booking_notification_logs to service_role;

-- 6. Chamada de senha: a configuração tem a chave da ElevenLabs; o público usa a visão
--    password_call_config_public (sem a chave). Equipe da loja continua lendo.
alter policy "Anyone can view password call config" on public.password_call_config to service_role;
create policy "Store team can view password call config"
  on public.password_call_config for select to authenticated
  using (
    public.is_master_admin()
    or public.is_store_admin_of(store_id)
    or public.is_attendant_for_store(store_id)
  );

-- 7. Faturas avulsas: a visão pública não é usada pelo site e expunha todas as faturas
revoke select on public.public_external_invoices from anon, authenticated;

-- 8. Etiquetas de cliente
--    Público: só as etiquetas de canal do sistema (Totem, Delivery...) e só atribuir
--    etiqueta de canal da própria loja. Equipe da loja: tudo da própria loja.
alter policy "Anon can read customer_labels" on public.customer_labels to service_role;
alter policy "Anyone can view labels" on public.customer_labels to service_role;
alter policy "Authenticated can insert labels" on public.customer_labels to service_role;
alter policy "Authenticated can update labels" on public.customer_labels to service_role;
alter policy "Authenticated can delete non-system labels" on public.customer_labels to service_role;

create policy "Public can read system labels"
  on public.customer_labels for select to anon, authenticated
  using (is_system = true);
create policy "Store team can read labels"
  on public.customer_labels for select to authenticated
  using (public.is_master_admin() or public.is_store_admin_of(store_id) or public.is_attendant_for_store(store_id));
create policy "Store team can insert labels"
  on public.customer_labels for insert to authenticated
  with check (public.is_master_admin() or public.is_store_admin_of(store_id) or public.is_attendant_for_store(store_id));
create policy "Store team can update labels"
  on public.customer_labels for update to authenticated
  using (public.is_master_admin() or public.is_store_admin_of(store_id) or public.is_attendant_for_store(store_id))
  with check (public.is_master_admin() or public.is_store_admin_of(store_id) or public.is_attendant_for_store(store_id));
create policy "Store team can delete non-system labels"
  on public.customer_labels for delete to authenticated
  using (is_system = false and (public.is_master_admin() or public.is_store_admin_of(store_id) or public.is_attendant_for_store(store_id)));

alter policy "Anon can read customer_label_assignments" on public.customer_label_assignments to service_role;
alter policy "Authenticated can update label assignments" on public.customer_label_assignments to service_role;
alter policy "Authenticated can delete label assignments" on public.customer_label_assignments to service_role;
alter policy "Anon can create customer_label_assignments" on public.customer_label_assignments
  with check (
    exists (
      select 1 from public.customer_labels l
      where l.id = label_id and l.store_id = customer_label_assignments.store_id and l.is_system = true
    )
  );

-- 9. Arquivos
--    Comprovantes de assinatura: ninguém lista mais os arquivos sem login
--    (dono da loja e master continuam pelas regras próprias).
alter policy "Qualquer um pode visualizar comprovantes (público)" on storage.objects to service_role;

--    Comprovantes do odontológico: só a equipe da loja do paciente
alter policy "Allow public read of dental payment receipts" on storage.objects to service_role;
alter policy "Allow authenticated users to upload dental payment receipts" on storage.objects to service_role;
alter policy "Allow authenticated users to update dental payment receipts" on storage.objects to service_role;
alter policy "Allow authenticated users to delete dental payment receipts" on storage.objects to service_role;
create policy "Dental receipts by patient store team"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'dental-payment-receipts'
    and exists (
      select 1 from public.patients p
      where p.id::text = (storage.foldername(name))[1]
        and (public.is_master_admin() or public.is_store_admin_of(p.store_id) or public.is_attendant_for_store(p.store_id))
    )
  )
  with check (
    bucket_id = 'dental-payment-receipts'
    and exists (
      select 1 from public.patients p
      where p.id::text = (storage.foldername(name))[1]
        and (public.is_master_admin() or public.is_store_admin_of(p.store_id) or public.is_attendant_for_store(p.store_id))
    )
  );
