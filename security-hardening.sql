-- ============================================================
-- TAVARE — Security hardening migration
-- Run once in Supabase SQL Editor
-- ============================================================

-- 1. Close the direct-insert loophole. All reservations must go
--    through reserve_set(), which validates and rate-limits.
drop policy if exists "public can insert reservations" on reservations;

-- 2. Replace reserve_set with a validated, honeypot-protected,
--    duplicate-blocking version.
create or replace function reserve_set(
  p_name text,
  p_email text,
  p_finish text,
  p_honeypot text default ''
)
returns int
language plpgsql
security definer
as $$
declare
  v_edition int;
  v_email text := lower(trim(p_email));
  v_name text := trim(p_name);
begin
  -- Honeypot: a hidden field real visitors never fill in.
  -- If it's non-empty, a bot filled the form. Fail silently —
  -- don't tell the bot why, just don't insert anything.
  if p_honeypot is not null and length(p_honeypot) > 0 then
    return -1;
  end if;

  if v_name is null or length(v_name) < 1 or length(v_name) > 100 then
    raise exception 'Please enter a valid name.';
  end if;

  if v_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 255 then
    raise exception 'Please enter a valid email.';
  end if;

  if p_finish is not null and p_finish not in ('Polished', 'Brushed', 'No preference') then
    raise exception 'Invalid finish option.';
  end if;

  -- One reservation per email — closes the easiest spam/abuse path.
  if exists (select 1 from reservations where email = v_email) then
    raise exception 'This email has already reserved a set.';
  end if;

  insert into reservations (name, email, finish)
  values (v_name, v_email, p_finish)
  returning edition_number into v_edition;

  return v_edition;
end;
$$;

grant execute on function reserve_set(text, text, text, text) to anon, authenticated;

-- 3. Public reservation count — unchanged, still privacy-safe.
create or replace function get_reservation_count()
returns int
language sql
security definer
stable
as $$
  select count(*)::int from reservations;
$$;

grant execute on function get_reservation_count() to anon, authenticated;

-- 4. Monthly drops — the suspense mechanic.
create table if not exists drops (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references designs(id) on delete set null,
  teaser_title text not null,
  teaser_copy text,
  reveal_at timestamptz not null,
  created_at timestamptz default now()
);

alter table drops enable row level security;

drop policy if exists "public can view drops" on drops;
create policy "public can view drops" on drops for select using (true);

drop policy if exists "admin can manage drops" on drops;
create policy "admin can manage drops" on drops for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed one example drop 14 days out so you can see the countdown work.
insert into drops (teaser_title, teaser_copy, reveal_at)
values ('Series II — Teaser', 'Something new is coming. Silver again, but not the same shape.', now() + interval '14 days')
on conflict do nothing;
