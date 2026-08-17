-- PopCourt — pravi novac (dinari) umesto apstraktnih kredita
-- Menja profiles.credits -> profiles.balance i bookings.credits_charged ->
-- bookings.amount_charged, i ažurira funkcije da rade sa dinarima.
--
-- Pokreni JEDNOM u SQL Editoru, POSLE admin-override-migration.sql.
--
-- NAPOMENA: ovo samo preimenuje kolone — postojeći brojevi (npr. "8.5")
-- ostaju isti, samo se sada tumače kao dinari, ne kao krediti. Ako imaš
-- test naloge sa "kreditima" tipa 8.5 ili 15, posle ove migracije to
-- postaje 8,5 din / 15 din — verovatno ćeš hteti da im ručno podesiš
-- pravo stanje na strani Korisnici.

alter table public.profiles rename column credits to balance;
alter table public.bookings rename column credits_charged to amount_charged;

alter table public.profiles alter column balance type numeric(10, 2);
alter table public.bookings alter column amount_charged type numeric(10, 2);
alter table public.price_rules alter column price_per_hour type numeric(8, 2);

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.balance is distinct from old.balance or new.role is distinct from old.role) then
    if coalesce(current_setting('popcourt.credit_bypass', true), '') <> 'on'
       and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
      raise exception 'Samo admin moze da menja stanje racuna ili ulogu.';
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
  v_balance numeric;
  v_sport text;
  v_price numeric;
  v_is_admin boolean;
  v_booking public.bookings;
begin
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') into v_is_admin;

  if not v_is_admin and (p_booking_date + (p_start_hour || ' hours')::interval) at time zone 'Europe/Belgrade' - now() < interval '1 hour' then
    raise exception 'Termin mora biti rezervisan najkasnije 1h unapred.';
  end if;

  select sport into v_sport from public.courts where id = p_court_id;
  if v_sport is null then
    raise exception 'Teren nije pronađen.';
  end if;

  if v_is_admin then
    v_price := 0;
  else
    v_price := public.compute_booking_price(v_sport, p_start_hour, p_duration);

    select balance into v_balance from public.profiles where id = auth.uid() for update;
    if v_balance is null then
      raise exception 'Profil nije pronađen.';
    end if;
    if v_balance < v_price then
      raise exception 'Nemate dovoljno sredstava na računu za ovaj termin (potrebno % din, dostupno % din).', v_price, v_balance;
    end if;
  end if;

  insert into public.bookings (court_id, booking_date, start_hour, duration, user_id, amount_charged)
  values (p_court_id, p_booking_date, p_start_hour, p_duration, auth.uid(), v_price)
  returning * into v_booking;

  if not v_is_admin then
    perform set_config('popcourt.credit_bypass', 'on', true);
    update public.profiles set balance = balance - v_price where id = auth.uid();
  end if;

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
  v_is_admin boolean;
begin
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') into v_is_admin;

  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Rezervacija ne postoji.';
  end if;
  if not v_is_admin and v_booking.user_id <> auth.uid() then
    raise exception 'Možete otkazati samo svoju rezervaciju.';
  end if;
  if not v_is_admin and (v_booking.booking_date + (v_booking.start_hour || ' hours')::interval) at time zone 'Europe/Belgrade' - now() < interval '24 hours' then
    raise exception 'Termin se ne može otkazati manje od 24h unapred.';
  end if;

  if v_is_admin and v_booking.user_id <> auth.uid() then
    insert into public.admin_cancellation_notices (booking_user_id, court_id, booking_date, start_hour, duration, cancelled_by)
    values (v_booking.user_id, v_booking.court_id, v_booking.booking_date, v_booking.start_hour, v_booking.duration, auth.uid());
  end if;

  delete from public.bookings where id = p_booking_id;
  perform set_config('popcourt.credit_bypass', 'on', true);
  update public.profiles set balance = balance + v_booking.amount_charged where id = v_booking.user_id;
end;
$$;

-- Opciono: ako želiš da odmah postaviš realne dinarske cene po zoni
-- (umesto starih malih brojeva), otkomentariši i pokreni:
-- update public.price_rules set price_per_hour = 800 where sport = 'Tenis' and start_hour = 7;
-- update public.price_rules set price_per_hour = 900 where sport = 'Tenis' and start_hour = 17;
-- update public.price_rules set price_per_hour = 1000 where sport = 'Padel' and start_hour = 7;
-- update public.price_rules set price_per_hour = 1200 where sport = 'Padel' and start_hour = 17;
