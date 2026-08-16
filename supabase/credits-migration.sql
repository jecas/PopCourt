-- PopCourt — sistem kredita, telefon/datum rođenja korisnika, tip sporta po terenu
-- Pokreni JEDNOM u Supabase SQL Editoru (posle schema.sql i settings-migration.sql).

-- ============================================================
-- Novi podaci na profilu i terenima
-- ============================================================
alter table public.profiles add column credits numeric(6, 1) not null default 0;
alter table public.profiles add column phone text;
alter table public.profiles add column birth_date date;

alter table public.courts add column sport text not null default 'Tenis' check (sport in ('Tenis', 'Padel'));
update public.courts set sport = 'Padel' where name ilike 'padel%';

-- ============================================================
-- Zaštita: kredite i ulogu sme da menja SAMO admin, bez obzira ko
-- šalje UPDATE (čak i ako neko pokuša da izmeni svoj sopstveni red).
-- ============================================================
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

-- Admin sme da ažurira bilo koji profil (za dodelu kredita/uloge iz admin panela)
create policy "admin upravlja svim profilima"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Admin sme da vidi sve profile sa svim kolonama (već postoji "profiles su vidljivi
-- ulogovanim korisnicima" — ostaje, ovde ništa dodatno ne treba za select).

-- ============================================================
-- Rezervacija i otkazivanje sada idu isključivo kroz ove funkcije
-- (proveravaju i troše/vraćaju kredite atomično — ne mogu se zaobići
-- direktnim insert/delete pozivom sa klijenta).
-- ============================================================
drop policy if exists "korisnik pravi svoju rezervaciju najkasnije 1h unapred" on public.bookings;
drop policy if exists "korisnik otkazuje svoju rezervaciju najkasnije 24h unapred" on public.bookings;

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
