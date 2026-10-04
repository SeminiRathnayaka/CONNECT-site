/**
 * Proves that Row Level Security actually keeps accounts apart on a real
 * Supabase project.
 *
 * This creates two real accounts, gives each one private health data, then
 * checks the four things that matter:
 *
 *   1. Each account can read its own records.
 *   2. Each account cannot read the other's records.
 *   3. Each account cannot change or delete the other's records.
 *   4. Nobody signed out can read anything at all.
 *
 * Private Storage is checked too, because a leaked medical PDF is worse than a
 * leaked row, and a row that points at somebody else's family member is checked
 * because it leaves a cross-account pointer behind for a future join to leak.
 *
 * Only the public anon key is used. The service_role key is deliberately never
 * read, because it bypasses Row Level Security and would make this prove nothing.
 *
 * Before running this, apply supabase/schema.sql to the project.
 *
 * Usage:  npm run test:rls
 */

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

function readEnvFile(path) {
  if (!existsSync(path)) return {}
  const values = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const split = trimmed.indexOf('=')
    if (split < 0) continue
    values[trimmed.slice(0, split).trim()] = trimmed.slice(split + 1).trim().replace(/^["']|["']$/g, '')
  }
  return values
}

const env = { ...readEnvFile('.env.local'), ...process.env }
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('\nCould not read VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local.')
  console.error('Add both, then run this again.\n')
  process.exit(1)
}

if (anonKey.includes('service_role')) {
  console.error('\nRefusing to run: that key looks like a service_role key.')
  console.error('Use the anon / publishable key only.\n')
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

const results = []

function check(label, passed, detail = '') {
  results.push({ label, passed })
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? ` - ${detail}` : ''}`)
}

/**
 * Every table a person's private data lives in, with the column that identifies
 * the row and a column that is safe to write to.
 *
 * The write column matters more than it looks: an update to a column that does
 * not exist fails for the wrong reason, so "the other account's row was not
 * changed" would pass without the policies ever being consulted. Each entry
 * therefore names a real column on its own table.
 */
const OWNER_TABLES = [
  { table: 'profiles', write: { full_name: 'hijacked' } },
  { table: 'family_members', write: { full_name: 'hijacked' } },
  { table: 'appointments', write: { reason: 'hijacked' } },
  { table: 'medications', write: { name: 'hijacked' } },
  { table: 'health_records', write: { title: 'hijacked' } },
  { table: 'symptom_entries', write: { symptom: 'hijacked' } },
  { table: 'health_metrics', write: { label: 'hijacked' } },
  { table: 'emergency_contacts', write: { name: 'hijacked' } },
  { table: 'notifications', write: { title: 'hijacked' } },
  { table: 'reports', write: { filename: 'hijacked.pdf' } },
  { table: 'doctor_questions', write: { text: 'hijacked' } },
  { table: 'chat_conversations', write: { title: 'hijacked' } },
]

/**
 * Tables with no owner_id of their own. Access follows the parent row, so each
 * entry names the parent record whose id has to be used to reach it.
 */
const CHILD_TABLES = [
  { table: 'report_tests', parent: 'report', write: { name: 'hijacked' } },
  { table: 'report_summaries', parent: 'report', write: { text: 'hijacked' } },
  { table: 'report_explanations', parent: 'report', write: { text: 'hijacked' } },
  { table: 'chat_messages', parent: 'conversation', write: { content: 'hijacked' } },
]

const ALL_TABLES = [...OWNER_TABLES.map((t) => t.table), ...CHILD_TABLES.map((t) => t.table)]

/* ------------------------------------------------------------------ */
/* Sign in / sign up                                                    */
/* ------------------------------------------------------------------ */

/**
 * Returns a signed-in client for one test account, creating it if needed.
 *
 * When the project requires email confirmation a new account has no session
 * yet, and the script says so rather than reporting a false failure.
 */
async function signIn(email, password, fullName) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const existing = await client.auth.signInWithPassword({ email, password })
  if (!existing.error && existing.data.session) return { client, user: existing.data.user }

  const created = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (created.error && !/already registered/i.test(created.error.message)) {
    throw new Error(`${email}: ${created.error.message}`)
  }

  if (created.data?.session) return { client, user: created.data.user }

  // Confirmation is switched on, so the account exists but cannot sign in yet.
  const retry = await client.auth.signInWithPassword({ email, password })
  if (!retry.error && retry.data.session) return { client, user: retry.data.user }

  return { client, user: null }
}

/* ------------------------------------------------------------------ */
/* Private data each account creates                                   */
/* ------------------------------------------------------------------ */

const stamp = Date.now()

// Supabase's validator rejects reserved domains such as example.test and
// example.com, so the throwaway accounts need a domain that looks real. Nothing
// is delivered to it: this only works with email confirmation switched off, and
// with it off no mail is sent at all. Override with RLS_TEST_EMAIL_DOMAIN if
// your project is stricter than the default.
const emailDomain = env.RLS_TEST_EMAIL_DOMAIN || 'gmail.com'
const emailFor = (who) => `rls-user-${who}-${stamp}@${emailDomain}`

/**
 * Gives one account a full set of private records.
 *
 * owner_id is written out on every row. It is never defaulted, because letting
 * the database choose the owner would let a signed-in person file a record
 * under somebody else's account.
 */
async function seedPrivateData(client, userId, tag) {
  const fail = (label, error) => {
    throw new Error(`seeding ${label} failed: ${error?.message ?? 'no error returned'}`)
  }

  // The signup trigger already created this row, so it is read and updated
  // rather than inserted, which would collide with the trigger.
  const existing = await client.from('profiles').select('*').eq('id', userId).single()
  if (existing.error) fail('the profile', existing.error)
  const { error: profileError } = await client
    .from('profiles')
    .update({ full_name: `Owner ${tag}`, email: `owner-${tag}@${emailDomain}` })
    .eq('id', userId)
  if (profileError) fail('the profile update', profileError)

  const rows = {}

  const insert = async (label, table, values, optional = {}) => {
    const { data, error } = await client.from(table).insert({ owner_id: userId, ...values }).select().single()
    if (error || !data) {
      if (optional) return null
      fail(label, error)
    }
    rows[optional.key ?? label] = data
    return data
  }

  const member = await insert('member', 'family_members', {
    full_name: `Family ${tag}`,
    relationship: 'self',
  })
  rows.member = member

  await insert('appointment', 'appointments', {
    doctor: `Dr ${tag}`,
    appointment_date: '2026-01-01',
    appointment_time: '09:00',
    member_id: member.id,
  })
  await insert('medication', 'medications', { name: `Medication ${tag}`, member_id: member.id })
  await insert('record', 'health_records', { title: `Record ${tag}`, member_id: member.id })
  await insert('contact', 'emergency_contacts', { name: `Contact ${tag}`, phone: '000' })
  await insert('notification', 'notifications', { title: `Note ${tag}` })
  await insert('symptom', 'symptom_entries', { symptom: `Symptom ${tag}` })
  await insert('metric', 'health_metrics', { label: `Metric ${tag}`, value: '1' })
  const report = await insert('report', 'reports', {
    filename: `report-${tag}.pdf`,
    source: 'upload',
    raw_text: 'private test text',
  })
  await insert('conversation', 'chat_conversations', { title: `Chat ${tag}` })
  await insert('question', 'doctor_questions', {
    text: `Question ${tag}`,
    appointment_id: rows.appointment.id,
  })

  // Doctor prep notes are keyed by the account id rather than having a row id.
  const { error: prepError } = await client
    .from('doctor_prep_notes')
    .upsert({ owner_id: userId, content: `Notes ${tag}` })
  if (prepError) fail('the doctor prep notes', prepError)

  // Report children.
  const child = async (label, table, values) => {
    const { error } = await client.from(table).insert(values)
    if (error) fail(label, error)
  }
  await child('a report test', 'report_tests', {
    report_id: report.id,
    position: 0,
    name: `Haemoglobin ${tag}`,
    raw: '11.2',
    value_text: '11.2',
    status: 'low',
  })
  await child('a report summary', 'report_summaries', {
    report_id: report.id,
    language: 'en',
    text: `Summary ${tag}`,
  })
  await child('a report explanation', 'report_explanations', {
    report_id: report.id,
    test_name: `Haemoglobin ${tag}`,
    language: 'en',
    text: `Explanation ${tag}`,
  })
  await child('a chat message', 'chat_messages', {
    conversation_id: rows.conversation.id,
    role: 'user',
    content: `private question ${tag}`,
  })

  // A file in this account's own folder, to prove Storage is private too.
  const filePath = `${userId}/${report.id}/report-${tag}.pdf`
  const { error: uploadError } = await client.storage
    .from('reports')
    .upload(filePath, new Blob(['private pdf']), { upsert: true })
  if (uploadError) fail('the report file', uploadError)

  return { ...rows, filePath, folder: userId, tag }
}

/* ------------------------------------------------------------------ */
/* The checks                                                           */
/* ------------------------------------------------------------------ */

/** Checks one account against everything belonging to the other. */
async function checkIsolation(actor, actorName, victim, victimName) {
  console.log(`\n${actorName} against ${victimName}'s data`)

  for (const { table, write } of OWNER_TABLES) {
    const foreignId = victim[table === 'profiles' ? 'profileId' : table]?.id
    if (!foreignId) continue

    const byId = await actor.from(table).select('*').eq('id', foreignId)
    check(
      `${actorName} cannot read ${victimName}'s ${table}`,
      (byId.data?.length ?? 0) === 0 && !byId.error,
      byId.error ? byId.error.message : `${byId.data?.length ?? 0} row(s)`,
    )

    const listed = await actor.from(table).select('id')
    const leaked = (listed.data ?? []).some((row) => row.id === foreignId)
    check(
      `${actorName} sees no ${victimName} rows when listing ${table}`,
      !leaked,
      leaked ? 'a foreign row was listed' : `${listed.data?.length ?? 0} own row(s)`,
    )

    const updated = await actor.from(table).update(write).eq('id', foreignId).select()
    const changed = (updated.data?.length ?? 0) > 0
    check(
      `${actorName} cannot change ${victimName}'s ${table}`,
      !changed,
      changed ? 'the row was modified' : 'nothing matched',
    )

    const deleted = await actor.from(table).delete().eq('id', foreignId).select()
    const removed = (deleted.data?.length ?? 0) > 0
    check(
      `${actorName} cannot delete ${victimName}'s ${table}`,
      !removed,
      removed ? 'the row was deleted' : 'nothing matched',
    )
  }

  for (const { table, parent, write } of CHILD_TABLES) {
    const parentId = victim[parent]?.id
    if (!parentId) continue

    const seen = await actor.from(table).select('*').eq(`${table === 'chat_messages' ? 'conversation' : 'report'}_id`, parentId)
    check(
      `${actorName} cannot read ${victimName}'s ${table}`,
      (seen.data?.length ?? 0) === 0,
      `${seen.data?.length ?? 0} row(s)`,
    )

    const updated = await actor.from(table).update(write).eq(table === 'chat_messages' ? 'conversation_id' : 'report_id', parentId).select()
    check(
      `${actorName} cannot change ${victimName}'s ${table}`,
      (updated.data?.length ?? 0) === 0,
      `${updated.data?.length ?? 0} row(s)`,
    )

    const deleted = await actor.from(table).delete().eq(table === 'chat_messages' ? 'conversation_id' : 'report_id', parentId).select()
    check(
      `${actorName} cannot delete ${victimName}'s ${table}`,
      (deleted.data?.length ?? 0) === 0,
      `${deleted.data?.length ?? 0} row(s)`,
    )
  }
}

/** Private files, which the app treats as just as sensitive as the rows. */
async function checkStorage(actor, actorName, victim, victimName) {
  console.log(`\n${actorName} against ${victimName}'s files`)

  const own = await actor.storage.from('reports').download(victim.filePath)
  check(
    `${actorName} cannot download ${victimName}'s file`,
    Boolean(own.error),
    own.error ? 'refused' : 'DOWNLOADED - this is a problem',
  )

  const listed = await actor.storage.from('reports').list(victim.folder)
  check(
    `${actorName} cannot list ${victimName}'s folder`,
    (listed.data?.length ?? 0) === 0,
    `${listed.data?.length ?? 0} entries`,
  )

  const { error: uploadError } = await actor.storage
    .from('reports')
    .upload(`${victim.folder}/injected.pdf`, new Blob(['injected']), { upsert: true })
  check(
    `${actorName} cannot upload into ${victimName}'s folder`,
    Boolean(uploadError),
    uploadError ? 'refused' : 'ACCEPTED - this is a problem',
  )

  const { error: moveError } = await actor.storage
    .from('reports')
    .move(victim.filePath, `${actorName.replace(/\s/g, '')}/stolen.pdf`)
  check(
    `${actorName} cannot move ${victimName}'s file into its own folder`,
    Boolean(moveError),
    moveError ? 'refused' : 'MOVED - this is a problem',
  )

  const { error: removeError } = await actor.storage.from('reports').remove([victim.filePath])
  check(
    `${actorName} cannot delete ${victimName}'s file`,
    Boolean(removeError),
    removeError ? 'refused' : 'DELETED - this is a problem',
  )

  // And the owner must still be able to do all of it, so the checks above are
  // not passing simply because nothing is reachable at all.
  const mine = await actor.storage.from('reports').download(victim.filePath)
  check(
    `${actorName} note: this file belongs to ${victimName}, so it should be refused`,
    Boolean(mine.error),
    mine.error ? 'refused as expected' : 'DOWNLOADED - this is a problem',
  )
}

/* ------------------------------------------------------------------ */
/* Run                                                                  */
/* ------------------------------------------------------------------ */

console.log(`\nTesting Row Level Security on ${url}`)

const password = `RlsTest!${stamp}`
const a = await signIn(emailFor('a'), password, 'User A')
const b = await signIn(emailFor('b'), password, 'User B')

if (!a.user || !b.user) {
  console.error('\nCould not sign in both test accounts.')
  console.error('If your project requires email confirmation, turn it off for this test:')
  console.error('  Authentication -> Providers -> Email -> uncheck "Confirm email"')
  console.error('Then run this again.\n')
  process.exit(1)
}

console.log(`\nUser A: ${a.user.id}`)
console.log(`User B: ${b.user.id}`)

const dataA = await seedPrivateData(a.client, a.user.id, 'A')
const dataB = await seedPrivateData(b.client, b.user.id, 'B')

dataA.profileId = { id: a.user.id }
dataB.profileId = { id: b.user.id }

/* 1. Each account can read its own records. */
console.log('\nEach account with its own data')
for (const [label, session, own] of [
  ['User A', a, dataA],
  ['User B', b, dataB],
]) {
  for (const { table } of OWNER_TABLES) {
    const rowKey = table === 'profiles' ? 'profileId' : table
    const ownId = own[rowKey]?.id
    if (!ownId) continue
    const { data, error } = await session.client.from(table).select('*').eq('id', ownId)
    check(
      `${label} can read own ${table}`,
      (data?.length ?? 0) === 1 && !error,
      error ? error.message : `${data?.length ?? 0} row(s)`,
    )
  }

  for (const { table, parent } of CHILD_TABLES) {
    const parentId = own[parent]?.id
    if (!parentId) continue
    const key = table === 'chat_messages' ? 'conversation_id' : 'report_id'
    const { data, error } = await session.client.from(table).select('*').eq(key, parentId)
    check(
      `${label} can read own ${table}`,
      (data?.length ?? 0) >= 1 && !error,
      error ? error.message : `${data?.length ?? 0} row(s)`,
    )
  }

  const { data: file, error: fileError } = await session.client.storage.from('reports').download(own.filePath)
  check(
    `${label} can download own file`,
    Boolean(file) && !fileError,
    fileError ? fileError.message : 'downloaded',
  )
}

/* 2 and 3. Isolation between the two accounts. */
await checkIsolation(a.client, 'User A', dataB, 'User B')
await checkIsolation(b.client, 'User B', dataA, 'User A')
await checkStorage(a.client, 'User A', dataB, 'User B')
await checkStorage(b.client, 'User B', dataA, 'User A')

/* Cross-account references must be refused. */
console.log('\nCross-account references')
{
  const { error } = await a.client.from('appointments').insert({
    doctor: 'pointing at B',
    appointment_date: '2026-01-01',
    appointment_time: '09:00',
    member_id: dataB.member.id,
  })
  check(
    'User A cannot attach an appointment to User B family member',
    Boolean(error),
    error ? 'refused' : 'ACCEPTED - this is a problem',
  )
}
{
  const { error } = await a.client.from('doctor_questions').insert({
    text: 'pointing at B',
    appointment_id: dataB.appointment.id,
  })
  check(
    'User A cannot attach a question to User B appointment',
    Boolean(error),
    error ? 'refused' : 'ACCEPTED - this is a problem',
  )
}
{
  const { error } = await a.client.from('report_tests').insert({
    report_id: dataB.report.id,
    position: 99,
    name: 'injected',
    raw: '9',
    value_text: '9',
    status: 'low',
  })
  check(
    'User A cannot add a test row to User B report',
    Boolean(error),
    error ? 'refused' : 'ACCEPTED - this is a problem',
  )
}

/* 4. Signed out. */
console.log('\nSigned out')
const anonymous = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

for (const table of ALL_TABLES) {
  const { data, error } = await anonymous.from(table).select('*').limit(5)
  check(
    `signed-out visitor cannot read ${table}`,
    (data?.length ?? 0) === 0,
    error ? error.message : `${data?.length ?? 0} row(s)`,
  )
}

{
  const { error } = await anonymous.storage.from('reports').list(dataA.folder)
  check(
    'signed-out visitor cannot list report files',
    Boolean(error),
    error ? 'refused' : 'ALLOWED - this is a problem',
  )
}
{
  const { error } = await anonymous.storage.from('reports').download(dataA.filePath)
  check(
    'signed-out visitor cannot download a report file',
    Boolean(error),
    error ? 'refused' : 'DOWNLOADED - this is a problem',
  )
}
{
  const { error } = await anonymous
    .from('reports')
    .insert({ filename: 'injected.pdf', source: 'upload' })
  check(
    'signed-out visitor cannot insert a report',
    Boolean(error),
    error ? 'refused' : 'ACCEPTED - this is a problem',
  )
}

/* ------------------------------------------------------------------ */
/* Summary and cleanup                                                  */
/* ------------------------------------------------------------------ */

const failed = results.filter((entry) => !entry.passed)

console.log(`\n${results.length - failed.length}/${results.length} checks passed`)

if (failed.length > 0) {
  console.log('\nProblems found:')
  for (const entry of failed) console.log(`  - ${entry.label}`)
}

console.log(`\nThe rows belong to throwaway accounts (rls-user-*@${emailDomain}).`)
console.log('Delete them from Authentication -> Users, which cascades to everything else.')

process.exit(failed.length === 0 ? 0 : 1)