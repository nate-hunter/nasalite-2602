-- Table for public user profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text,
  avatar_url text,
  updated_at timestamptz default now(),
  email text,
  app_role text not null default 'authenticated' check (app_role in ('super_admin', 'authenticated')),
  constraint profiles_username_check check ((char_length(username) >= 3))
);

-- RLS
alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Only super_admin may change app_role; enforced by trigger below.
create or replace function public.prevent_app_role_change_by_non_super_admin()
returns trigger
set search_path = ''
as $$
begin
  if old.app_role is distinct from new.app_role then
    if (select up.app_role from public.user_profiles up where up.id = auth.uid()) <> 'super_admin' then
      raise exception 'Only super_admin can change app_role.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists prevent_app_role_change on public.user_profiles;
create trigger prevent_app_role_change
  before update on public.user_profiles
  for each row execute procedure public.prevent_app_role_change_by_non_super_admin();

-- This trigger automatically creates a user profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();