-- =====================================================
-- Scalpy — Migration Supabase (à exécuter dans SQL Editor)
-- =====================================================

-- 1. Table profiles (1:1 avec auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  locale text not null default 'fr',
  marketing_consent boolean not null default false,
  photo_consent_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Table onboarding_responses (session anonyme puis rattachée)
create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 3. Table scans (mise à jour si existante)
-- Si la table scans existe déjà, ajouter les colonnes manquantes
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'status') then
    alter table public.scans add column status text not null default 'done';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'photo_path') then
    alter table public.scans add column photo_path text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'recommendations') then
    alter table public.scans add column recommendations jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'message') then
    alter table public.scans add column message text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'raw_analysis') then
    alter table public.scans add column raw_analysis jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'created_at') then
    alter table public.scans add column created_at timestamptz not null default now();
  end if;
end $$;

-- 4. Table projections
create table if not exists public.projections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scan_id uuid not null,
  status text not null default 'pending',
  teaser_path text,
  full_path text,
  provider text,
  prompt_version text,
  created_at timestamptz not null default now()
);

-- 5. Table subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  provider text default 'lemonsqueezy',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Table events (mise à jour si existante)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'session_id') then
    alter table public.events add column session_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'events' and column_name = 'props') then
    alter table public.events add column props jsonb default '{}';
  end if;
end $$;

-- 7. Table program_progress
create table if not exists public.program_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, task_id)
);

-- 8. Table email_log (anti-doublon)
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- RLS Policies
-- =====================================================

alter table public.profiles enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.projections enable row level security;
alter table public.subscriptions enable row level security;
alter table public.program_progress enable row level security;
alter table public.email_log enable row level security;

-- profiles
create policy if not exists "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy if not exists "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- scans
create policy if not exists "scans_self_select" on public.scans
  for select using (auth.uid() = user_id);

-- projections
create policy if not exists "projections_self_select" on public.projections
  for select using (auth.uid() = user_id);

-- subscriptions
create policy if not exists "subscriptions_self_select" on public.subscriptions
  for select using (auth.uid() = user_id);

-- onboarding_responses
create policy if not exists "onboarding_self_select" on public.onboarding_responses
  for select using (auth.uid() = user_id);

-- program_progress
create policy if not exists "progress_self_select" on public.program_progress
  for select using (auth.uid() = user_id);
create policy if not exists "progress_self_insert" on public.program_progress
  for insert with check (auth.uid() = user_id);
create policy if not exists "progress_self_delete" on public.program_progress
  for delete using (auth.uid() = user_id);

-- =====================================================
-- Trigger : création auto de profil + abonnement free
-- =====================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- Bucket storage
-- =====================================================
-- À faire dans l'interface Supabase > Storage :
-- 1. Créer le bucket "scalp-photos" (privé)
-- 2. Créer le bucket "projections" (privé)
-- 3. Ajouter les policies RLS sur chaque bucket :
--    - SELECT: auth.uid()::text = (storage.foldername(name))[1]
--    - INSERT: auth.uid()::text = (storage.foldername(name))[1]
