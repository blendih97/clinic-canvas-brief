alter table public.translate_tool_events
  add column if not exists session_id text,
  add column if not exists ip_hash text,
  add column if not exists is_guest boolean not null default true;
create index if not exists translate_tool_events_guest_session_idx
  on public.translate_tool_events (session_id) where is_guest and succeeded;
create index if not exists translate_tool_events_guest_ip_idx
  on public.translate_tool_events (ip_hash, created_at) where is_guest and succeeded;