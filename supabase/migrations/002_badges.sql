-- À exécuter dans Supabase > SQL Editor
alter table public.animateurs
  add column if not exists badge_observateur boolean default false,
  add column if not exists badge_coanimateur boolean default false;
