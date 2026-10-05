-- Prüft handle_new_user (Rollen und Name) direkt per Insert in auth.users, weil die Auth API
-- app_metadata erst nach dem Insert setzt und invited_at nicht von außen setzbar ist.
-- Aufruf: npx supabase db query --linked -f supabase/tests/profile_trigger.sql
-- Fehlschlag wirft eine Exception. Die Testnutzer werden am Ende (und per Cascade ihre Profile) gelöscht.

do $$
declare
  ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  p public.profiles;
begin
  begin
    -- 1. Einladung: Rollen aus user_metadata, Unbekanntes und Doppeltes fliegt raus.
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, invited_at)
    values (ids[1], 'authenticated', 'authenticated', 'rls-test-trigger-1@example.test', '{}',
            '{"display_name":"Eingeladen","roles":["einkauf","bogus","einkauf","kueche"]}', now());
    select * into p from public.profiles where id = ids[1];
    assert p.roles = array['einkauf', 'kueche']::public.app_role[], 'Einladung: Rollen aus user_metadata';
    assert p.display_name = 'Eingeladen', 'Einladung: Name aus user_metadata';
    assert p.active, 'Einladung: aktiv';

    -- 2. Registrierung ohne Einladung: user_metadata.roles zählt nicht.
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
    values (ids[2], 'authenticated', 'authenticated', 'rls-test-trigger-2@example.test', '{}',
            '{"roles":["admin"]}');
    select * into p from public.profiles where id = ids[2];
    assert p.roles = '{}', 'Ohne Einladung keine Rollen aus user_metadata';
    assert p.display_name = 'rls-test-trigger-2@example.test', 'Name fällt auf die Mailadresse zurück';

    -- 3. app_metadata (nur per Service Role setzbar) zählt immer.
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
    values (ids[3], 'authenticated', 'authenticated', 'rls-test-trigger-3@example.test',
            '{"roles":["planung"]}', '{}');
    select * into p from public.profiles where id = ids[3];
    assert p.roles = array['planung']::public.app_role[], 'app_metadata.roles';

    -- 4. Rollen als Nicht-Liste werden ignoriert, kein Absturz.
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, invited_at)
    values (ids[4], 'authenticated', 'authenticated', 'rls-test-trigger-4@example.test', '{}',
            '{"roles":"admin"}', now());
    select * into p from public.profiles where id = ids[4];
    assert p.roles = '{}', 'Rollen als Text werden ignoriert';

    raise notice 'Profil Trigger: alle Prüfungen bestanden';
  exception when others then
    delete from auth.users where id = any (ids);
    raise;
  end;
  delete from auth.users where id = any (ids);
end;
$$;
