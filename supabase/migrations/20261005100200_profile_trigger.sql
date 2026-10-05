-- Paket 02, Migration 3: Beim Anlegen eines Auth Nutzers entsteht automatisch ein Profil.
--
-- Name: user_metadata.display_name (oder name), sonst die Mailadresse.
-- Rollen: app_metadata.roles (nur per Service Role setzbar). user_metadata.roles zählt nur bei
-- einer Einladung (invited_at gesetzt, kann kein Client setzen). Sonst könnte sich jemand bei
-- offener Registrierung per signUp({ data: { roles: ['admin'] } }) selbst zum Admin machen.
-- Unbekannte Rollenwerte werden verworfen, ohne Angabe bleibt die Rollenliste leer.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_roles public.app_role[] := '{}';
  v_source jsonb;
  v_role text;
begin
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.email), ''),
    'Unbekannt'
  );

  for v_source in
    select new.raw_app_meta_data -> 'roles'
    union all
    select new.raw_user_meta_data -> 'roles' where new.invited_at is not null
  loop
    if jsonb_typeof(v_source) = 'array' then
      for v_role in select jsonb_array_elements_text(v_source) loop
        if v_role in ('admin', 'planung', 'kueche', 'einkauf')
           and not (v_role::public.app_role = any (v_roles)) then
          v_roles := v_roles || v_role::public.app_role;
        end if;
      end loop;
    end if;
  end loop;

  insert into public.profiles (id, display_name, roles)
  values (new.id, v_name, v_roles)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bereits vorhandene Auth Nutzer (z. B. vor dieser Migration angelegt) bekommen ein leeres Profil.
insert into public.profiles (id, display_name)
select u.id, coalesce(nullif(btrim(u.email), ''), 'Unbekannt')
from auth.users u
on conflict (id) do nothing;
