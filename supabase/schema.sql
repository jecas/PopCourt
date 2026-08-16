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
  credits numeric(6, 1) not null default 0,
  phone text,
  birth_date date,
  created_at timestamptz not null default now()
);

-- Zaštita: kredite i ulogu sme da menja SAMO admin, bez obzira ko šalje UPDATE
create function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.credits is distinct from old.credits or new.role is distinct from old.role) then
    if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
      raise exception 'Samo admin moze da menja kredite ili ulogu.';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_privileged_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_privileged_profile_fields();

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
-- CLUB SETTINGS (adresa/telefon — menja admin kroz sajt)
-- ============================================================
create table public.club_settings (
  id int primary key default 1,
  name text not null default 'Teniski i padel centar',
  address text not null,
  phone text not null,
  updated_at timestamptz not null default now(),
  constraint club_settings_single_row check (id = 1)
);

insert into public.club_settings (id, name, address, phone) values (
  1,
  'Teniski i padel centar',
  'Hipodrom, Bavaništanski put bb, Pančevo',
  '060/3622-226'
);

-- ============================================================
-- COURTS
-- ============================================================
create table public.courts (
  id serial primary key,
  name text not null,
  sport text not null default 'Tenis' check (sport in ('Tenis', 'Padel')),
  sort_order int not null
);

insert into public.courts (name, sport, sort_order) values
  ('Teren 1 (tvrda, hala)', 'Tenis', 1),
  ('Teren 2 (tvrda, hala)', 'Tenis', 2),
  ('Teren 3 (šljaka)', 'Tenis', 3),
  ('Teren 4 (šljaka)', 'Tenis', 4),
  ('Teren 5 (šljaka)', 'Tenis', 5),
  ('Padel 1', 'Padel', 6),
  ('Padel 2', 'Padel', 7);

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
  draw_id uuid, -- FK dodat posle DRAWS tabele ispod (draws jos ne postoji ovde)
  round_index int,
  match_index int,
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

alter table public.matches add constraint matches_draw_id_fkey foreign key (draw_id) references public.draws(id);

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
alter table public.club_settings enable row level security;
alter table public.courts enable row level security;
alter table public.matches enable row level security;
alter table public.draws enable row level security;
alter table public.bookings enable row level security;

-- club_settings
create policy "podesavanja su javno vidljiva"
  on public.club_settings for select
  using (true);

create policy "samo admin menja podesavanja"
  on public.club_settings for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- profiles
create policy "profiles su vidljivi ulogovanim korisnicima"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "korisnik menja samo svoj profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "admin upravlja svim profilima"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

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

-- bookings — svi ulogovani vide zauzeća; kreiranje/otkazivanje ide isključivo
-- kroz book_court()/cancel_booking() funkcije (troše/vraćaju kredite atomično),
-- zato nema insert/delete RLS politike — direktan insert/delete sa klijenta je odbijen.
create policy "ulogovani vide sve rezervacije"
  on public.bookings for select
  using (auth.role() = 'authenticated');

create function public.book_court(
  p_court_id int,
  p_booking_date date,
  p_start_hour numeric,
  p_duration numeric
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_credits numeric;
  v_booking public.bookings;
begin
  if (p_booking_date + (p_start_hour || ' hours')::interval) - now() < interval '1 hour' then
    raise exception 'Termin mora biti rezervisan najkasnije 1h unapred.';
  end if;

  select credits into v_credits from public.profiles where id = auth.uid() for update;
  if v_credits is null then
    raise exception 'Profil nije pronađen.';
  end if;
  if v_credits < p_duration then
    raise exception 'Nemate dovoljno kredita za ovaj termin (potrebno % , dostupno %).', p_duration, v_credits;
  end if;

  insert into public.bookings (court_id, booking_date, start_hour, duration, user_id)
  values (p_court_id, p_booking_date, p_start_hour, p_duration, auth.uid())
  returning * into v_booking;

  update public.profiles set credits = credits - p_duration where id = auth.uid();

  return v_booking;
end;
$$;

create function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Rezervacija ne postoji.';
  end if;
  if v_booking.user_id <> auth.uid() then
    raise exception 'Možete otkazati samo svoju rezervaciju.';
  end if;
  if (v_booking.booking_date + (v_booking.start_hour || ' hours')::interval) - now() < interval '24 hours' then
    raise exception 'Termin se ne može otkazati manje od 24h unapred.';
  end if;

  delete from public.bookings where id = p_booking_id;
  update public.profiles set credits = credits + v_booking.duration where id = auth.uid();
end;
$$;

-- Zavrsi mec i automatski upisi pobednika u sledece kolo zreba (ako je mec vezan za zreb)
create function public.finish_match(p_match_id uuid, p_sets jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_match public.matches;
  v_draw public.draws;
  v_p1_sets int := 0;
  v_p2_sets int := 0;
  v_set jsonb;
  v_winner text;
  v_rounds jsonb;
  v_next_round int;
  v_next_index int;
  v_slot_key text;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('referee', 'admin')) then
    raise exception 'Samo sudije i admin mogu da zavrse mec.';
  end if;

  update public.matches
  set status = 'finished', sets = p_sets, updated_at = now()
  where id = p_match_id
  returning * into v_match;

  if v_match.draw_id is null then
    return;
  end if;

  for v_set in select * from jsonb_array_elements(p_sets)
  loop
    if (v_set->>0)::int > (v_set->>1)::int then
      v_p1_sets := v_p1_sets + 1;
    elsif (v_set->>1)::int > (v_set->>0)::int then
      v_p2_sets := v_p2_sets + 1;
    end if;
  end loop;

  if v_p1_sets = v_p2_sets then
    return;
  end if;

  v_winner := case when v_p1_sets > v_p2_sets then v_match.player1 else v_match.player2 end;

  select * into v_draw from public.draws where id = v_match.draw_id;
  if v_draw is null then
    return;
  end if;

  v_next_round := v_match.round_index + 1;
  v_next_index := v_match.match_index / 2;
  v_slot_key := case when v_match.match_index % 2 = 0 then 'a' else 'b' end;

  if jsonb_array_length(v_draw.rounds) <= v_next_round then
    return;
  end if;

  v_rounds := jsonb_set(
    v_draw.rounds,
    array[v_next_round::text, v_next_index::text, v_slot_key],
    to_jsonb(v_winner)
  );

  update public.draws set rounds = v_rounds where id = v_draw.id;
end;
$$;

-- ============================================================
-- REALTIME — omogući live ažuriranje rezultata, rezervacija i žreba
-- ============================================================
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.draws;
alter publication supabase_realtime add table public.club_settings;

-- ============================================================
-- Primer mečeva za probu (opciono, obriši ako ne trebaju)
-- ============================================================
insert into public.matches (sport, round, player1, player2, court_id, status, sets) values
  ('Tenis', 'Zimska liga - Grupa A', 'V. Popović', 'M. Jovanović', 2, 'live', '[[6,4],[3,6],[7,5]]'),
  ('Padel', 'Kup Pančeva - Osmina finala', 'Ilić / Radović', 'Nešić / Tanasić', 6, 'live', '[[6,2]]'),
  ('Tenis', 'Zimska liga - Grupa B', 'D. Kostić', 'A. Simić', 5, 'finished', '[[6,3],[6,4]]');

insert into public.matches (sport, round, player1, player2, court_id, status, scheduled_time) values
  ('Tenis', 'Zimska liga - Grupa A', 'N. Perić', 'J. Vukašinović', 1, 'scheduled', '18:30');
