
-- Profiles table (renamed from "users" to avoid clashing with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('caregiver','volunteer')),
  avatar_url text,
  tasks_helped int not null default 0,
  tasks_received int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'caregiver')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Requests
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_type text not null check (task_type in ('grocery','transport','companionship','household','walk','errand')),
  location text not null,
  date_needed text not null,
  time_needed text not null,
  notes text,
  status text not null default 'open' check (status in ('open','claimed','completed')),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  claimed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;

create policy "Requests are viewable by everyone"
  on public.requests for select using (true);

create policy "Caregivers create their own requests"
  on public.requests for insert with check (auth.uid() = requester_id);

create policy "Requester or claimer can update"
  on public.requests for update using (
    auth.uid() = requester_id or auth.uid() = claimed_by or (status = 'open' and claimed_by is null)
  );

create policy "Requester can delete"
  on public.requests for delete using (auth.uid() = requester_id);

create index on public.requests (status, created_at desc);

-- Badges
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_type)
);

alter table public.badges enable row level security;

create policy "Badges are viewable by everyone"
  on public.badges for select using (true);

create policy "Users can insert own badges"
  on public.badges for insert with check (auth.uid() = user_id);
