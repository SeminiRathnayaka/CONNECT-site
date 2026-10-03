/**
 * One-time setup for the AI backend:
 *
 *   npm run setup
 *
 * Creates the Python virtual environment at .venv and installs everything in
 * ai/requirements.txt. Safe to run more than once.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const isWindows = process.platform === 'win32'
const venvDir = join(root, '.venv')
const python = isWindows
  ? join(venvDir, 'Scripts', 'python.exe')
  : join(venvDir, 'bin', 'python')

function run(command, args, cwd = root) {
  console.log(`\n> ${command} ${args.join(' ')}`)
  // shell:false avoids Node's DEP0190 warning about unescaped args. Node still
  // resolves executables such as python.exe through PATH on Windows.
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false })
  if (result.status !== 0) {
    console.error('\nSetup failed. Check the error above.')
    process.exit(result.status ?? 1)
  }
}

if (!existsSync(python)) {
  run('python', ['-m', 'venv', venvDir])
} else {
  console.log('.venv already exists — skipping creation.')
}

run(python, ['-m', 'pip', 'install', '--upgrade', 'pip'])
run(python, ['-m', 'pip', 'install', '-r', join(root, 'ai', 'requirements.txt')])

// Checked here because the AI service needs these to start at all.
if (!existsSync(join(root, 'ai', '.env'))) {
  console.log('\nNote: ai/.env was not found. Copy ai/.env.example to ai/.env and add your')
  console.log('GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY and optionally')
  console.log('SUPABASE_JWT_SECRET, then run npm run setup again.')
  process.exit(1)
}

// The AI service stores nothing itself, so there is no database step any more.
// Accounts and reports live in Supabase, created from supabase/schema.sql.
console.log('\nSetup complete. Start everything with: npm run dev')