-- PopCourt — ispravka provere vremena za rezervaciju/otkazivanje
-- Baza je do sada računala "8h" kao 8h po UTC vremenu, ne po lokalnom
-- vremenu kluba (Beograd), pa je provera "najkasnije 1h unapred" znala
-- da bude netačna za par sati. Ovo pokreni JEDNOM u SQL Editoru — samo
-- zamenjuje dve postojeće funkcije, ne dira podatke.

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
  update public.profiles set credits = credits + v_booking.duration where id = auth.uid();
end;
$$;
