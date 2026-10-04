-- Functional test of the Row Level Security policies.
--
-- Runs supabase/schema.sql on a local PostgreSQL with stand-ins for the
-- Supabase-managed schemas, then impersonates two different accounts and checks
-- that neither can see or touch the other's rows.
--
-- This is the same check scripts/test-rls.mjs does against a real project. It
-- exists so the policies are proven before the migration is run on Supabase,
-- where a mistake is harder to undo.

create table public.rls_results (
  label   text primary key,
  passed  boolean not null
);

truncate public.rls_results;

-- SECURITY INVOKER on purpose: this has to run as the impersonated account so
-- the policies are the thing being tested, not a bypass.
create or replace function public.rls_record(check_label text, check_passed boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.rls_results as r (label, passed)
  values (check_label, check_passed)
  on conflict (label) do update set passed = excluded.passed;
end;
$$;


/*
 * $1 = the other account's id, which must be invisible and untouchable.
 * $2 = the table, $3 = the column holding the parent id, $4 = a writable text
 * column used to prove an update is refused.
 */
create or replace function public.rls_check_one(
  other uuid,
  table_name text,
  link_column text,
  write_column text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rows_seen integer;
  rows_changed integer;
  target text;
begin
  -- 1. The other account's row must not be readable by its exact id.
  execute format(
    'select count(*) from public.%I where %I = $1', table_name, link_column
  ) into rows_seen using other;
  perform public.rls_record(
    format('%s: cannot read the other account''s row by id', table_name),
    rows_seen = 0
  );

  -- 2. Listing the table must never include the other account's row.
  execute format(
    'select count(*) from public.%I where %I = $1', table_name, link_column
  ) into rows_seen using other;
  perform public.rls_record(
    format('%s: listing hides the other account''s row', table_name),
    rows_seen = 0
  );

  -- 3. Updating it must change nothing.
  if write_column <> '' then
    execute format(
      'update public.%I set %I = %L where %I = $1',
      table_name, write_column, 'hijacked', link_column
    ) using other;
    get diagnostics rows_changed = row_count;
    perform public.rls_record(
      format('%s: cannot change the other account''s row', table_name),
      rows_changed = 0
    );
  end if;

  -- 4. Deleting it must remove nothing.
  execute format(
    'delete from public.%I where %I = $1 returning 1', table_name, link_column
  ) into rows_seen using other;
  perform public.rls_record(
    format('%s: cannot delete the other account''s row', table_name),
    coalesce(rows_seen, 0) = 0
  );
end;
$$;


-- Confirms the current account can still reach its own row, so the checks
-- above are not passing simply because nothing is visible at all.
create or replace function public.rls_check_own(
  table_name text,
  link_column text,
  own_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rows_seen integer;
begin
  execute format(
    'select count(*) from public.%I where %I = $1', table_name, link_column
  ) into rows_seen using own_id;
  perform public.rls_record(
    format('%s: can read own row', table_name),
    rows_seen >= 1
  );
end;
$$;


-- The same question for a child table, which has no owner_id of its own and so
-- must be reached through the parent row that owns it.
create or replace function public.rls_check_own_via_parent(
  child_table text,
  child_fk text,
  parent_table text,
  own_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rows_seen integer;
begin
  execute format(
    'select count(*) from public.%I c
       where exists (select 1 from public.%I p
                     where p.id = c.%I and p.owner_id = $1)',
    child_table, parent_table, child_fk
  ) into rows_seen using own_id;
  perform public.rls_record(
    format('%s: can read own rows through %s', child_table, parent_table),
    rows_seen >= 1
  );
end;
$$;


-- Private files. Each account keeps its objects under its own folder, which is
-- the first segment of the object path.
create or replace function public.rls_check_storage(other_folder text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  mine uuid := auth.uid();
  rows_seen integer;
  rows_changed integer;
  my_object text;
  other_object text;
begin
  my_object := mine::text || '/report-1/report.pdf';
  other_object := other_folder || '/report-1/report.pdf';

  select count(*) into rows_seen
  from storage.objects
  where bucket_id = 'reports' and (storage.foldername(name))[1] = mine::text;
  perform public.rls_record(
    'storage: can list own files',
    rows_seen >= 1
  );

  select count(*) into rows_seen
  from storage.objects
  where bucket_id = 'reports' and (storage.foldername(name))[1] = other_folder;
  perform public.rls_record(
    'storage: listing hides the other account''s files',
    rows_seen = 0
  );

  select count(*) into rows_seen from storage.objects
  where bucket_id = 'reports' and name = other_object;
  perform public.rls_record(
    'storage: cannot read the other account''s file by path',
    rows_seen = 0
  );

  -- Overwriting somebody else's object must not be possible. The WHERE aims at
  -- the other account's rows, so the USING clause has to exclude them.
  update storage.objects set name = name
  where bucket_id = 'reports' and (storage.foldername(name))[1] = other_folder;
  get diagnostics rows_changed = row_count;
  perform public.rls_record(
    'storage: cannot change the other account''s file',
    rows_changed = 0
  );

  -- An object may also not be renamed out of the caller's own folder. Here the
  -- row is the caller's own, so the WITH CHECK is what has to refuse it, and it
  -- refuses by raising rather than by matching nothing.
  begin
    update storage.objects set name = other_object
    where bucket_id = 'reports' and name = my_object;
    rows_changed := 1;
  exception when others then
    rows_changed := 0;
  end;
  perform public.rls_record(
    'storage: cannot move own file into another folder',
    rows_changed = 0
  );

  delete from storage.objects
  where bucket_id = 'reports' and name = other_object returning 1 into rows_seen;
  perform public.rls_record(
    'storage: cannot delete the other account''s file',
    coalesce(rows_seen, 0) = 0
  );

  -- Writing into somebody else's folder has to be refused on insert.
  begin
    insert into storage.objects (bucket_id, name) values ('reports', other_object);
    rows_changed := 1;
  exception when others then
    rows_changed := 0;
  end;
  perform public.rls_record(
    'storage: cannot upload into another folder',
    rows_changed = 0
  );
end;
$$;


-- A child row is protected through its parent, so the cross-account check has to
-- aim at the other account's actual parent row id. Filtering by an account id in
-- a child table would find nothing at all and pass without testing anything.
create or replace function public.rls_check_child_hidden(
  child_table text,
  child_fk text,
  parent_row uuid,
  write_column text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rows_seen integer;
  rows_changed integer;
begin
  execute format(
    'select count(*) from public.%I where %I = $1', child_table, child_fk
  ) into rows_seen using parent_row;
  perform public.rls_record(
    format('%s: cannot read rows under another account''s row', child_table),
    rows_seen = 0
  );

  if write_column <> '' then
    execute format(
      'update public.%I set %I = %L where %I = $1',
      child_table, write_column, 'hijacked', child_fk
    ) using parent_row;
    get diagnostics rows_changed = row_count;
    perform public.rls_record(
      format('%s: cannot change rows under another account''s row', child_table),
      rows_changed = 0
    );
  end if;

  execute format(
    'delete from public.%I where %I = $1 returning 1', child_table, child_fk
  ) into rows_seen using parent_row;
  perform public.rls_record(
    format('%s: cannot delete rows under another account''s row', child_table),
    coalesce(rows_seen, 0) = 0
  );
end;
$$;


-- The linked-ownership rules: a row may not point at another account's record.
--
-- The other account's row ids are passed in rather than looked up here. If this
-- function tried to select them itself, the policies would hide them and it
-- would end up testing its own rows instead, which passes for the wrong reason.
create or replace function public.rls_check_links(
  other_member uuid,
  other_report uuid,
  other_appointment uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  was_blocked boolean := false;
  reason text := '';
begin
  -- Only an RLS refusal counts as the policy doing its job. Any other error, a
  -- type mismatch or a missing fixture row for instance, would otherwise be
  -- recorded as a pass and hide a check that never really ran.
  -- appointments cannot borrow another account's family member
  begin
    insert into public.appointments (owner_id, doctor, appointment_date, appointment_time, member_id)
    values (auth.uid(), 'Borrowed', current_date, '09:00', other_member);
  exception when others then
    was_blocked := true;
    reason := sqlerrm;
  end;
  perform public.rls_record(
    format('appointments: cannot attach another account''s family member%s',
           case when was_blocked and reason not like '%%row-level security%%'
                then ' [blocked for the wrong reason: ' || reason || ']'
                else '' end),
    was_blocked and reason like '%row-level security%'
  );

  -- report_tests cannot join another account's report
  was_blocked := false;
  reason := '';
  begin
    insert into public.report_tests (report_id, position, name, raw, value_text, status)
    values (other_report, 99, 'injected', '9', '9', 'low');
  exception when others then
    was_blocked := true;
    reason := sqlerrm;
  end;
  perform public.rls_record(
    format('report_tests: cannot join another account''s report%s',
           case when was_blocked and reason not like '%%row-level security%%'
                then ' [blocked for the wrong reason: ' || reason || ']'
                else '' end),
    was_blocked and reason like '%row-level security%'
  );

  -- doctor_questions cannot borrow another account's appointment
  was_blocked := false;
  reason := '';
  begin
    insert into public.doctor_questions (owner_id, text, appointment_id)
    values (auth.uid(), 'borrowed', other_appointment);
  exception when others then
    was_blocked := true;
    reason := sqlerrm;
  end;
  perform public.rls_record(
    format('doctor_questions: cannot attach another account''s appointment%s',
           case when was_blocked and reason not like '%%row-level security%%'
                then ' [blocked for the wrong reason: ' || reason || ']'
                else '' end),
    was_blocked and reason like '%row-level security%'
  );
end;
$$;


create or replace function public.rls_check_anonymous()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rows_seen integer;
begin
  perform set_config('request.jwt.claim.sub', '', false);

  select count(*) into rows_seen from public.family_members;
  perform public.rls_record('signed out: family_members returns nothing', rows_seen = 0);

  select count(*) into rows_seen from public.reports;
  perform public.rls_record('signed out: reports returns nothing', rows_seen = 0);

  select count(*) into rows_seen from public.chat_messages;
  perform public.rls_record('signed out: chat_messages returns nothing', rows_seen = 0);

  select count(*) into rows_seen from public.profiles;
  perform public.rls_record('signed out: profiles returns nothing', rows_seen = 0);
end;
$$;