-- yCu: tabela de currículo por usuário (auth.uid).
-- Execute no SQL Editor do Supabase.
--
-- OBRIGATÓRIO (senão a API retorna anonymous_provider_disabled):
-- Dashboard → Authentication → (aba Sign In / Providers) → Anonymous → Enable.
-- Em projetos novos o anonymous vem desligado por padrão.

create table if not exists public.cv_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists cv_data_updated_at_idx on public.cv_data (updated_at desc);

alter table public.cv_data enable row level security;

create policy "cv_data_select_own"
  on public.cv_data
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "cv_data_insert_own"
  on public.cv_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "cv_data_update_own"
  on public.cv_data
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cv_data_delete_own"
  on public.cv_data
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Registro de quem usa o serviço (um registro por auth.users, anônimo ou não)
-- Consulta agregada: SQL Editor como postgres ou painel Table Editor.
-- ---------------------------------------------------------------------------

create table if not exists public.service_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  user_agent text,
  last_locale text
);

create index if not exists service_users_last_seen_idx on public.service_users (last_seen_at desc);

alter table public.service_users enable row level security;

-- Leitura apenas da própria linha (opcional); escrita só via função abaixo.
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
