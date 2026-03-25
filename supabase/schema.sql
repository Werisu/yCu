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
