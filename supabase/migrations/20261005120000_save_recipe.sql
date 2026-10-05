-- Paket 06: Rezept mit Zutatenzeilen in einer Transaktion speichern (SPEC 4.4).
--
-- security invoker: Die Funktion läuft mit den Rechten und unter der RLS des Aufrufers, die RLS ist
-- also die zweite Sperre. Die Rollenprüfung am Anfang sorgt dafür, dass ein Aufruf ohne Recht laut
-- scheitert, statt wegen der RLS stumm nichts zu ändern.
--
-- p_recipe:  {name, course, category, base_children, base_adults, description, author, steps, notes}
-- p_lines:   [{ingredient_id, amount, unit, note}, ...] in der gewünschten Reihenfolge
-- p_id:      null = neues Rezept, sonst wird dieses Rezept geändert und seine Zeilen ersetzt.
-- Rückgabe:  die ID des Rezepts.

create function public.save_recipe(p_id uuid, p_recipe jsonb, p_lines jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result_id uuid;
begin
  if not (public.has_role('admin') or public.has_role('planung')) then
    raise exception 'Keine Berechtigung zum Speichern von Rezepten.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'Zutatenzeilen fehlen.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.recipes (
      name, course, category, base_children, base_adults, description, author, steps, notes
    )
    values (
      p_recipe ->> 'name',
      (p_recipe ->> 'course')::public.course,
      nullif(p_recipe ->> 'category', ''),
      (p_recipe ->> 'base_children')::int,
      (p_recipe ->> 'base_adults')::int,
      nullif(p_recipe ->> 'description', ''),
      nullif(p_recipe ->> 'author', ''),
      nullif(p_recipe ->> 'steps', ''),
      nullif(p_recipe ->> 'notes', '')
    )
    returning id into result_id;
  else
    update public.recipes
    set name = p_recipe ->> 'name',
        course = (p_recipe ->> 'course')::public.course,
        category = nullif(p_recipe ->> 'category', ''),
        base_children = (p_recipe ->> 'base_children')::int,
        base_adults = (p_recipe ->> 'base_adults')::int,
        description = nullif(p_recipe ->> 'description', ''),
        author = nullif(p_recipe ->> 'author', ''),
        steps = nullif(p_recipe ->> 'steps', ''),
        notes = nullif(p_recipe ->> 'notes', '')
    where id = p_id
    returning id into result_id;

    if result_id is null then
      raise exception 'Rezept nicht gefunden.' using errcode = 'P0002';
    end if;

    delete from public.recipe_ingredients where recipe_id = result_id;
  end if;

  insert into public.recipe_ingredients (recipe_id, ingredient_id, amount, unit, note, sort)
  select
    result_id,
    (line ->> 'ingredient_id')::uuid,
    (line ->> 'amount')::numeric,
    nullif(line ->> 'unit', ''),
    nullif(line ->> 'note', ''),
    (position - 1)::int
  from jsonb_array_elements(p_lines) with ordinality as t(line, position);

  return result_id;
end;
$$;

revoke all on function public.save_recipe(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, jsonb, jsonb) to authenticated, service_role;
