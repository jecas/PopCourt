-- PopCourt — Supabase šema
-- Pokrenuti kompletno u Supabase dashboard-u: SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ============================================================
-- PROFILES (1:1 sa auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null default 'player' check (role in ('player', 'coach', 'referee', 'admin')),
  created_at timestamptz not null default now()
);

-- Automatski napravi profil kad se neko registruje.
-- Korisničko ime se ne unosi posebno — uvek je isto što i email sa kojim se korisnik registrovao.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- COURTS
-- ============================================================
create table public.courts (
  id serial primary key,
  name text not null,
  sort_order int not null
);

insert into public.courts (name, sort_order) values
  ('Teren 1 (tvrda, hala)', 1),
  ('Teren 2 (tvrda, hala)', 2),
  ('Teren 3 (šljaka)', 3),
  ('Teren 4 (šljaka)', 4),
  ('Teren 5 (šljaka)', 5),
  ('Padel 1', 6),
  ('Padel 2', 7);

-- ============================================================
-- MATCHES (rezultati uživo)
-- ============================================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  sport text not null check (sport in ('Tenis', 'Padel')),
  round text not null,
  player1 text not null,
  player2 text not null,
  court_id int references public.courts(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  scheduled_time text,
  sets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DRAWS (žreb turnira)
-- ============================================================
create table public.draws (
  id uuid primary key default gen_random_uuid(),
  players jsonb not null,
  rounds jsonb not null,
  published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- BOOKINGS (rezervacije terena)
-- ============================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  court_id int not null references public.courts(id),
  booking_date date not null,
  start_hour numeric(4, 1) not null check (start_hour >= 8 and start_hour < 22),
  duration numeric(3, 1) not null check (duration in (1, 1.5, 2)),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint valid_slot check (start_hour = floor(start_hour * 2) / 2),
  constraint fits_before_close check (start_hour + duration <= 22),
  -- baza sama sprečava preklapanje termina na istom terenu istog dana
  exclude using gist (
    court_id with =,
    booking_date with =,
    numrange(start_hour, start_hour + duration, '[)') with &&
  )
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.matches enable row level security;
alter table public.draws enable row level security;
alter table public.bookings enable row level security;

-- profiles
create policy "profiles su vidljivi ulogovanim korisnicima"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "korisnik menja samo svoj profil"
  on public.profiles for update
  using (auth.uid() = id);

-- courts
create policy "tereni su javno vidljivi"
  on public.courts for select
  using (true);

-- matches — javno vidljivi (i gostima bez naloga), menjaju samo sudije/admin
create policy "mecevi su javno vidljivi"
  on public.matches for select
  using (true);

create policy "sudije i admin dodaju meceve"
  on public.matches for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('referee', 'admin'))
  );

create policy "sudije i admin azuriraju meceve"
  on public.matches for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('referee', 'admin'))
  );

-- draws — objavljeni žreb je javan, treneri/admin vide i neobjavljene i uređuju
create policy "objavljen zreb je javno vidljiv"
  on public.draws for select
  using (
    published = true
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('coach', 'admin'))
  );

create policy "treneri i admin prave zreb"
  on public.draws for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('coach', 'admin'))
  );

create policy "treneri i admin azuriraju zreb"
  on public.draws for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('coach', 'admin'))
  );

-- bookings — svi ulogovani vide zauzeća, svako pravi/otkazuje samo svoju rezervaciju
create policy "ulogovani vide sve rezervacije"
  on public.bookings for select
  using (auth.role() = 'authenticated');

create policy "korisnik pravi svoju rezervaciju najkasnije 1h unapred"
  on public.bookings for insert
  with check (
    auth.uid() = user_id
    and (booking_date + (start_hour || ' hours')::interval) - now() >= interval '1 hour'
  );

create policy "korisnik otkazuje svoju rezervaciju najkasnije 24h unapred"
  on public.bookings for delete
  using (
    auth.uid() = user_id
    and (booking_date + (start_hour || ' hours')::interval) - now() >= interval '24 hours'
  );

-- ============================================================
-- REALTIME — omogući live ažuriranje rezultata, rezervacija i žreba
-- ============================================================
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.draws;

-- ============================================================
-- Primer mečeva za probu (opciono, obriši ako ne trebaju)
-- ============================================================
insert into public.matches (sport, round, player1, player2, court_id, status, sets) values
  ('Tenis', 'Zimska liga - Grupa A', 'V. Popović', 'M. Jovanović', 2, 'live', '[[6,4],[3,6],[7,5]]'),
  ('Padel', 'Kup Pančeva - Osmina finala', 'Ilić / Radović', 'Nešić / Tanasić', 6, 'live', '[[6,2]]'),
  ('Tenis', 'Zimska liga - Grupa B', 'D. Kostić', 'A. Simić', 5, 'finished', '[[6,3],[6,4]]');

insert into public.matches (sport, round, player1, player2, court_id, status, scheduled_time) values
  ('Tenis', 'Zimska liga - Grupa A', 'N. Perić', 'J. Vukašinović', 1, 'scheduled', '18:30');
