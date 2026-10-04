-- =====================================================================
-- CONNECT â€” database schema for Supabase
-- =====================================================================
-- Run this once in the Supabase dashboard:
--   Dashboard -> your project -> SQL Editor -> New query -> paste -> Run
--
-- It is safe to run more than once (every statement is idempotent).
--
-- Security model
-- --------------
-- Every private table has Row Level Security enabled. Each row belongs to
-- exactly one account, stored in owner_id. Policies compare owner_id with
-- auth.uid(), which Supabase sets from the signed-in user's token. A user can
-- therefore never read or change another user's rows, even by guessing ids.
--
-- Tables that hold no owner_id (chat_messages, report_tests, ...) inherit
-- ownership through their parent row and check that instead.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. PROFILES  (one row per account, created automatically on sign-up)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text        not null default '',
  email           text        not null default '',
  phone           text        not null default '',
  date_of_birth   date,
  gender          text        not null default '',
  blood_type      text        not null default '',
  address         text        not null default '',
  avatar_url      text,
  -- The signed-in person's own summary, shown on the Emergency screen.
  allergies       text[]      not null default '{}',
  conditions      text[]      not null default '{}',
  medications     text[]      not null default '{}',
  emergency_notes text[]      not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'Public part of a user account. Never stores a password.';


-- ---------------------------------------------------------------------
-- 2. FAMILY MEMBERS
-- ---------------------------------------------------------------------
create table if not exists public.family_members (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  full_name     text        not null,
  relationship  text        not null default 'Other',
  date_of_birth date,
  gender        text        not null default '',
  blood_type    text        not null default '',
  -- Card colour chosen in the UI, so a member always looks the same.
  accent        text        not null default 'blue',
  conditions    text[]      not null default '{}',
  allergies     text[]      not null default '{}',
  medications   text[]      not null default '{}',
  notes         text        not null default '',
  last_checkup  date,
  -- Latest vitals snapshot. A vitals_history table can be added later
  -- without changing anything that exists today.
  heart_rate        integer,
  blood_pressure    text,
  glucose           numeric,
  weight            numeric,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists family_members_owner_idx on public.family_members(owner_id);


-- ---------------------------------------------------------------------
-- 3. APPOINTMENTS
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  -- null means the appointment is for the account holder themselves.
  member_id        uuid references public.family_members(id) on delete set null,
  doctor           text        not null,
  specialty        text        not null default '',
  appointment_date date        not null,
  appointment_time time        not null default '09:00',
  location         text        not null default '',
  mode             text        not null default 'In person',
  status           text        not null default 'upcoming'
                     check (status in ('upcoming', 'completed', 'cancelled')),
  reason           text        not null default '',
  notes            text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists appointments_owner_date_idx
  on public.appointments(owner_id, appointment_date);


-- ---------------------------------------------------------------------
-- 4. MEDICATIONS
-- ---------------------------------------------------------------------
create table if not exists public.medications (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  member_id   uuid references public.family_members(id) on delete set null,
  name        text        not null,
  dosage      text        not null default '',
  frequency   text        not null default '',
  times       text[]      not null default '{}',
  next_dose   text        not null default '',
  prescriber  text        not null default '',
  purpose     text        not null default '',
  refill_date date,
  -- Reset each morning by the app so "taken today" survives a reload.
  taken_date  date,
  taken_today boolean     not null default false,
  food        text        not null default 'Any time',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists medications_owner_idx on public.medications(owner_id);


-- ---------------------------------------------------------------------
-- 5. HEALTH RECORDS
-- ---------------------------------------------------------------------
create table if not exists public.health_records (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  member_id   uuid references public.family_members(id) on delete set null,
  title       text        not null,
  category    text        not null default 'Medical Reports',
  record_date date        not null default current_date,
  provider    text        not null default '',
  status      text        not null default 'Active',
  summary     text        not null default '',
  details     text[]      not null default '{}',
  file_path   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists health_records_owner_idx
  on public.health_records(owner_id, record_date desc);


-- ---------------------------------------------------------------------
-- 6. SYMPTOM JOURNAL
-- ---------------------------------------------------------------------
create table if not exists public.symptom_entries (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  member_id  uuid references public.family_members(id) on delete set null,
  entry_date date        not null default current_date,
  symptom    text        not null,
  severity   text        not null default 'Mild',
  duration   text        not null default '',
  notes      text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists symptom_entries_owner_idx
  on public.symptom_entries(owner_id, entry_date desc);


-- ---------------------------------------------------------------------
-- 7. DOCTOR PREP
-- ---------------------------------------------------------------------
create table if not exists public.doctor_questions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  text           text        not null,
  category       text        not null default 'General',
  done           boolean     not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists doctor_questions_owner_idx on public.doctor_questions(owner_id);

-- One notes blob per account, matching the single notes box in the UI.
create table if not exists public.doctor_prep_notes (
  owner_id   uuid primary key references auth.users(id) on delete cascade,
  content    text        not null default '',
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 8. EMERGENCY CONTACTS
-- ---------------------------------------------------------------------
create table if not exists public.emergency_contacts (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name       text        not null,
  relation   text        not null default '',
  phone      text        not null,
  created_at timestamptz not null default now()
);

create index if not exists emergency_contacts_owner_idx on public.emergency_contacts(owner_id);


-- ---------------------------------------------------------------------
-- 9. HEALTH METRICS  (dashboard trend cards)
-- ---------------------------------------------------------------------
create table if not exists public.health_metrics (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  member_id   uuid references public.family_members(id) on delete set null,
  label       text        not null,
  value       text        not null default '',
  unit        text        not null default '',
  change      text        not null default '',
  trend       text        not null default 'stable',
  good        boolean     not null default true,
  icon        text        not null default 'activity',
  series      jsonb       not null default '[]'::jsonb,
  recorded_on date        not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists health_metrics_owner_idx on public.health_metrics(owner_id);


-- ---------------------------------------------------------------------
-- 10. NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  title      text        not null,
  body       text        not null default '',
  type       text        not null default 'system',
  link       text,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_owner_idx
  on public.notifications(owner_id, created_at desc);


-- ---------------------------------------------------------------------
-- 11. ORAYAN REPORTS
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  member_id    uuid references public.family_members(id) on delete set null,
  filename     text        not null,
  -- Path inside the private 'reports' storage bucket, never a public URL.
  file_path    text,
  source       text        not null default 'upload',
  raw_text     text        not null default '',
  summary_json jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists reports_owner_idx on public.reports(owner_id, created_at desc);

create table if not exists public.report_tests (
  report_id       uuid    not null references public.reports(id) on delete cascade,
  position        integer not null,
  name            text    not null,
  raw             text    not null default '',
  value           double precision,
  value_text      text    not null default '',
  unit            text    not null default '',
  range_text      text    not null default '',
  reference_json  jsonb,
  comparator_json jsonb,
  status          text    not null default 'unknown',
  primary key (report_id, position)
);

-- Generated text is cached here so Gemini's free daily quota is not spent
-- re-explaining a test the user already looked at.
create table if not exists public.report_summaries (
  report_id uuid not null references public.reports(id) on delete cascade,
  language  text not null,
  text      text not null,
  primary key (report_id, language)
);

create table if not exists public.report_explanations (
  report_id uuid not null references public.reports(id) on delete cascade,
  test_name text not null,
  language  text not null,
  text      text not null,
  primary key (report_id, test_name, language)
);

-- Plain-language definitions of medical words. These are shared reference
-- text, not personal data, so any signed-in user may read them.
create table if not exists public.term_explanations (
  term     text not null,
  language text not null,
  text     text not null,
  primary key (term, language)
);


-- ---------------------------------------------------------------------
-- 12. BAYMAX CHAT
-- ---------------------------------------------------------------------
create table if not exists public.chat_conversations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  title      text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_owner_idx
  on public.chat_conversations(owner_id, updated_at desc);

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.chat_conversations(id) on delete cascade,
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  created_at      timestamptz not null default now()
);

create index if not exists chat_messages_conversation_idx
  on public.chat_messages(conversation_id, created_at);


-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
-- Enabling RLS alone blocks everything for the anon/authenticated roles
-- unless a policy allows it. That is intentional: no policy, no access.

alter table public.profiles            enable row level security;
alter table public.family_members      enable row level security;
alter table public.appointments        enable row level security;
alter table public.medications         enable row level security;
alter table public.health_records      enable row level security;
alter table public.symptom_entries     enable row level security;
alter table public.doctor_questions    enable row level security;
alter table public.doctor_prep_notes   enable row level security;
alter table public.emergency_contacts  enable row level security;
alter table public.health_metrics      enable row level security;
alter table public.notifications       enable row level security;
alter table public.reports             enable row level security;
alter table public.report_tests        enable row level security;
alter table public.report_summaries    enable row level security;
alter table public.report_explanations enable row level security;
alter table public.term_explanations   enable row level security;
alter table public.chat_conversations  enable row level security;
alter table public.chat_messages       enable row level security;


-- ---------------------------------------------------------------------
-- WHY owner_id DEFAULTS TO auth.uid()
-- ---------------------------------------------------------------------
-- Every private table carries `owner_id uuid not null default auth.uid()`.
--
-- The default is what makes the app work: the browser never sends owner_id,
-- because the signed-in account is not something the client should get to
-- choose. Letting the database fill it in from the request's own JWT means a
-- row can only ever be created under the account that is making the request.
--
-- It is not a hole. A client can still send an explicit owner_id, and the
-- policies below reject that with `with check (owner_id = auth.uid())`. The
-- default only decides the value when the client says nothing.
--
-- ---------------------------------------------------------------------


-- Profiles: a row is reachable only by the account it belongs to.
drop policy if exists "profiles are private" on public.profiles;
create policy "profiles are private" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- Simple owner_id tables. Nothing here points at another person's record.
drop policy if exists "family_members are private" on public.family_members;
create policy "family_members are private" on public.family_members
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "notifications are private" on public.notifications;
create policy "notifications are private" on public.notifications
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());


-- Doctor prep notes are keyed directly by account id, so there is nothing to
-- cross-check beyond the key itself.
drop policy if exists "doctor_prep_notes are private" on public.doctor_prep_notes;
create policy "doctor_prep_notes are private" on public.doctor_prep_notes
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());


-- Reports deliberately have no policy in this block. Reports carry a member_id,
-- so their policy is generated further down with the other member_id tables.
-- A second, looser policy here would be OR-ed with that one by PostgreSQL and
-- quietly undo the member check.


-- Emergency contacts are private to the account that saved them.
drop policy if exists "emergency_contacts are private" on public.emergency_contacts;
create policy "emergency_contacts are private" on public.emergency_contacts
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());


-- Chat: conversations belong to an account, messages inherit that.
drop policy if exists "chat_conversations are private" on public.chat_conversations;
create policy "chat_conversations are private" on public.chat_conversations
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Report child tables: access follows the parent report.
drop policy if exists "report_tests follow the report" on public.report_tests;
create policy "report_tests follow the report" on public.report_tests
  for all to authenticated
  using (exists (select 1 from public.reports r
                 where r.id = report_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.reports r
                      where r.id = report_id and r.owner_id = auth.uid()));

drop policy if exists "report_summaries follow the report" on public.report_summaries;
create policy "report_summaries follow the report" on public.report_summaries
  for all to authenticated
  using (exists (select 1 from public.reports r
                 where r.id = report_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.reports r
                      where r.id = report_id and r.owner_id = auth.uid()));

drop policy if exists "report_explanations follow the report" on public.report_explanations;
create policy "report_explanations follow the report" on public.report_explanations
  for all to authenticated
  using (exists (select 1 from public.reports r
                 where r.id = report_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.reports r
                      where r.id = report_id and r.owner_id = auth.uid()));


-- ---------------------------------------------------------------------
-- Tables that point at another row
-- ---------------------------------------------------------------------
-- Six tables carry a member_id (a family member) and doctor_questions carries
-- an appointment_id. If the policy only checked owner_id, a signed-in person
-- could store their own row with a member_id belonging to somebody else: their
-- own record would then sit inside another person's family. Nothing would be
-- readable today, but it leaves a cross-account pointer in the database for a
-- future join to leak through, and the resulting foreign key error confirms
-- that a given id exists.
--
-- So an insert or update must also prove the row it points at is owned by the
-- same account.


-- The member_id tables all follow one rule. Written in a loop so the six
-- policies cannot drift apart; the generated text is listed in the audit notes.
do $$
declare
  target text;
begin
  foreach target in array array[
    'appointments', 'medications', 'health_records',
    'symptom_entries', 'health_metrics', 'reports'
  ] loop
    execute format('drop policy if exists "%1$I keep their family" on public.%1$I', target);
    execute format(
      'create policy "%1$I keep their family" on public.%1$I
         for all to authenticated
         using (owner_id = auth.uid())
         with check (
           owner_id = auth.uid()
           and (
             member_id is null
             or exists (select 1 from public.family_members m
                        where m.id = member_id and m.owner_id = auth.uid())
           )
         )', target);
  end loop;
end $$;

-- Doctor questions hang off an appointment, which must be the same person's.
drop policy if exists "doctor_questions keep their appointments" on public.doctor_questions;
create policy "doctor_questions keep their appointments" on public.doctor_questions
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (
      appointment_id is null
      or exists (select 1 from public.appointments a
                 where a.id = appointment_id and a.owner_id = auth.uid())
    )
  );


-- Chat messages inherit access from the conversation they belong to.
drop policy if exists "chat_messages follow the conversation" on public.chat_messages;
create policy "chat_messages follow the conversation" on public.chat_messages
  for all to authenticated
  using (exists (select 1 from public.chat_conversations c
                 where c.id = conversation_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.chat_conversations c
                      where c.id = conversation_id and c.owner_id = auth.uid()));


-- Term definitions are shared reference text, not personal data, so any
-- signed-in user can read them and nobody may rewrite somebody else's row.
-- The service caches these in memory, so this table stays empty in practice.
drop policy if exists "signed-in users read terms" on public.term_explanations;
create policy "signed-in users read terms" on public.term_explanations
  for select to authenticated
  using (true);

drop policy if exists "signed-in users cache terms" on public.term_explanations;
create policy "signed-in users cache terms" on public.term_explanations
  for insert to authenticated
  with check (true);

drop policy if exists "signed-in users update terms" on public.term_explanations;
drop policy if exists "signed-in users delete terms" on public.term_explanations;

-- Note: there is no update or delete policy on purpose, so those operations are
-- denied to everyone. A shared cache entry cannot be edited by another account.


-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Create a profile row the moment someone signs up, so the app always has
-- a name to show and does not have to handle a missing profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
-- Empty search path plus fully qualified names, so nothing on the path can be
-- swapped for a look-alike function by whoever controls the database role.
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Keep updated_at honest without every client having to remember it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array[
    'profiles', 'family_members', 'appointments', 'medications',
    'health_records', 'symptom_entries', 'doctor_prep_notes'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', target);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.touch_updated_at()', target);
  end loop;
end $$;


-- =====================================================================
-- PRIVATE STORAGE FOR UPLOADED REPORTS
-- =====================================================================
-- The bucket is private: there is no public URL for a medical report.
-- Files are stored under "<user id>/<filename>", and the policies below
-- only ever let the owner of that first folder segment reach it.

-- The whole Storage section is guarded. On newer projects Supabase owns
-- storage.objects as supabase_storage_admin rather than as the role the SQL
-- editor runs as, so touching it can fail with "must be owner of table objects"
-- or "must be owner of table buckets". An unguarded failure there rolls back the
-- tables, policies and triggers that came before it, which is a much worse
-- outcome than a warning.
--
-- So the access is probed first. If it is there the policies are created; if it
-- is not, the migration still finishes and says exactly what is missing.
do $$
declare
  objects_owner text;
  buckets_owner text;
  can_manage_objects boolean := false;
  can_manage_buckets boolean := false;
begin
  select pg_get_userbyid(c.relowner) into objects_owner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage' and c.relname = 'objects';

  select pg_get_userbyid(c.relowner) into buckets_owner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage' and c.relname = 'buckets';

  -- pg_has_role with USAGE covers both owning the table outright and being a
  -- member of the role that owns it.
  if objects_owner is not null then
    can_manage_objects := pg_has_role(current_user, objects_owner, 'USAGE');
  end if;
  if buckets_owner is not null then
    can_manage_buckets := pg_has_role(current_user, buckets_owner, 'USAGE');
  end if;

  -- Row Level Security has to be on for any of this to matter. Supabase enables
  -- it by default; it is only read here, never changed.
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and c.relrowsecurity
  ) then
    raise warning
      'Row Level Security is OFF on storage.objects, so no file policy will apply. Turn it on from Storage settings before trusting file privacy.';
  end if;

  if not can_manage_buckets then
    raise warning
      'This role cannot write storage.buckets (owner is %), so the private "reports" bucket was NOT created. Create it by hand: Storage > New bucket, name "reports", Public OFF.',
      buckets_owner;
  else
    execute $b$insert into storage.buckets (id, name, public)
           values ('reports', 'reports', false)
           on conflict (id) do update set public = false$b$;
  end if;

  if not can_manage_objects then
    raise warning
      'This role cannot manage storage.objects (owner is %), so the four file policies were NOT created. supabase/storage-policies.sql has them ready to paste into Storage > Policies > reports.',
      objects_owner;
    return;
  end if;

  execute 'drop policy if exists "users read their own reports" on storage.objects';
  execute $p$create policy "users read their own reports" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = auth.uid()::text
    )$p$;

  execute 'drop policy if exists "users upload their own reports" on storage.objects';
  execute $p$create policy "users upload their own reports" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = auth.uid()::text
    )$p$;

  -- Updating a file also needs the row to stay inside the caller's own folder.
  -- Both USING and WITH CHECK are written out: WITH CHECK is what stops an update
  -- from renaming an object into somebody else's directory.
  execute 'drop policy if exists "users update their own reports" on storage.objects';
  execute $p$create policy "users update their own reports" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = auth.uid()::text
    )$p$;

  execute 'drop policy if exists "users remove their own reports" on storage.objects';
  execute $p$create policy "users remove their own reports" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = auth.uid()::text
    )$p$;
end $$;


-- =====================================================================
-- WHY FORCE ROW LEVEL SECURITY IS NOT USED HERE
-- =====================================================================
-- FORCE makes the table owner subject to the policies too. These tables are
-- owned by the same role that runs handle_new_user(), which is SECURITY
-- DEFINER, so signing somebody up would fail: the trigger could not insert the
-- profile row it is there to create.
--
-- It is also unnecessary. Row Level Security is enforced for anon and
-- authenticated, which is every role the browser can obtain from the anon key.
-- Nothing in this project connects to Postgres as the owner except the
-- migrations you run yourself.
