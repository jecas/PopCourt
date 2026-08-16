-- PopCourt — DEMO SEED
-- Pokreni ovo u Supabase SQL Editoru neposredno pre prezentacije da baza
-- izgleda uredno i "živo" (par mečeva uživo, jedan završen, žreb objavljen).
--
-- UPOZORENJE: ovo BRIŠE sve postojeće mečeve, žrebove i rezervacije.
-- Koristi samo na test/demo projektu, ne na projektu sa pravim rezervacijama kupaca!

delete from public.bookings;
delete from public.matches;
delete from public.draws;

-- ============================================================
-- Mečevi — mešavina uživo / završeno / zakazano, razni tereni i sportovi
-- ============================================================
insert into public.matches (sport, round, player1, player2, court_id, status, sets) values
  ('Tenis', 'Zimska liga - Grupa A', 'V. Popović', 'M. Jovanović', 2, 'live', '[[6,4],[5,6],[3,2]]'),
  ('Padel', 'Kup Pančeva - Četvrtfinale', 'Ilić / Radović', 'Nešić / Tanasić', 6, 'live', '[[6,3],[2,4]]'),
  ('Tenis', 'Zimska liga - Grupa B', 'D. Kostić', 'A. Simić', 1, 'live', '[[7,6]]'),
  ('Tenis', 'Zimska liga - Grupa B', 'N. Perić', 'J. Vukašinović', 5, 'finished', '[[6,3],[6,4]]'),
  ('Padel', 'Kup Pančeva - Četvrtfinale', 'Marković / Stanić', 'Pavlović / Đorđević', 7, 'finished', '[[6,2],[4,6],[6,1]]');

insert into public.matches (sport, round, player1, player2, court_id, status, scheduled_time) values
  ('Tenis', 'Zimska liga - Grupa A', 'S. Lukić', 'T. Ninković', 3, 'scheduled', '18:00'),
  ('Padel', 'Rekreativna liga', 'Todorović / Aleksić', 'Filipović / Ranković', 6, 'scheduled', '19:30');

-- ============================================================
-- Objavljen žreb za naslovnu stranicu
-- ============================================================
insert into public.draws (players, rounds, published, created_at) values (
  '["Popović","Jovanović","Kostić","Simić","Perić","Vukašinović","Ilić","Radović"]'::jsonb,
  '[
    [
      {"a":"Popović","b":"Vukašinović"},
      {"a":"Kostić","b":"Radović"},
      {"a":"Perić","b":"Simić"},
      {"a":"Ilić","b":"Jovanović"}
    ],
    [
      {"a":null,"b":null},
      {"a":null,"b":null}
    ],
    [
      {"a":null,"b":null}
    ]
  ]'::jsonb,
  true,
  now()
);
