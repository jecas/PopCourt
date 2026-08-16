-- PopCourt — ime kluba kao podešavanje (ne zakucano u kodu) + automatsko
-- popunjavanje žreba pobednicima kad sudija završi meč.
-- Pokreni JEDNOM u Supabase SQL Editoru (posle prethodnih migracija).

-- ============================================================
-- Ime kluba kao podešavanje
-- ============================================================
alter table public.club_settings add column name text not null default 'Teniski i padel centar';

-- ============================================================
-- Veza meča sa mestom u žrebu (opciono — samo za meceve iz turnira)
-- ============================================================
alter table public.matches add column draw_id uuid references public.draws(id);
alter table public.matches add column round_index int;
alter table public.matches add column match_index int;

-- ============================================================
-- Završi meč i automatski upiši pobednika u sledeće kolo žreba
-- (poziva se umesto običnog update-a kad sudija klikne "Završi")
-- ============================================================
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
    return; -- nerešeno/nepotpuno, ne pomeramo dalje
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
    return; -- ovo je bio finale, nema sledeceg kola
  end if;

  v_rounds := jsonb_set(
    v_draw.rounds,
    array[v_next_round::text, v_next_index::text, v_slot_key],
    to_jsonb(v_winner)
  );

  update public.draws set rounds = v_rounds where id = v_draw.id;
end;
$$;
