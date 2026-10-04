# Validates supabase/schema.sql against a throwaway local database.
#
# The schema references auth.users and storage.objects, which only exist on
# Supabase, so scripts/schema-stubs.sql provides stand-ins. Nothing here touches
# the real connect database or anything else on the machine: the scratch
# database is created, checked and dropped again.
#
# This proves the SQL parses, the policies are created, and the triggers compile,
# which is otherwise only discovered halfway through a Supabase migration.

# psql writes notices such as "database does not exist, skipping" to stderr, so
# success is judged from $LASTEXITCODE rather than from stderr being empty.
$ErrorActionPreference = 'Continue'

$psql = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'
if (-not (Test-Path $psql)) {
  Write-Output 'psql was not found, so the schema could not be checked.'
  exit 1
}

# These checks need a local PostgreSQL to build the throwaway database in. The
# app itself no longer uses one, so the connection string is not in ai/.env
# anymore: set DATABASE_URL in your shell, or leave a DATABASE_URL line in
# ai/.env for local development.
$url = $env:DATABASE_URL
if (-not $url) {
  $envFile = Join-Path $PSScriptRoot '..\ai\.env'
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if ($line) { $url = ($line -replace '^DATABASE_URL=', '').Trim() }
  }
}

if (-not $url) {
  Write-Output 'No local PostgreSQL connection was found.'
  Write-Output 'Set DATABASE_URL, for example:'
  Write-Output '  $env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/postgres"'
  exit 1
}
$parsed = [Uri]$url
$env:PGPASSWORD = $parsed.UserInfo.Split(':')[1]
$dbHost = $parsed.Host
$dbPort = $parsed.Port
$user = $parsed.UserInfo.Split(':')[0]
$scratch = 'connect_rls_check'

Write-Output "> checking schema.sql on ${dbHost}:${dbPort} (throwaway database: $scratch)"

& $psql -h $dbHost -p $dbPort -U $user -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists $scratch;" 2>&1 | Out-Null
& $psql -h $dbHost -p $dbPort -U $user -d postgres -v ON_ERROR_STOP=1 -q -c "create database $scratch;" 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Output 'Could not create the throwaway database.'
  exit 1
}

$problems = 0

# 1. The stubs.
& $psql -h $dbHost -p $dbPort -U $user -d $scratch -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot 'schema-stubs.sql') 2>&1 |
  ForEach-Object { $problems++; Write-Output "stubs: $_" }

# 2. The real schema. This is the point of the exercise.
$schemaOutput = & $psql -h $dbHost -p $dbPort -U $user -d $scratch -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot '..\supabase\schema.sql') 2>&1
if ($LASTEXITCODE -ne 0) {
  $problems++
  Write-Output 'SCHEMA FAILED:'
  $schemaOutput | ForEach-Object { Write-Output "  $_" }
}

# 3. Confirm what it created, so a schema that silently does nothing is caught.
if ($problems -eq 0) {
  $tables = & $psql -h $dbHost -p $dbPort -U $user -d $scratch -t -A -c "select count(*) from pg_tables where schemaname='public';"
  $policies = & $psql -h $dbHost -p $dbPort -U $user -d $scratch -t -A -c "select count(*) from pg_policies where schemaname in ('public','storage');"
  $unlocked = & $psql -h $dbHost -p $dbPort -U $user -d $scratch -t -A -c "select string_agg(tablename, ', ') from pg_tables where schemaname='public' and rowsecurity = false;"

  Write-Output "tables created: $tables"
  Write-Output "policies created: $policies"

  if ($unlocked) {
    $problems++
    Write-Output "PROBLEM: Row Level Security is OFF on: $unlocked"
  } else {
    Write-Output 'every public table has Row Level Security enabled'
  }

  # The six member_id tables must have the linked-family policy, not the old one.
  foreach ($t in 'appointments','medications','health_records','symptom_entries','health_metrics','reports') {
    $has = & $psql -h $dbHost -p $dbPort -U $user -d $scratch -t -A -c "select count(*) from pg_policies where tablename='$t' and policyname='$t keep their family';"
    if ($has -ne '1') {
      $problems++
      Write-Output "PROBLEM: $t is missing its linked-family policy"
    }
  }
  Write-Output 'linked-family policies present on all six member_id tables'

  # Every private table needs a policy, otherwise the app silently reads and
  # writes nothing. This exact gap is what left emergency_contacts unusable.
  $expected = @(
    'profiles are private', 'family_members are private', 'notifications are private',
    'emergency_contacts are private', 'doctor_prep_notes are private',
    'chat_conversations are private', 'report_tests follow the report',
    'report_summaries follow the report', 'report_explanations follow the report',
    'chat_messages follow the conversation',
    'appointments keep their family', 'medications keep their family',
    'health_records keep their family', 'symptom_entries keep their family',
    'health_metrics keep their family', 'reports keep their family',
    'doctor_questions keep their appointments',
    'users read their own reports', 'users upload their own reports',
    'users update their own reports', 'users remove their own reports'
  )
  foreach ($name in $expected) {
    $count = (@(& $psql -h $dbHost -p $dbPort -U $user -d $scratch -t -A -c "select count(*) from pg_policies where policyname = '$name';") -join '').Trim()
    if ($count -ne '1') {
      $problems++
      Write-Output "PROBLEM: expected policy is missing or duplicated: $name"
    }
  }
  Write-Output "all $($expected.Count) expected policies are present exactly once"

  # Reports must not also carry a looser owner-only policy. PostgreSQL ORs
  # permissive policies together, so a second one would undo the member check.
  $stray = (@(& $psql -h $dbHost -p $dbPort -U $user -d $scratch -t -A -c "select policyname from pg_policies where tablename = 'reports' and policyname <> 'reports keep their family';") -join '').Trim()
  if ($stray) {
    $problems++
    Write-Output "PROBLEM: reports has an extra policy that weakens the member check: $stray"
  } else {
    Write-Output 'reports has only the policy that checks the family link'
  }
}

# 5. The Storage guard.
#
# A real Supabase SQL editor cannot always touch storage.objects: newer projects
# own it as supabase_storage_admin, and the migration died with "must be owner of
# table objects" before the section was guarded. This replays that situation by
# running the whole file as an ordinary role that owns nothing in storage, and
# requires the run to finish rather than abort.
if ($problems -eq 0) {
    # A fresh database, because the public tables have to be created by the role
    # being tested for it to own them. That is the real situation on Supabase:
    # the SQL editor role owns public.* because it creates them, but not
    # storage.*.
    $guardDb = 'connect_rls_guard'
    & $psql -h $dbHost -p $dbPort -U $user -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists $guardDb;" 2>&1 | Out-Null
    & $psql -h $dbHost -p $dbPort -U $user -d postgres -v ON_ERROR_STOP=1 -q -c "create database $guardDb;" 2>&1 | Out-Null
    & $psql -h $dbHost -p $dbPort -U $user -d $guardDb -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot 'schema-stubs.sql') 2>&1 | Out-Null

    $guardSetup = @'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'schema_tester') then
    create role schema_tester nologin;
  end if;
end $$;

grant usage, create on schema public to schema_tester;
grant usage on schema auth, storage to schema_tester;
grant execute on all functions in schema auth to schema_tester;
-- The real SQL editor role can reference auth.users. Without this the guard role
-- fails on the foreign keys long before reaching the storage section.
grant select, references on all tables in schema auth to schema_tester;
-- ...and it creates the signup trigger on auth.users, so it needs TRIGGER too.
grant trigger on all tables in schema auth to schema_tester;
'@
    $setup = & $psql -h $dbHost -p $dbPort -U $user -d $guardDb -v ON_ERROR_STOP=1 -q -t -A -c $guardSetup 2>&1
    if ($LASTEXITCODE -ne 0) {
      $problems++
      Write-Output "PROBLEM: could not prepare the storage-guard role: $setup"
    }
    else {
      $runner = Join-Path $env:TEMP 'connect-schema-guard.sql'
      # psql's \i wants forward slashes, otherwise it reads the drive letter as
      # part of the filename and reports a misleading permission error.
      $schemaPath = ((Resolve-Path (Join-Path $PSScriptRoot '..\supabase\schema.sql')).Path -replace '\\', '/')
      "set role schema_tester;" | Set-Content $runner
      "\i $schemaPath" | Add-Content $runner

      $guardOutput = & $psql -h $dbHost -p $dbPort -U $user -d $guardDb -v ON_ERROR_STOP=1 -q -f $runner 2>&1
      if ($LASTEXITCODE -ne 0) {
        $problems++
        Write-Output 'PROBLEM: schema.sql aborts for a role that does not own storage.objects:'
        $guardOutput | ForEach-Object { Write-Output "  $_" }
      }
      elseif ($guardOutput -match 'cannot manage storage\.objects') {
        Write-Output 'schema.sql warns about the storage policies instead of aborting'
      }
      else {
        $problems++
        Write-Output 'PROBLEM: the storage guard did not report the missing access, so it would fail silently on Supabase'
      }
      Remove-Item $runner -ErrorAction SilentlyContinue
    }
    & $psql -h $dbHost -p $dbPort -U $user -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists $guardDb;" 2>&1 | Out-Null
}

# 6. Clean up.
& $psql -h $dbHost -p $dbPort -U $user -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists $scratch;" 2>&1 | Out-Null
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($problems -eq 0) {
  Write-Output ''
  Write-Output 'schema.sql is valid.'
  exit 0
}

Write-Output ''
Write-Output "$problems problem(s) found."
exit 1
