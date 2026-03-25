-- Execute no SQL Editor se o projeto já tinha sido criado antes de service_users.
-- (Equivalente ao bloco final de schema.sql.)

create table if not exists public.service_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  user_agent text,
  last_locale text
);

create index if not exists service_users_last_seen_idx on public.service_users (last_seen_at desc);

alter table public.service_users enable row level security;

drop policy if exists "service_users_select_own" on public.service_users;
create policy "service_users_select_own"
  on public.service_users
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.register_service_user(
  p_user_agent text default null,
  p_locale text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.service_users (user_id, first_seen_at, last_seen_at, user_agent, last_locale)
  values (auth.uid(), now(), now(), p_user_agent, p_locale)
  on conflict (user_id) do update
    set last_seen_at = now(),
        user_agent = coalesce(excluded.user_agent, public.service_users.user_agent),
        last_locale = coalesce(excluded.last_locale, public.service_users.last_locale);
end;
$$;

grant execute on function public.register_service_user(text, text) to authenticated;
