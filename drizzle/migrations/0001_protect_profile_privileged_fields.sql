create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Signup trigger, service role and edge functions run without auth.uid(); admins may change anything.
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.plan is distinct from 'free' or new.comped_plan is not null or new.comped_until is not null
       or new.trial_ends_at is not null or new.suspended_at is not null or new.suspended_reason is not null
       or new.stripe_customer_id is not null or new.stripe_subscription_id is not null then
      raise exception 'forbidden_profile_field' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.plan is distinct from old.plan
     or new.comped_plan is distinct from old.comped_plan
     or new.comped_until is distinct from old.comped_until
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.suspended_at is distinct from old.suspended_at
     or new.suspended_reason is distinct from old.suspended_reason
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'forbidden_profile_field' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();