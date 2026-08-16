-- PopCourt — cenovnik po zonama određuje koliko se kredita skida po rezervaciji
-- Do sada je svaki sat koštao tačno 1 kredit, bez obzira na teren ili doba dana.
-- Ovo dodaje pravi cenovnik (cena po satu, po sportu i vremenskoj zoni), koji
-- admin uređuje na strani "Cenovnik", i koji rezervacija sada zaista koristi
-- da izračuna koliko kredita da skine.
--
-- Pokreni JEDNOM u SQL Editoru, POSLE fix-credits-trigger.sql (rezervacija
-- mora već da radi pre ove skripte).
--
-- NAPOMENA: cene ispod (1 kredit/h u zoni 1, 1.2 kredit/h u zoni 2) su samo
-- početna vrednost da sistem odmah radi — nisu vezane za dinarske cene sa
-- stare cenovnik strane. Slobodno ih izmeni na strani Cenovnik (kao admin)
-- na brojeve koji ti odgovaraju; postojećim korisnicima ćeš možda hteti da
-- ručno podesiš broj kredita na "Korisnici" strani da odgovara novim cenama.

create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  sport text not null check (sport in ('Tenis', 'Padel')),
  start_hour numeric not null,
  end_hour numeric not null,
  price_per_hour numeric(6, 2) not null,
  sort_order int not null default 0
);

alter table public.price_rules enable row level security;

create policy "cenovnik je javno vidljiv"
  on public.price_rules for select
  using (true);

create policy "admin menja cenovnik"
  on public.price_rules for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into public.price_rules (sport, start_hour, end_hour, price_per_hour, sort_order) values
  ('Tenis', 7, 17, 1, 1),
  ('Tenis', 17, 24, 1.2, 2),
  ('Padel', 7, 17, 1, 1),
  ('Padel', 17, 24, 1.2, 2);

alter table public.bookings add column credits_charged numeric(6, 2);
update public.bookings set credits_charged = duration where credits_charged is null;
alter table public.bookings alter column credits_charged set not null;

create function public.compute_booking_price(p_sport text, p_start_hour numeric, p_duration numeric)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_total numeric := 0;
  v_slot numeric;
  v_rate numeric;
begin
  v_slot := p_start_hour;
  while v_slot < p_start_hour + p_duration loop
    select price_per_hour into v_rate
      from public.price_rules
      where sport = p_sport and v_slot >= start_hour and v_slot < end_hour
      order by sort_order limit 1;
    if v_rate is null then
      raise exception 'Nema definisane cene za % u terminu %h.', p_sport, v_slot;
    end if;
    v_total := v_total + v_rate * 0.5;
    v_slot := v_slot + 0.5;
  end loop;
  return v_total;
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
  v_sport text;
  v_price numeric;
  v_booking public.bookings;
begin
  if (p_booking_date + (p_start_hour || ' hours')::interval) at time zone 'Europe/Belgrade' - now() < interval '1 hour' then
    raise exception 'Termin mora biti rezervisan najkasnije 1h unapred.';
  end if;

  select sport into v_sport from public.courts where id = p_court_id;
  if v_sport is null then
    raise exception 'Teren nije pronađen.';
  end if;

  v_price := public.compute_booking_price(v_sport, p_start_hour, p_duration);

  select credits into v_credits from public.profiles where id = auth.uid() for update;
  if v_credits is null then
    raise exception 'Profil nije pronađen.';
  end if;
  if v_credits < v_price then
    raise exception 'Nemate dovoljno kredita za ovaj termin (potrebno % , dostupno %).', v_price, v_credits;
  end if;

  insert into public.bookings (court_id, booking_date, start_hour, duration, user_id, credits_charged)
  values (p_court_id, p_booking_date, p_start_hour, p_duration, auth.uid(), v_price)
  returning * into v_booking;

  perform set_config('popcourt.credit_bypass', 'on', true);
  update public.profiles set credits = credits - v_price where id = auth.uid();

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
  update public.profiles set credits = credits + v_booking.credits_charged where id = auth.uid();
end;
$$;

alter publication supabase_realtime add table public.price_rules;
