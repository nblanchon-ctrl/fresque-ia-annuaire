-- =============================================================
-- FRESQUE DE L'IA — Annuaire des animateurs
-- À exécuter dans Supabase > SQL Editor
-- =============================================================

-- Table des profils animateurs
create table public.animateurs (
  id uuid references auth.users on delete cascade primary key,
  nom text not null,
  titre text,
  email text,
  telephone text,
  region text,
  ville text,
  bio text,
  photo_url text,
  competences text[] default '{}',
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activer Row Level Security
alter table public.animateurs enable row level security;

-- Tout le monde peut lire l'annuaire
create policy "Lecture publique"
  on public.animateurs for select
  using (true);

-- Chaque animateur peut modifier uniquement sa propre fiche
create policy "Modification par le propriétaire"
  on public.animateurs for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insertion uniquement pour son propre profil
create policy "Insertion par le propriétaire"
  on public.animateurs for insert
  with check (auth.uid() = id);

-- Suppression uniquement pour son propre profil (ou admin)
create policy "Suppression par le propriétaire ou admin"
  on public.animateurs for delete
  using (
    auth.uid() = id
    or exists (
      select 1 from public.animateurs
      where id = auth.uid() and is_admin = true
    )
  );

-- Storage bucket pour les photos de profil
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Upload photo par le propriétaire"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Lecture publique des photos"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Mise à jour photo par le propriétaire"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Fonction pour créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.animateurs (id, nom, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Déclencher la création de profil à chaque inscription
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
