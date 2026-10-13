create or replace function public.enforce_document_quota()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  quota_used int;
begin
  if coalesce(new.processing_status, '') in ('failed', 'stored') then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 42));
  if public.user_has_paid_access(new.user_id) then
    return new;
  end if;
  select count(*) into quota_used
  from public.documents d
  where d.user_id = new.user_id
    and coalesce(d.processing_status, 'completed') not in ('failed', 'stored');
  if quota_used >= 3 then
    raise exception 'free_document_limit_reached'
      using hint = 'Upgrade to a paid plan for unlimited documents.';
  end if;
  return new;
end;
$function$;

create or replace function public.user_can_upload_document(_user_id uuid)
 returns boolean language sql stable security definer set search_path to 'public' as $function$
  select public.assert_self_scope(_user_id) and (
    public.user_has_paid_access(_user_id)
    or (
      select count(*) from public.documents d
      where d.user_id = _user_id
        and coalesce(d.processing_status, 'completed') not in ('failed', 'stored')
    ) < 3
  );
$function$;