-- Minimal stand-ins for the Supabase-managed schemas, so the real
-- supabase/schema.sql can be parsed and run on a local PostgreSQL.
-- Only used by scripts/check-schema.ps1 in a throwaway database.

create schema if not exists auth;
create schema if not exists storage;

-- Policies name these roles, and PostgreSQL requires a role to exist before a
-- policy can grant access to it. They are cluster-wide and no-login, and the
-- check keeps this file re-runnable.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

-- Supabase keeps users in auth.users.
create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- Supabase exposes the signed-in account's id as auth.uid().
create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

-- The Storage service tables the policies refer to.
create table storage.buckets (
  id     text primary key,
  name   text,
  public boolean default false
);

create table storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text,
  name      text
);

-- Supabase has RLS enabled on this table out of the box, and the policies in
-- schema.sql only work because of it. It has to be mirrored here or the local
-- run would test a configuration that does not exist on a real project.
alter table storage.objects enable row level security;

-- Supabase's helper that splits an object path into its folders.
create function storage.foldername(path text) returns text[]
  language sql immutable
  as $$ select string_to_array(path, '/') $$;