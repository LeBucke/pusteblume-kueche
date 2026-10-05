-- Paket 02, Migration 2: Rechte und Row Level Security nach SPEC 5.
--
-- Grundsatz: Wer nicht angemeldet oder deaktiviert ist, darf nichts. Alle aktiven Nutzer lesen
-- alles, geschrieben wird nach Rolle. Der Admin darf überall schreiben. Die Elternansicht greift
-- nie auf Tabellen zu, sondern später nur über Funktionen mit security definer (Paket 11).

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------

-- security definer: liest profiles ohne RLS, damit die Policies keine Rekursion auslösen.
create function public.has_role(r public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.active and r = any (p.roles)
  );
$$;

-- Angemeldet und nicht deaktiviert (unabhängig von der Rolle).
create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.active
  );
$$;

revoke all on function public.has_role(public.app_role) from public, anon, authenticated;
revoke all on function public.is_active_user() from public, anon, authenticated;
grant execute on function public.has_role(public.app_role) to authenticated, service_role;
grant execute on function public.is_active_user() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tabellenrechte (Data API Rollen) und RLS
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'suppliers', 'product_groups', 'ingredients', 'recipes',
    'recipe_ingredients', 'plan_days', 'plan_meals', 'week_templates', 'week_template_meals',
    'rotation_entries', 'shopping_lists', 'shopping_checks', 'shopping_extras', 'kitchen_feedback'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    -- Lesen: alle aktiven angemeldeten Nutzer.
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select public.is_active_user()))',
      t || '_select', t
    );
  end loop;
end;
$$;

-- profiles und settings: nur lesen und ändern. Profile entstehen per Trigger beim Anlegen des
-- Auth Nutzers und verschwinden mit ihm, settings hat genau eine Zeile aus dem Seed.
-- Es gibt dafür bewusst weder grant noch Policy für insert und delete.
grant select, update on public.profiles, public.settings to authenticated, service_role;
grant insert, delete on public.profiles, public.settings to service_role;

create policy profiles_update on public.profiles
  for update to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));

create policy settings_update on public.settings
  for update to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));

-- Schreiben nach Rolle. Jede Gruppe: Tabellen und erlaubte Rollen (admin immer dabei).
do $$
declare
  grp record;
  t text;
  check_expr text;
begin
  for grp in
    select * from (values
      -- Stammdaten, die nur der Admin pflegt
      (array['suppliers', 'product_groups'], array['admin']),
      -- Rezepte, Zutaten, Plan, Vorlagen, Rotation
      (array['recipes', 'recipe_ingredients', 'ingredients', 'plan_days', 'plan_meals',
             'week_templates', 'week_template_meals', 'rotation_entries'],
       array['admin', 'planung']),
      -- Einkaufslisten
      (array['shopping_lists', 'shopping_checks', 'shopping_extras'],
       array['admin', 'planung', 'einkauf']),
      -- Rückmeldung der Küche
      (array['kitchen_feedback'], array['admin', 'planung', 'kueche'])
    ) as v(tables, roles)
  loop
    select string_agg(format('(select public.has_role(%L))', r), ' or ') into check_expr
    from unnest(grp.roles) as r;

    foreach t in array grp.tables loop
      execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
      execute format('create policy %I on public.%I for insert to authenticated with check (%s)',
        t || '_insert', t, check_expr);
      execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
        t || '_update', t, check_expr, check_expr);
      execute format('create policy %I on public.%I for delete to authenticated using (%s)',
        t || '_delete', t, check_expr);
    end loop;
  end loop;
end;
$$;
