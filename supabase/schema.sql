-- ============================================================
-- TAVARÉ — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run
-- ============================================================

-- ---------- products table ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('jewellery', 'art')),
  name text not null,
  lot_number text default '',
  era text default '',
  material text default '',
  description text default '',
  price_note text default 'Price on request',
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  image text,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at current automatically
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------- row level security ----------
alter table products enable row level security;

-- anyone (including signed-out visitors) can read products
drop policy if exists "Public can read products" on products;
create policy "Public can read products"
  on products for select
  using (true);

-- only signed-in users (i.e. you, via the admin panel) can write
drop policy if exists "Authenticated can insert products" on products;
create policy "Authenticated can insert products"
  on products for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update products" on products;
create policy "Authenticated can update products"
  on products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete products" on products;
create policy "Authenticated can delete products"
  on products for delete
  to authenticated
  using (true);

-- ---------- storage bucket for product photos ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated can upload product images" on storage.objects;
create policy "Authenticated can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Authenticated can update product images" on storage.objects;
create policy "Authenticated can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Authenticated can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- ---------- seed data (Series I starting pieces) ----------
insert into products (category, name, lot_number, era, material, description, price_note, status, sort_order)
values
  ('jewellery', 'The Vesper Ring', '014', 'Art Deco · 1930s', '925 Silver & Moonstone', 'Hand-set moonstone in a geometric Deco band, restored in-house.', 'Price on request', 'available', 0),
  ('jewellery', 'Solstice Drops', '027', 'Modernist · 1960s', '925 Sterling Silver', 'Sculptural sterling drop earrings, hallmarked London 1963.', 'Price on request', 'available', 1),
  ('jewellery', 'The Widow''s Chain', '003', 'Victorian Revival', '925 Silver, Convertible', 'Converts from choker to bracelet via a hidden Victorian clasp.', 'Price on request', 'reserved', 2),
  ('jewellery', 'Ember Brooch', '041', 'Hand-Engraved · 1940s', '925 Sterling Silver', 'Wartime-era brooch, hand-engraved with a floral field pattern.', 'Price on request', 'available', 3),
  ('jewellery', 'The Meridian Cuff', '019', 'Modernist · 1970s', '925 Sterling Silver', 'An open cuff, hand-hammered to a soft, uneven modernist curve.', 'Price on request', 'available', 4),
  ('jewellery', 'Whitfield Pocket Chain', '008', 'Fob Chain · 1950s', '925 Sterling Silver', 'A watch chain, re-clasped as a necklace. Sold, kept in the archive.', 'Sold — Archived', 'sold', 5),
  ('art', 'Harbour, Untitled', 'A-01', 'c.1958', 'Oil on board · Unsigned', 'Small-batch coastal study, acquired from a private estate sale.', 'Price on request', 'available', 0),
  ('art', 'Vessel No. II', 'A-02', 'c.1971', 'Glazed stoneware · Studio unknown', 'A quiet, asymmetric form with an unusually deep glaze pool.', 'Price on request', 'available', 1),
  ('art', 'Study of a Head', 'A-03', 'c.1946', 'Cast bronze · Attributed', 'Attributed to a regional sculptor active in the late 1940s.', 'Price on request', 'available', 2),
  ('art', 'Etched Mirror', 'A-04', 'c.1910', 'Mercury glass, hand-etched', 'Hand-etched foliate pattern, original frame with light foxing.', 'Price on request', 'available', 3)
on conflict do nothing;
