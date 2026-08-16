-- PopCourt — ispravka: rezervacija je bila blokirana za sve koji nisu admin
-- Trigger koji sprečava da korisnik SEBI ručno promeni kredite/ulogu je
-- greškom blokirao i samu book_court/cancel_booking funkciju, jer i ona
-- menja kredite korisnika (samo na ispravan, kontrolisan način). Zato je
-- svaka rezervacija javljala "Samo admin moze da menja kredite ili ulogu."
-- Ovo pokreni JEDNOM u SQL Editoru — samo zamenjuje tri postojeće funkcije,
-- ne dira podatke. Bezbedno je pokrenuti i ako si ranije već pokrenula
-- fix-timezone.sql (ova skripta uključuje i tu ispravku).

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.credits is distinct from old.credits or new.role is distinct from old.role) then
    if coalesce(current_setting('popcourt.credit_bypass', true), '') <> 'on'
       and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
      raise exception 'Samo admin moze da menja kredite ili ulogu.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.book_court(
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
  if (p_booking_date + (p_start_hour || ' hours')::interval) at time zone 'Europe/Belgrade' - now() < interval '1 hour' then
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

  perform set_config('popcourt.credit_bypass', 'on', true);
  update public.profiles set credits = credits - p_duration where id = auth.uid();

  return v_booking;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
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
  if (v_booking.booking_date + (v_booking.start_hour || ' hours')::interval) at time zone 'Europe/Belgrade' - now() < interval '24 hours' then
    raise exception 'Termin se ne može otkazati manje od 24h unapred.';
  end if;

  delete from public.bookings where id = p_booking_id;
  perform set_config('popcourt.credit_bypass', 'on', true);
  update public.profiles set credits = credits + v_booking.duration where id = auth.uid();
end;
$$;