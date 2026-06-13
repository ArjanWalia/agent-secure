-- ============================================================================
-- CryptoLearn — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Auth (email + password) is handled by Supabase's built-in auth.users table.
-- The tables below store the user's profile and their progress through the
-- course. Every table is protected by Row Level Security so a user can only
-- ever read or write their OWN rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- accounts: profile data captured at signup (email, username, DOB).
-- id matches the auth.users id so we can join the logged-in user to profile.
-- ----------------------------------------------------------------------------
create table if not exists public.accounts (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  username    text not null,
  dob         date not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- course_progress: one row per user per course. completed = whole course done.
-- ----------------------------------------------------------------------------
create table if not exists public.course_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_id   text not null,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ----------------------------------------------------------------------------
-- section_progress: one row per user per section.
-- ----------------------------------------------------------------------------
create table if not exists public.section_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_id   text not null,
  section_id  text not null,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (user_id, section_id)
);

-- ----------------------------------------------------------------------------
-- lesson_progress: one row per user per lesson (per section).
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_id   text not null,
  section_id  text not null,
  lesson_id   text not null,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (user_id, section_id, lesson_id)
);

-- ----------------------------------------------------------------------------
-- question_progress: one row per user per question (per lesson, per section).
-- question_number is 1-based within its lesson.
-- ----------------------------------------------------------------------------
create table if not exists public.question_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  course_id       text not null,
  section_id      text not null,
  lesson_id       text not null,
  question_number integer not null,
  completed       boolean not null default false,
  updated_at      timestamptz not null default now(),
  unique (user_id, section_id, lesson_id, question_number)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.accounts          enable row level security;
alter table public.course_progress   enable row level security;
alter table public.section_progress  enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.question_progress enable row level security;

-- accounts: a user owns the row whose id == their auth id.
drop policy if exists "accounts_select_own" on public.accounts;
create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = id);
drop policy if exists "accounts_insert_own" on public.accounts;
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = id);
drop policy if exists "accounts_update_own" on public.accounts;
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Progress tables: a user owns rows where user_id == their auth id.
-- One reusable pattern applied to each of the four progress tables.
do $$
declare t text;
begin
  foreach t in array array[
    'course_progress', 'section_progress', 'lesson_progress', 'question_progress'
  ] loop
    execute format('drop policy if exists "%1$s_all_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_all_own" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;
