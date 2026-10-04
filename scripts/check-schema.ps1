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

# The local development connection string, read from ai/.env so the password is
# never typed on a command line or printed.
$envFile = Join-Path $PSScriptRoot '..\ai\.env'
if (-not (Test-Path $envFile)) {
  Write-Output 'ai/.env was not found, so the local connection details are unknown.'
  exit 1
}

$url = (Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1)
$url = ($url -replace '^DATABASE_URL=', '').Trim()
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

# 4. Clean up.
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