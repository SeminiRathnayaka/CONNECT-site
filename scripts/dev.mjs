/**
 * Starts the React site and the Python AI backend together with one command:
 *
 *   npm run dev
 *
 * No extra npm dependency is needed — this script spawns both processes,
 * prefixes their output, and shuts both down cleanly on Ctrl+C.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const isWindows = process.platform === 'win32'

const COLOURS = { web: '[36m', ai: '[35m', reset: '[0m' }
const children = []

function resolvePython() {
  const candidates = isWindows
    ? [join(root, '.venv', 'Scripts', 'python.exe')]
    : [join(root, '.venv', 'bin', 'python'), join(root, '.venv', 'bin', 'python3')]
  return candidates.find((path) => existsSync(path))
}

function resolveVite() {
  // Run Vite's JS entry point through the same Node binary rather than the
  // .cmd shim, so no shell is involved on any platform.
  const entry = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  return existsSync(entry) ? entry : null
}

function prefix(name, stream, target) {
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      target.write(`${COLOURS[name]}[${name}]${COLOURS.reset} ${line}\n`)
    }
  })
  stream.on('end', () => {
    if (buffer) target.write(`${COLOURS[name]}[${name}]${COLOURS.reset} ${buffer}\n`)
  })
}

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
  })
  prefix(name, child.stdout, process.stdout)
  prefix(name, child.stderr, process.stderr)
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.stderr.write(`${COLOURS[name]}[${name}]${COLOURS.reset} exited with code ${code}\n`)
    }
    shutdown()
  })
  children.push(child)
  return child
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  children.length = 0
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const python = resolvePython()
if (!python) {
  process.stderr.write(
    'No Python virtual environment found at .venv\n' +
      'Run "npm run setup" once to create it and install the AI backend.\n',
  )
  process.exit(1)
}

const vite = resolveVite()
if (!vite) {
  process.stderr.write('node_modules is missing. Run "npm install" first.\n')
  process.exit(1)
}

start('ai', python, ['-m', 'app.server'], { cwd: join(root, 'ai') })
start('web', process.execPath, [vite, '--host', '127.0.0.1', '--port', '5173'])