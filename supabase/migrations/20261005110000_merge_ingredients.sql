-- Paket 05: Zutaten zusammenführen (SPEC 4.2).
--
-- security invoker: Die Funktion läuft mit den Rechten und unter der RLS des Aufrufers, die RLS ist
-- also die zweite Sperre. Die Rollenprüfung am Anfang sorgt dafür, dass ein Aufruf ohne Recht
-- laut scheitert, statt wegen der RLS stumm 0 Zeilen zu ändern. Die ganze Funktion ist eine Transaktion.
-- Rückgabe: Zahl der Rezepte, deren Zutatenliste die Quelle enthielt.

create function public.merge_ingredients(source_id uuid, target_id uuid)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_row public.ingredients;
  target_row public.ingredients;
  affected int;
  new_aliases text[];
begin
  if not (public.has_role('admin') or public.has_role('planung')) then
    raise exception 'Keine Berechtigung zum Zusammenführen.' using errcode = '42501';
  end if;
  if source_id = target_id then
    raise exception 'Quelle und Ziel sind dieselbe Zutat.' using errcode = '22023';
  end if;

  select * into source_row from public.ingredients where id = source_id for update;
  select * into target_row from public.ingredients where id = target_id for update;
  if source_row.id is null or target_row.id is null then
    raise exception 'Zutat nicht gefunden.' using errcode = 'P0002';
  end if;

  select count(distinct recipe_id) into affected
  from public.recipe_ingredients
  where ingredient_id = source_id;

  update public.recipe_ingredients set ingredient_id = target_id where ingredient_id = source_id;

  -- Name und Synonyme der Quelle bleiben als Synonyme des Ziels auffindbar, ohne Doppelte
  -- und ohne den Namen des Ziels selbst.
  select coalesce(array_agg(a order by first_pos), '{}')
  into new_aliases
  from (
    select a, min(pos) as first_pos
    from unnest(target_row.aliases || array[source_row.name::text] || source_row.aliases)
      with ordinality as t(a, pos)
    where lower(a) <> lower(target_row.name::text)
    group by a
  ) s;

  update public.ingredients set aliases = new_aliases where id = target_id;
  update public.ingredients set archived = true where id = source_id;

  return affected;
end;
$$;

revoke all on function public.merge_ingredients(uuid, uuid) from public, anon;
grant execute on function public.merge_ingredients(uuid, uuid) to authenticated, service_role;
