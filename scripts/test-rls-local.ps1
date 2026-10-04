# Runs the Row Level Security policies against a throwaway local database.
#
# Creates two accounts, gives each one private health data, then impersonates
# each one to confirm it can only ever reach its own rows. Nothing here touches
# the real connect database or Supabase: the scratch database is dropped again
# at the end.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/test-rls-local.ps1

$ErrorActionPreference = 'Continue'

$psql = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'

# A local PostgreSQL is only needed to build the throwaway database. The app
# itself does not use one, so DATABASE_URL is read from the shell first and falls
# back to ai/.env where it used to live.
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
$dbUser = $parsed.UserInfo.Split(':')[0]
$scratch = 'connect_rls_test'

function Invoke-Psql {
  param([string]$Sql, [string]$Database = 'postgres')
  # psql notices and errors go to stderr while the rows come back on stdout, so
  # they are collected separately and only reported if the command failed.
  $errFile = [System.IO.Path]::GetTempFileName()
  try {
    $output = & $psql -h $dbHost -p $dbPort -U $dbUser -d $Database -v ON_ERROR_STOP=1 -q -t -A -c $Sql 2>$errFile
    $code = $LASTEXITCODE
    $errors = (Get-Content $errFile -Raw) -replace '\s+', ' '
  }
  finally {
    Remove-Item $errFile -ErrorAction SilentlyContinue
  }
  if ($code -ne 0) { throw $errors.Trim() }
  return $output
}

Write-Output "> building throwaway database: $scratch"
Invoke-Psql "drop database if exists $scratch;" | Out-Null
Invoke-Psql "create database $scratch;" | Out-Null

# Stubs first, then the real schema, then the test helpers.
& $psql -h $dbHost -p $dbPort -U $dbUser -d $scratch -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot 'schema-stubs.sql') 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output 'stubs failed'; Invoke-Psql "drop database if exists $scratch;" | Out-Null; exit 1 }

& $psql -h $dbHost -p $dbPort -U $dbUser -d $scratch -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot '..\supabase\schema.sql') 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output 'schema failed'; Invoke-Psql "drop database if exists $scratch;" | Out-Null; exit 1 }

& $psql -h $dbHost -p $dbPort -U $dbUser -d $scratch -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot 'rls-test-functions.sql') 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output 'test helpers failed'; Invoke-Psql "drop database if exists $scratch;" | Out-Null; exit 1 }

# The Storage policies are inert without this, and a failure that deep inside the
# storage checks is very hard to read, so it is asserted up front.
$storageRls = @(Invoke-Psql @'
select relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage' and c.relname = 'objects';
'@ -Database $scratch)[0]

if ($storageRls -ne 't') {
  Invoke-Psql "drop database if exists $scratch;" | Out-Null
  throw 'Row Level Security is off on storage.objects, so none of the file policies apply.'
}

# The browser connects as these roles, so they need the same table privileges
# Supabase grants.
Invoke-Psql @'
grant usage on schema public to anon, authenticated;
-- The policies call auth.uid(), so the browser roles need to reach that schema
-- too, exactly as they do on Supabase.
grant usage on schema auth to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects, storage.buckets to anon, authenticated;
grant execute on all functions in schema storage to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
'@ -Database $scratch | Out-Null

# Two accounts. The signup trigger creates their profiles.
$idA = '11111111-1111-1111-1111-111111111111'
$idB = '22222222-2222-2222-2222-222222222222'

Invoke-Psql @"
insert into auth.users (id, email, raw_user_meta_data)
values
  ('$idA', 'a@example.test', jsonb_build_object('full_name', 'User A')),
  ('$idB', 'b@example.test', jsonb_build_object('full_name', 'User B'));
"@ -Database $scratch | Out-Null
Write-Output "account A: $idA"
Write-Output "account B: $idB"

# Each account seeds its own private data while impersonated, so the policies are
# exercised on the way in too.
foreach ($id in @($idA, $idB)) {
  $seed = @"
set role authenticated;
set request.jwt.claim.sub = '$id';

-- owner_id is deliberately left out of every insert here, exactly as the app
-- leaves it out. The column defaults to auth.uid(), so a row can only ever land
-- under the account that created it, and the policies still refuse an explicit
-- attempt to file one under somebody else.
insert into public.family_members (full_name, relationship) values ('Member', 'self');
insert into public.family_members (full_name, relationship) values ('Member2', 'child');
insert into public.medications (name, member_id)
  select 'Medication', id from public.family_members order by id limit 1;
insert into public.appointments (doctor, appointment_date, appointment_time, member_id)
  select 'Dr Test', current_date, '09:00', id from public.family_members order by id limit 1;
insert into public.emergency_contacts (name, phone) values ('Contact', '000');
insert into public.notifications (title) values ('Note');
insert into public.symptom_entries (symptom) values ('Symptom');
insert into public.health_metrics (label, value) values ('Metric', '1');
insert into public.health_records (title) values ('Record');
insert into public.reports (filename, source, raw_text) values ('report.pdf', 'upload', 'text');
insert into public.chat_conversations (title) values ('Chat');
insert into public.doctor_prep_notes (owner_id, content) values ('$id', 'Prepared');
insert into public.chat_messages (conversation_id, role, content)
  select id, 'user', 'private question' from public.chat_conversations;
insert into public.doctor_questions (text, appointment_id)
  select 'Question', id from public.appointments limit 1;
insert into public.report_tests (report_id, position, name, raw, value_text, status)
  select id, 0, 'Haemoglobin', '11.2', '11.2', 'low' from public.reports limit 1;
insert into public.report_summaries (report_id, language, text)
  select id, 'en', 'private summary' from public.reports limit 1;
insert into public.report_explanations (report_id, test_name, language, text)
  select id, 'Haemoglobin', 'en', 'private explanation' from public.reports limit 1;
insert into storage.objects (bucket_id, name) values ('reports', '$id/report-1/report.pdf');

-- The default has to be the signed-in account, and only that account.
select public.rls_record(
  'owner_id defaults to the signed-in account',
  (select count(*) from public.family_members where owner_id = '$id') = 2
);
reset role;
"@
  Invoke-Psql $seed -Database $scratch | Out-Null
}

# Row ids, read before impersonating anyone. Once the policies apply another
# account's ids are invisible, which is the whole point, so they are captured here
# and handed to the checks rather than looked up from inside them.
# @() is needed because PowerShell unwraps a single result into a bare string,
# which [0] would then read as the first character instead of the whole value.
function Get-OwnedId {
  param([string]$Table, [string]$Owner)
  return @(Invoke-Psql "select id from public.$Table where owner_id = '$Owner' limit 1;" -Database $scratch)[0]
}
function Get-Scalar {
  param([string]$Sql)
  return @(Invoke-Psql $Sql -Database $scratch)[0]
}

$reportA = Get-OwnedId 'reports' $idA
$reportB = Get-OwnedId 'reports' $idB
$apptA = Get-OwnedId 'appointments' $idA
$apptB = Get-OwnedId 'appointments' $idB
$memberB = Get-OwnedId 'family_members' $idB
$convA = Get-Scalar "select id from public.chat_conversations where owner_id = '$idA' limit 1;"
$convB = Get-Scalar "select id from public.chat_conversations where owner_id = '$idB' limit 1;"

# A missing id here would be swallowed by the check's exception handler and
# reported as a policy doing its job, so an incomplete fixture has to stop the
# run instead of quietly turning every link check into a false pass.
foreach ($needed in @{
  'report A' = $reportA; 'report B' = $reportB
  'appointment A' = $apptA; 'appointment B' = $apptB
  'conversation A' = $convA; 'conversation B' = $convB
  'family member B' = $memberB
}.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($needed.Value)) {
    Invoke-Psql "drop database if exists $scratch;" | Out-Null
    throw "the fixture is incomplete: no $($needed.Key) row was created, so the checks would pass without testing anything"
  }
}

# Run every check as each account in turn.
$check = @"
set role authenticated;
set request.jwt.claim.sub = '__ID__';
select public.rls_check_own('family_members', 'owner_id', '__ID__');
select public.rls_check_own('appointments', 'owner_id', '__ID__');
select public.rls_check_own('reports', 'owner_id', '__ID__');
select public.rls_check_own_via_parent('chat_messages', 'conversation_id', 'chat_conversations', '__ID__');
select public.rls_check_own_via_parent('report_tests', 'report_id', 'reports', '__ID__');
select public.rls_check_own_via_parent('report_summaries', 'report_id', 'reports', '__ID__');
select public.rls_check_own_via_parent('doctor_questions', 'appointment_id', 'appointments', '__ID__');
select public.rls_check_one('__OTHER__', 'profiles', 'id', 'full_name');
select public.rls_check_one('__OTHER__', 'family_members', 'owner_id', 'full_name');
select public.rls_check_one('__OTHER__', 'appointments', 'owner_id', 'reason');
select public.rls_check_one('__OTHER__', 'medications', 'owner_id', 'name');
select public.rls_check_one('__OTHER__', 'health_records', 'owner_id', 'title');
select public.rls_check_one('__OTHER__', 'emergency_contacts', 'owner_id', 'name');
select public.rls_check_one('__OTHER__', 'notifications', 'owner_id', 'title');
select public.rls_check_one('__OTHER__', 'symptom_entries', 'owner_id', 'symptom');
select public.rls_check_one('__OTHER__', 'health_metrics', 'owner_id', 'label');
select public.rls_check_one('__OTHER__', 'reports', 'owner_id', 'filename');
select public.rls_check_one('__OTHER__', 'doctor_questions', 'owner_id', 'text');
select public.rls_check_one('__OTHER__', 'chat_conversations', 'owner_id', 'title');
select public.rls_check_child_hidden('chat_messages', 'conversation_id', '__OTHER_CONV__', 'content');
select public.rls_check_child_hidden('report_tests', 'report_id', '__OTHER_REPORT__', 'name');
select public.rls_check_child_hidden('report_summaries', 'report_id', '__OTHER_REPORT__', 'text');
select public.rls_check_child_hidden('report_explanations', 'report_id', '__OTHER_REPORT__', 'text');
select public.rls_check_child_hidden('doctor_questions', 'appointment_id', '__OTHER_APPT__', 'text');
select public.rls_check_storage('__OTHER__');
reset role;
"@

Invoke-Psql ($check.Replace('__ID__', $idA).Replace('__OTHER__', $idB).Replace('__OTHER_CONV__', $convB).Replace('__OTHER_REPORT__', $reportB).Replace('__OTHER_APPT__', $apptB)) -Database $scratch | Out-Null
Invoke-Psql ($check.Replace('__ID__', $idB).Replace('__OTHER__', $idA).Replace('__OTHER_CONV__', $convA).Replace('__OTHER_REPORT__', $reportA).Replace('__OTHER_APPT__', $apptA)) -Database $scratch | Out-Null

# Link checks run as account A, trying to reach account B's rows.
$links = @"
set role authenticated;
set request.jwt.claim.sub = '$idA';
select public.rls_check_links('$memberB', '$reportB', '$apptB');
select public.rls_check_anonymous();
reset role;
"@
Invoke-Psql $links -Database $scratch | Out-Null

$anon = @"
set role anon;
select public.rls_check_anonymous();
reset role;
"@
Invoke-Psql $anon -Database $scratch | Out-Null

# Read the results back.
$rows = Invoke-Psql 'select passed, label from public.rls_results order by label;' -Database $scratch

Write-Output ''
$passed = 0
$failed = @()
foreach ($row in $rows) {
  if (-not $row) { continue }
  if ($row.StartsWith('t')) { $passed++; Write-Output "  PASS  $($row.Substring(2))" }
  else { $failed += $row.Substring(2); Write-Output "  FAIL  $($row.Substring(2))" }
}

Invoke-Psql "drop database if exists $scratch;" | Out-Null
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Output ''
if ($failed.Count -eq 0) {
  Write-Output "$passed/$passed checks passed. Accounts are fully isolated."
  exit 0
}
Write-Output "$passed passed, $($failed.Count) failed:"
$failed | ForEach-Object { Write-Output "  - $_" }
exit 1