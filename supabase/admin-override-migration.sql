-- PopCourt — admin rezerviše/otkazuje bez ograničenja + mejl vlasniku
-- kad admin otkaže NEKOM DRUGOM rezervaciju.
--
-- Pokreni JEDNOM u SQL Editoru, POSLE pricing-migration.sql.
--
-- Šta menja:
--   1. Admin ne troši kredite kad rezerviše (credits_charged = 0).
--   2. Admin ne mora da poštuje rok "1h unapred" pri rezervaciji.
--   3. Admin sme da otkaže BILO ČIJU rezervaciju, bez roka "24h unapred".
--   4. Kredit se pri otkazivanju uvek vraća VLASNIKU termina (ranije se,
--      greškom, vraćao onome ko je kliknuo otkaži — bezopasno dok je to
--      uvek bio sam vlasnik, ali pogrešno čim admin otkazuje tuđu
--      rezervaciju).
--   5. Kad admin otkaže tuđu rezervaciju, upisuje se red u novu tabelu
--      admin_cancellation_notices — na tu tabelu je potrebno okačiti
--      Database Webhook (Database → Webhooks u Supabase dashboard-u) koji
--      poziva Edge Function iz supabase/functions/notify-cancelled-booking
--      da bi korisnik dobio mejl. Uputstvo je u tom folderu.

create table public.admin_cancellation_notices (
  id uuid primary key default gen_random_uuid(),
  booking_user_id uuid not null references public.profiles(id) on delete cascade,
  court_id int,
  booking_date date,
  start_hour numeric,
  duration numeric,
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.admin_cancellation_notices enable row level security;

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

    select credits into v_credits from public.profiles where id = auth.uid() for update;
    if v_credits is null then
      raise exception 'Profil nije pronađen.';
    end if;
    if v_credits < v_price then
      raise exception 'Nemate dovoljno kredita za ovaj termin (potrebno % , dostupno %).', v_price, v_credits;
    end if;
  end if;

  insert into public.bookings (court_id, booking_date, start_hour, duration, user_id, credits_charged)
  values (p_court_id, p_booking_date, p_start_hour, p_duration, auth.uid(), v_price)
  returning * into v_booking;

  if not v_is_admin then
    perform set_config('popcourt.credit_bypass', 'on', true);
    update public.profiles set credits = credits - v_price where id = auth.uid();
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
  update public.profiles set credits = credits + v_booking.credits_charged where id = v_booking.user_id;
end;
$$;
