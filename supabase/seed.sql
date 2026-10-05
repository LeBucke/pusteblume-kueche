-- Startdaten, idempotent: mehrfaches Ausführen ändert nichts an bereits vorhandenen Zeilen.
-- Lieferanten und Warengruppen werden mit dem Einkaufsteam abgestimmt und danach im Admin gepflegt.

insert into public.settings (id) values (1)
on conflict (id) do nothing;

insert into public.suppliers (name, sort) values
  ('Bio-Bauer', 1),
  ('Großhandel', 2)
on conflict (name) do nothing;

insert into public.product_groups (name, default_supplier_id, sort)
select g.name, s.id, g.sort
from (values
  ('Gemüse', 'Bio-Bauer', 1),
  ('Obst', 'Bio-Bauer', 2),
  ('Milchprodukte', 'Bio-Bauer', 3),
  ('Getreide und Teigwaren', 'Großhandel', 4),
  ('Grundnahrungsmittel', 'Großhandel', 5),
  ('Gewürze', 'Großhandel', 6),
  ('Tiefkühl', 'Großhandel', 7),
  ('Konserven', 'Großhandel', 8)
) as g(name, supplier, sort)
join public.suppliers s on s.name = g.supplier
on conflict (name) do nothing;
