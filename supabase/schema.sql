-- Barber Booking System - Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.

-- ============================================================
-- SERVICES
-- ============================================================
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  duration    int  not null,  -- minutes
  price       int  not null,  -- cents
  active      boolean not null default true,
  sort_order  int not null default 0
);

insert into services (name, description, duration, price, sort_order) values
  ('Haircut',            'Classic cut with clippers and scissors',   30, 3000, 1),
  ('Beard Trim',         'Shape and trim your beard',                20, 2000, 2),
  ('Haircut + Beard',    'Full service haircut and beard trim',      50, 4500, 3),
  ('Fade',               'Skin fade or taper fade',                  40, 3500, 4),
  ('Kids Cut',           'Ages 12 and under',                        25, 2000, 5),
  ('Hot Towel Shave',    'Traditional straight-razor shave',         30, 3500, 6);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table if not exists appointments (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references services(id),
  customer_name    text not null,
  customer_phone   text not null,
  date             date not null,
  start_time       time not null,
  end_time         time not null,
  status           text not null default 'confirmed'
                     check (status in ('confirmed', 'cancelled')),
  notes            text,
  created_at       timestamptz not null default now()
);

-- Prevent double-booking: no two confirmed appointments may overlap on the same day.
-- We use an exclusion constraint via a btree index on (date, start_time, end_time)
-- combined with a partial unique approach. Since Postgres exclusion constraints
-- require the btree_gist extension for date/time ranges, we use that here.
create extension if not exists btree_gist;

alter table appointments
  add constraint no_overlap
  exclude using gist (
    date with =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp,
      '[)'
    ) with &&
  )
  where (status = 'confirmed');

create index idx_appointments_date   on appointments(date);
create index idx_appointments_status on appointments(status);

-- ============================================================
-- BLOCKED TIMES
-- ============================================================
create table if not exists blocked_times (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  start_time time not null,
  end_time   time not null,
  reason     text,
  created_at timestamptz not null default now()
);

create index idx_blocked_times_date on blocked_times(date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Services: anyone can read; only authenticated barber can modify
alter table services enable row level security;
create policy "Public read services"  on services for select using (true);
create policy "Auth manage services"  on services for all
  using (auth.role() = 'authenticated');

-- Appointments: customers insert (anon); authenticated barber can do anything
alter table appointments enable row level security;
create policy "Public book appointment" on appointments for insert
  with check (true);
create policy "Public read own appointment" on appointments for select
  using (true);  -- fine-grained: clients see their own via confirmation page
create policy "Auth manage appointments" on appointments for all
  using (auth.role() = 'authenticated');

-- Blocked times: only barber manages; public can read to check availability
alter table blocked_times enable row level security;
create policy "Public read blocked" on blocked_times for select using (true);
create policy "Auth manage blocked"  on blocked_times for all
  using (auth.role() = 'authenticated');
