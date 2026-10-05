-- Paket 02, Migration 1: Enums, Tabellen, Indizes, Trigger für updated_at und updated_by.
-- Rechte (RLS und grant) stehen in der nächsten Migration.

create extension if not exists citext with schema extensions;

-- Neue Tabellen sind für die Anon Rolle nie automatisch freigegeben.
alter default privileges in schema public revoke all on tables from anon;

create type public.app_role as enum ('admin', 'planung', 'kueche', 'einkauf');
create type public.course as enum ('vorspeise', 'hauptgang', 'nachtisch');

-- Die 14 Allergen Schlüssel müssen mit ALLERGENS in lib/allergens.ts übereinstimmen
-- (lib/db-allergens.test.ts prüft das).
create function public.allergens_valid(keys text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    keys <@ array[
      'gluten', 'krebstiere', 'eier', 'fisch', 'erdnuesse', 'soja', 'milch',
      'schalenfruechte', 'sellerie', 'senf', 'sesam', 'sulfite', 'lupinen', 'weichtiere'
    ]::text[],
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  roles public.app_role[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  default_children int not null default 20 check (default_children >= 0),
  default_adults int not null default 5 check (default_adults >= 0),
  adult_factor numeric not null default 1.5 check (adult_factor > 0),
  rotation_start date check (rotation_start is null or extract(isodow from rotation_start) = 1),
  public_enabled boolean not null default false,
  public_token text unique,
  public_show_author boolean not null default false,
  public_default_children int not null default 2 check (public_default_children >= 0),
  public_default_adults int not null default 2 check (public_default_adults >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact text,
  notes text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.product_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_supplier_id uuid references public.suppliers (id),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name extensions.citext not null unique,
  aliases text[] not null default '{}',
  product_group_id uuid references public.product_groups (id),
  default_unit text,
  supplier_id uuid references public.suppliers (id),
  allergens text[] not null default '{}' check (public.allergens_valid(allergens)),
  allergens_checked boolean not null default false,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course public.course not null,
  category text,
  base_children int not null default 20 check (base_children >= 0),
  base_adults int not null default 5 check (base_adults >= 0),
  description text,
  author text,
  steps text,
  notes text,
  legacy_allergens text[],
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id),
  amount numeric check (amount is null or amount >= 0),
  unit text,
  note text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_days (
  date date primary key,
  closed boolean not null default false,
  closed_reason text,
  note_internal text,
  note_public text,
  children int check (children is null or children >= 0),
  adults int check (adults is null or adults >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.plan_meals (
  date date not null,
  course public.course not null,
  recipe_id uuid not null references public.recipes (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (date, course)
);

create table public.week_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.week_template_meals (
  template_id uuid not null references public.week_templates (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 5),
  course public.course not null,
  recipe_id uuid not null references public.recipes (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (template_id, weekday, course)
);

create table public.rotation_entries (
  position int primary key,
  template_id uuid not null references public.week_templates (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  days int not null check (days > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (start_date, days)
);

create table public.shopping_checks (
  list_id uuid not null references public.shopping_lists (id) on delete cascade,
  item_key text not null,
  checked boolean not null,
  amount_at_check numeric,
  checked_by uuid references auth.users (id) on delete set null,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (list_id, item_key)
);

create table public.shopping_extras (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kitchen_feedback (
  date date not null,
  course public.course not null,
  amount_rating text check (amount_rating in ('zu_wenig', 'passt', 'zu_viel')),
  liked text check (liked in ('ja', 'geht_so', 'nein')),
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (date, course)
);

-- ---------------------------------------------------------------------------
-- Indizes auf Fremdschlüsseln und häufigen Suchen
-- ---------------------------------------------------------------------------

create index product_groups_default_supplier_id_idx on public.product_groups (default_supplier_id);
create index ingredients_product_group_id_idx on public.ingredients (product_group_id);
create index ingredients_supplier_id_idx on public.ingredients (supplier_id);
create index recipes_course_idx on public.recipes (course) where not archived;
create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id, sort);
create index recipe_ingredients_ingredient_id_idx on public.recipe_ingredients (ingredient_id);
create index plan_meals_recipe_id_idx on public.plan_meals (recipe_id);
create index week_template_meals_recipe_id_idx on public.week_template_meals (recipe_id);
create index rotation_entries_template_id_idx on public.rotation_entries (template_id);
create index shopping_extras_list_id_idx on public.shopping_extras (list_id);

-- ---------------------------------------------------------------------------
-- Trigger: updated_at für alle Tabellen, updated_by wo die Spalte existiert
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Ohne angemeldeten Nutzer (z. B. Service Role) bleibt der bisherige Wert stehen.
create function public.set_updated_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'suppliers', 'product_groups', 'ingredients', 'recipes',
    'recipe_ingredients', 'plan_days', 'plan_meals', 'week_templates', 'week_template_meals',
    'rotation_entries', 'shopping_lists', 'shopping_checks', 'shopping_extras', 'kitchen_feedback'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;

  foreach t in array array[
    'settings', 'suppliers', 'ingredients', 'recipes', 'plan_days', 'plan_meals', 'week_templates'
  ] loop
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.set_updated_by()',
      t || '_set_updated_by', t
    );
  end loop;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.set_updated_by() from public, anon, authenticated;
