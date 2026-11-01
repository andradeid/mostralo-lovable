-- "Exibir publicamente" (booking_settings.show_public_reviews) passa a valer:
-- com a opção desligada, as avaliações da loja somem do cartão digital e de qualquer leitura pública.
-- O dono da loja continua vendo tudo (policy "Store owner can read store reviews").

create or replace function public._store_shows_public_reviews(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((select bs.show_public_reviews from booking_settings bs where bs.store_id = p_store_id limit 1), true);
$$;

revoke all on function public._store_shows_public_reviews(uuid) from public;
grant execute on function public._store_shows_public_reviews(uuid) to anon, authenticated, service_role;

alter policy "Public can read published reviews" on public.booking_reviews
  using (is_public = true and reviewed_at is not null and public._store_shows_public_reviews(store_id));
