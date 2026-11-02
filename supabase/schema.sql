-- Neo database schema. Run once in the Supabase SQL editor.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  topics          text[]  not null default '{}',
  sources         jsonb   not null default '{}'::jsonb,
  lens            text,
  delivery_time   text,
  delivery_email  text,
  briefing_style  text    default 'analyst',
  expertise_level text    default 'expert',
  updated_at      timestamptz default now()
);
-- Older databases may already have these tables with fewer columns, so add anything missing.
alter table public.profiles add column if not exists email           text;
alter table public.profiles add column if not exists topics          text[] not null default '{}';
alter table public.profiles add column if not exists sources         jsonb  not null default '{}'::jsonb;
alter table public.profiles add column if not exists lens            text;
alter table public.profiles add column if not exists delivery_time   text;
alter table public.profiles add column if not exists delivery_email  text;
alter table public.profiles add column if not exists updated_at      timestamptz default now();
alter table public.profiles add column if not exists briefing_style  text default 'analyst';
alter table public.profiles add column if not exists expertise_level text default 'expert';

create table if not exists public.briefings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  content        text not null,
  created_at     timestamptz not null default now(),
  email_sent     boolean default false,
  articles_used  jsonb,
  sources_used   jsonb,
  date_range     jsonb,
  articles_count int
);
alter table public.briefings add column if not exists created_at     timestamptz not null default now();
alter table public.briefings add column if not exists email_sent     boolean default false;
alter table public.briefings add column if not exists articles_used  jsonb;
alter table public.briefings add column if not exists sources_used   jsonb;
alter table public.briefings add column if not exists date_range     jsonb;
alter table public.briefings add column if not exists articles_count int;

-- If the table used an older "generated_at" column, carry those dates over.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'briefings' and column_name = 'generated_at') then
    execute 'update public.briefings set created_at = generated_at where generated_at is not null';
  end if;
end $$;

create index if not exists briefings_user_created_idx on public.briefings (user_id, created_at desc);

-- Row level security: people only ever see and change their own rows.
-- The daily cron uses the service role key, which bypasses RLS.
alter table public.profiles  enable row level security;
alter table public.briefings enable row level security;

drop policy if exists "profiles: read own"    on public.profiles;
drop policy if exists "profiles: insert own"  on public.profiles;
drop policy if exists "profiles: update own"  on public.profiles;
create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "briefings: read own"   on public.briefings;
drop policy if exists "briefings: insert own" on public.briefings;
drop policy if exists "briefings: update own" on public.briefings;
create policy "briefings: read own"   on public.briefings for select using (auth.uid() = user_id);
create policy "briefings: insert own" on public.briefings for insert with check (auth.uid() = user_id);
create policy "briefings: update own" on public.briefings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Each user's own Anthropic key, encrypted by the app before it is stored.
-- Row level security is on with no policies, so only the server (service role) can read it.
create table if not exists public.user_secrets (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  anthropic_key_enc   text not null,
  anthropic_key_last4 text,
  updated_at          timestamptz default now()
);
alter table public.user_secrets enable row level security;
