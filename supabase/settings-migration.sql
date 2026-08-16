-- PopCourt — dodaje tabelu za podešavanja kluba (adresa, telefon)
-- koja se menja kroz admin panel na sajtu, ne kroz kod.
-- Pokreni ovo JEDNOM u Supabase SQL Editoru (posle glavnog schema.sql).

create table public.club_settings (
  id int primary key default 1,
  address text not null,
  phone text not null,
  updated_at timestamptz not null default now(),
  constraint club_settings_single_row check (id = 1)
);

insert into public.club_settings (id, address, phone) values (
  1,
  'Hipodrom, Bavaništanski put bb, Pančevo',
  '060/3622-226'
);

alter table public.club_settings enable row level security;

create policy "podesavanja su javno vidljiva"
  on public.club_settings for select
  using (true);

create policy "samo admin menja podesavanja"
  on public.club_settings for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter publication supabase_realtime add table public.club_settings;
