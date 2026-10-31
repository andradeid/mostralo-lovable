-- Avaliações de atendimento: qualquer visitante lia todas (com o token de cada uma) e podia
-- gravar nota em qualquer avaliação pendente. Agora a página /avaliar/<token> usa duas funções
-- que só tocam na avaliação do token informado; o público só lê avaliações já publicadas.

create or replace function public.get_review_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select jsonb_build_object(
    'id', r.id, 'token', r.token, 'booking_id', r.booking_id, 'store_id', r.store_id,
    'professional_id', r.professional_id, 'rating', r.rating, 'feedback', r.feedback,
    'is_public', r.is_public, 'reviewed_at', r.reviewed_at, 'expires_at', r.expires_at,
    'booking', jsonb_build_object('booking_date', b.booking_date, 'customer_name', b.customer_name,
                                  'service', jsonb_build_object('name', s.name)),
    'professional', jsonb_build_object('name', p.name, 'photo_url', p.photo_url),
    'store', jsonb_build_object('name', st.name, 'logo_url', st.logo_url)
  )
  from booking_reviews r
  left join bookings b on b.id = r.booking_id
  left join booking_services s on s.id = b.service_id
  left join professionals p on p.id = r.professional_id
  left join stores st on st.id = r.store_id
  where p_token is not null and length(p_token) >= 16 and r.token = p_token
  limit 1;
$$;

create or replace function public.submit_review_by_token(
  p_token text,
  p_rating integer,
  p_feedback text default null,
  p_is_public boolean default true
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row booking_reviews;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Nota inválida' using errcode = '22023';
  end if;
  update booking_reviews
     set rating = p_rating,
         feedback = nullif(left(trim(coalesce(p_feedback, '')), 2000), ''),
         is_public = coalesce(p_is_public, true),
         reviewed_at = now()
   where token = p_token
     and length(p_token) >= 16
     and reviewed_at is null
     and (expires_at is null or expires_at > now())
  returning * into v_row;
  if v_row.id is null then
    raise exception 'Avaliação não encontrada, já respondida ou expirada' using errcode = 'P0002';
  end if;
  return to_jsonb(v_row) - 'token';
end;
$$;

revoke all on function public.get_review_by_token(text) from public;
revoke all on function public.submit_review_by_token(text, integer, text, boolean) from public;
grant execute on function public.get_review_by_token(text) to anon, authenticated;
grant execute on function public.submit_review_by_token(text, integer, text, boolean) to anon, authenticated;

-- Leitura/gravação aberta passa a valer só para o servidor
alter policy "Allow public read by token" on public.booking_reviews to service_role;
alter policy "Allow public update by token" on public.booking_reviews to service_role;

-- Público: só avaliações publicadas (média e lista no cartão digital)
create policy "Public can read published reviews"
  on public.booking_reviews for select to anon, authenticated
  using (is_public = true and reviewed_at is not null);

-- Dono da loja (mesmo sem papel em user_roles) lê as avaliações da loja
create policy "Store owner can read store reviews"
  on public.booking_reviews for select to authenticated
  using (is_store_owner_direct(store_id, (select auth.uid())));
