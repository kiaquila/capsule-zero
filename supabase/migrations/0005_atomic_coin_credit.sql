-- Keep purchase coin credits idempotent and concurrency-safe under webhook retries.

create or replace function public.credit_coins_atomic(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_target_id uuid,
  p_idempotency_key text,
  p_lava_event_id text default null
)
returns table (
  id uuid,
  user_id uuid,
  lava_event_id text,
  amount integer,
  reason text,
  target_id uuid,
  idempotency_key text,
  created_at timestamptz,
  profile_email text,
  profile_display_name text,
  profile_language text,
  profile_country text,
  profile_city text,
  profile_coin_balance integer,
  profile_created_at timestamptz,
  profile_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_ledger public.coin_ledger%rowtype;
  written_ledger public.coin_ledger%rowtype;
  written_profile public.profiles%rowtype;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_COIN_AMOUNT' using errcode = 'P0001';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'INVALID_IDEMPOTENCY_KEY' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_idempotency_key));

  select cl.*
    into existing_ledger
    from public.coin_ledger cl
   where cl.user_id = p_user_id
     and cl.idempotency_key = p_idempotency_key;

  if found then
    select pr.*
      into written_profile
      from public.profiles pr
     where pr.user_id = p_user_id;

    if not found then
      raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
    end if;

    return query
      select existing_ledger.id,
             existing_ledger.user_id,
             existing_ledger.lava_event_id,
             existing_ledger.amount,
             existing_ledger.reason,
             existing_ledger.target_id,
             existing_ledger.idempotency_key,
             existing_ledger.created_at,
             written_profile.email,
             written_profile.display_name,
             written_profile.language,
             written_profile.country,
             written_profile.city,
             written_profile.coin_balance,
             written_profile.created_at,
             written_profile.updated_at;
    return;
  end if;

  update public.profiles pr
     set coin_balance = pr.coin_balance + p_amount,
         updated_at = now()
   where pr.user_id = p_user_id
   returning pr.*
    into written_profile;

  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.coin_ledger (
    user_id,
    lava_event_id,
    amount,
    reason,
    target_id,
    idempotency_key
  )
  values (
    p_user_id,
    p_lava_event_id,
    p_amount,
    p_reason,
    p_target_id,
    p_idempotency_key
  )
  returning *
    into written_ledger;

  return query
    select written_ledger.id,
           written_ledger.user_id,
           written_ledger.lava_event_id,
           written_ledger.amount,
           written_ledger.reason,
           written_ledger.target_id,
           written_ledger.idempotency_key,
           written_ledger.created_at,
           written_profile.email,
           written_profile.display_name,
           written_profile.language,
           written_profile.country,
           written_profile.city,
           written_profile.coin_balance,
           written_profile.created_at,
           written_profile.updated_at;
end;
$$;

revoke all on function public.credit_coins_atomic(uuid, integer, text, uuid, text, text) from public;
grant execute on function public.credit_coins_atomic(uuid, integer, text, uuid, text, text) to service_role;

notify pgrst, 'reload schema';
