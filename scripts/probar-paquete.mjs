// Prueba el paquete TAL COMO SE PUBLICA (npm pack) en proyectos limpios:
//   Node ESM (import) y CJS (require) de cada punto de entrada · TypeScript en modo bundler, node16 ESM y node16 CJS ·
//   un build con Vite y otro con webpack.
// Requiere `npm run build`. Uso: npm run check:paquete
import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const raiz = resolve('.')
if (!existsSync(join(raiz, 'dist/nexus-dialogs.js'))) {
  console.error('No existe dist/: corre `npm run build` primero.')
  process.exit(1)
}
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' })
const paso = (nombre, fn) => {
  process.stdout.write(`• ${nombre} … `)
  fn()
  console.log('ok')
}

const dir = mkdtempSync(join(tmpdir(), 'nexus-dialogs-paquete-'))
const ENTRADAS = ['nexus-dialogs', 'nexus-dialogs/forms', 'nexus-dialogs/toast', 'nexus-dialogs/themes']

try {
  paso('npm pack', () => {
    const tgz = sh(`npm pack --silent --pack-destination ${JSON.stringify(dir)}`, raiz)
      .trim()
      .split('\n')
      .pop()
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'consumidor', private: true, type: 'module', dependencies: { 'nexus-dialogs': `file:./${tgz}` } }, null, 2),
    )
  })

  paso('instalar typescript, vite y webpack', () => {
    sh('npm i --no-audit --no-fund --silent typescript@5 vite webpack webpack-cli', dir)
  })

  paso('Node ESM: import de cada entrada (más /all)', () => {
    const codigo = [...ENTRADAS, 'nexus-dialogs/all']
      .map(
        (e, i) =>
          `const m${i} = await import('${e}'); if (!Object.keys(m${i}).length && '${e}' !== 'nexus-dialogs/all') throw new Error('${e} vacío')`,
      )
      .join('\n')
    writeFileSync(join(dir, 'esm.mjs'), codigo + "\nconsole.log('esm')\n")
    sh('node esm.mjs', dir)
  })

  paso('Node CJS: require de cada entrada', () => {
    const codigo = ENTRADAS.map((e) => `if (!Object.keys(require('${e}')).length) throw new Error('${e} vacío')`).join('\n')
    writeFileSync(join(dir, 'cjs.cjs'), codigo + "\nconsole.log('cjs')\n")
    sh('node cjs.cjs', dir)
  })

  const usoTs = `
import { dialog, configure, type DialogResult, type ButtonSpec, type CloseReason } from 'nexus-dialogs'
import { form, wizard, type Field } from 'nexus-dialogs/forms'
import { toast, type ToastOptions } from 'nexus-dialogs/toast'
import { themes, fromBootstrap } from 'nexus-dialogs/themes'
configure({ lang: 'es', theme: themes.bootstrap, scheme: 'auto' })
const botones: ButtonSpec[] = [{ id: 'ok', role: 'confirm', text: 'Guardar', variant: 'primary' }]
const campos: Field[] = [{ name: 'rfc', label: 'RFC', type: 'rfc', required: true }]
async function uso() {
  const r: DialogResult<true> = await dialog.confirm({ title: '¿Eliminar?', danger: true, requireText: 'X', buttons: botones })
  const razon: CloseReason = r.reason
  const f = await form<{ rfc: string }>({ title: 'Proveedor', fields: campos })
  if (f.confirmed && f.value) f.value.rfc.toUpperCase()
  await wizard({ title: 'Alta', steps: [{ title: 'Uno', fields: campos }], review: true })
  const o: ToastOptions = { type: 'success', duration: 3000 }
  toast.success('Listo', o)
  void razon; void fromBootstrap
}
void uso
`
  const tsc = (archivo, opciones) => sh(`npx tsc --noEmit --strict --skipLibCheck false --lib es2020,dom ${opciones} ${archivo}`, dir)

  paso('TypeScript, moduleResolution bundler', () => {
    writeFileSync(join(dir, 'bundler.ts'), usoTs)
    tsc('bundler.ts', '--module esnext --moduleResolution bundler')
  })

  paso('TypeScript, node16 ESM', () => {
    writeFileSync(join(dir, 'node16.mts'), usoTs)
    tsc('node16.mts', '--module node16 --moduleResolution node16')
  })

  paso('TypeScript, node16 CJS (require)', () => {
    writeFileSync(join(dir, 'node16.cts'), usoTs)
    tsc('node16.cts', '--module node16 --moduleResolution node16')
  })

  const app = `
import { dialog, configure } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'
import { themes } from 'nexus-dialogs/themes'
configure({ theme: themes.tailwind })
window.abrir = () => dialog.confirm('¿Seguro?').then(() => form({ title: 'X', fields: [{ name: 'a', label: 'A' }] }))
window.avisar = () => toast.success('Hola')
`
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'src/main.js'), app)

  paso('build con Vite', () => {
    writeFileSync(join(dir, 'index.html'), '<!doctype html><script type="module" src="/src/main.js"></script>')
    sh('npx vite build --logLevel error', dir)
    if (!readdirSync(join(dir, 'dist/assets')).some((f) => f.endsWith('.js'))) throw new Error('Vite no generó JS')
  })

  paso('build con webpack 5', () => {
    sh('npx webpack --mode production --entry ./src/main.js --output-path ./dist-webpack --no-stats', dir)
    if (!existsSync(join(dir, 'dist-webpack/main.js'))) throw new Error('webpack no generó main.js')
  })

  console.log('\n✓ El paquete funciona en Node (ESM y CJS), TypeScript (bundler y node16) y con Vite y webpack.')
} finally {
  if (!process.env.CONSERVAR) rmSync(dir, { recursive: true, force: true })
}
