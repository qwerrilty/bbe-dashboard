-- ============================================
-- BBE Dashboard — Supabase SQL Schema
-- Paste this entire file into the Supabase
-- SQL Editor and click Run
-- ============================================

-- BOOKINGS (one row per event)
create table if not exists bookings (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),

  -- Event details
  client_name         text,
  event_type          text,
  venue               text,
  venue_address       text,
  event_date          date,
  pax                 int,
  status              text default 'planning',
  stage               int default 1,
  missing_count       int default 0,

  -- Act booked
  act_booked          text,
  booked_by           text,
  booking_platform    text,
  locked_date         date,

  -- Client contact
  client_contact_name text,
  client_email        text,
  client_phone        text,
  about_client        text,
  on_day_contact      text default 'Renee · 0403 769 229',

  -- Event brief
  dress_code          text,
  demographic         text,
  guest_arrival_time  time,
  bump_in_time        time,
  soundcheck_time     time,
  event_brief         text,

  -- Song requests
  song_requests       text,
  spotify_link        text,
  do_not_play         text,

  -- Green room & logistics
  greenroom_location  text,
  greenroom_access    time,
  greenroom_notes     text,
  crew_meals          text,
  dj_table_power      text,

  -- Travel
  travel_notes        text,
  accommodation       text,
  checkin_time        time
);

-- PERFORMERS (many per booking)
create table if not exists performers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  booking_id  uuid references bookings(id) on delete cascade,
  name        text,
  type        text,
  time_slot   text,
  fee         numeric,
  status      text default 'nr',   -- yes | no | nr
  notes       text
);

-- RUN SHEET ITEMS (many per booking)
create table if not exists runsheet_items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  booking_id  uuid references bookings(id) on delete cascade,
  time        text,
  item        text,
  duration    text
);

-- CHECKLIST ITEMS (missing info tracker, many per booking)
create table if not exists checklist_items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  booking_id  uuid references bookings(id) on delete cascade,
  label       text,
  completed   boolean default false,
  owner       text
);

-- EMAIL THREADS (synced from Gmail)
create table if not exists email_threads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  gmail_id    text unique,
  from_name   text,
  from_email  text,
  subject     text,
  preview     text,
  body        text,
  received_at timestamptz,
  unread      boolean default true,
  booking_id  uuid references bookings(id) on delete set null
);

-- ============================================
-- ROW LEVEL SECURITY
-- Only authenticated users can access data
-- ============================================

alter table bookings       enable row level security;
alter table performers     enable row level security;
alter table runsheet_items enable row level security;
alter table checklist_items enable row level security;
alter table email_threads  enable row level security;

-- Allow all authenticated users full access (team dashboard)
create policy "team_access_bookings"        on bookings        for all using (auth.role() = 'authenticated');
create policy "team_access_performers"      on performers      for all using (auth.role() = 'authenticated');
create policy "team_access_runsheet"        on runsheet_items  for all using (auth.role() = 'authenticated');
create policy "team_access_checklist"       on checklist_items for all using (auth.role() = 'authenticated');
create policy "team_access_email_threads"   on email_threads   for all using (auth.role() = 'authenticated');

-- ============================================
-- REALTIME
-- Enable live updates across team browsers
-- ============================================

alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table performers;
alter publication supabase_realtime add table checklist_items;
