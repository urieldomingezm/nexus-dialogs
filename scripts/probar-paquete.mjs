// Prueba el paquete TAL COMO SE PUBLICA (npm pack) en proyectos limpios:
//   Node ESM (import) y CJS (require) de cada punto de entrada · TypeScript en modo bundler, node16 ESM y node16 CJS ·
//   un build con Vite y otro con webpack.
// Requiere `npm run build`. Uso: npm run check:paquete
import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
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
const ENTRADAS = [
  'nexus-dialogs',
  'nexus-dialogs/forms',
  'nexus-dialogs/toast',
  'nexus-dialogs/themes',
  'nexus-dialogs/patterns',
  'nexus-dialogs/mx',
  'nexus-dialogs/react',
  'nexus-dialogs/angular',
  'nexus-dialogs/import',
  'nexus-dialogs/table',
  'nexus-dialogs/tabs',
  'nexus-dialogs/timeline',
  'nexus-dialogs/locales',
  'nexus-dialogs/sepomex',
  'nexus-dialogs/rrhh',
]

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

  paso('instalar vue, react, angular, typescript, vite y webpack', () => {
    sh('npm i --no-audit --no-fund --silent vue react @types/react @angular/core rxjs typescript@5 vite webpack webpack-cli', dir)
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
    // angular es solo ESM (@angular/core no tiene versión CommonJS).
    const codigo = ENTRADAS.filter((e) => !e.endsWith('/angular'))
      .map((e) => `if (!Object.keys(require('${e}')).length) throw new Error('${e} vacío')`)
      .join('\n')
    writeFileSync(join(dir, 'cjs.cjs'), codigo + "\nconsole.log('cjs')\n")
    sh('node cjs.cjs', dir)
  })

  const usoTs = `
import { dialog, configure, type DialogResult, type ButtonSpec, type CloseReason } from 'nexus-dialogs'
import { form, wizard, formFromJSON, type Field } from 'nexus-dialogs/forms'
import { toast, type ToastOptions } from 'nexus-dialogs/toast'
import { themes, fromBootstrap } from 'nexus-dialogs/themes'
import { confirmDelete, bulkAction, type ApprovalResult } from 'nexus-dialogs/patterns'
import { isCLABE, businessDays, mexicanHolidays } from 'nexus-dialogs/mx'
import Swal, { type SweetAlertResult } from 'nexus-dialogs/swal'
import { useDialog, NexusDialogs } from 'nexus-dialogs/vue'
import { useDialog as useDialogReact, useForm, NexusDialogsProvider } from 'nexus-dialogs/react'
import { injectDialog, injectForm, provideNexusDialogs } from 'nexus-dialogs/angular'
import { importData, parseCSV, exportData, type ImportColumn } from 'nexus-dialogs/import'
import { pickRows } from 'nexus-dialogs/table'
import { tabs, tabsDialog, type TabSpec } from 'nexus-dialogs/tabs'
import { timeline, timelineDialog, type TimelineStep } from 'nexus-dialogs/timeline'
import { sepomexLookup } from 'nexus-dialogs/sepomex'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'
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
  if (await confirmDelete({ what: 'el periodo', name: 'Q21', requireName: true })) isCLABE('002010077777777771')
  const b = await bulkAction({ title: 'Mover', items: [{ n: 'Ana' }], label: (e) => e.n, run: async () => {} })
  b.failed.map((x) => x.item.n)
  const a: ApprovalResult | null = null; void a
  const s: SweetAlertResult = await Swal.fire({ title: 'X', icon: 'warning', showCancelButton: true }); void s.isConfirmed
  const d = useDialog(); await d.scoped(confirmDelete)({ what: 'x' }); void NexusDialogs
  const rd = useDialogReact(); const rf = useForm(); const abierto: boolean = rd.isOpen; void abierto; void rf.wizard; void NexusDialogsProvider
  void provideNexusDialogs; void injectForm; const ini: () => boolean = () => injectDialog().isOpen()
  const cols: ImportColumn[] = [{ name: 'rfc', label: 'RFC', type: 'rfc', unique: true }]
  const im = await importData<{ rfc: string }>({ columns: cols })
  if (im.value) im.value.rows.map((x) => x.rfc)
  parseCSV('a,b')
  const pk = await pickRows<{ id: string; nombre: string }>({ rows: [{ id: '1', nombre: 'Ana' }], columns: [{ key: 'nombre', label: 'Nombre' }] })
  pk.value?.map((x) => x.nombre)
  const pestanas: TabSpec[] = [{ id: 'a', label: 'A', content: 'x' }, { id: 'b', label: 'B', badge: 2, content: async () => document.createElement('p') }]
  await tabsDialog({ title: 'Detalle', tabs: pestanas, variant: 'segmented' }); void tabs({ tabs: pestanas }).current
  const etapas: TimelineStep[] = [{ id: 'cita', title: 'Cita', date: new Date(), status: 'current' }, { id: 'docs', title: 'Documentos', status: 'pending' }]
  await timelineDialog({ title: 'Seguimiento', steps: etapas, footnote: 'Nota' }); const avance: number = timeline({ steps: etapas }).progress().percent; void avance
  await formFromJSON(sinResolvers(plantillas.vacaciones))
  await exportData([{ a: 1 }], { columns: [{ key: 'a', label: 'A' }], format: 'csv' })
  void businessDays('2026-01-01', '2026-01-31'); void mexicanHolidays(2026)
  const cp = await sepomexLookup({ baseUrl: '/cp/' })('64000'); void cp?.neighborhoods
  await form({ title: 'Firma', fields: [{ name: 'f', label: 'Firma', type: 'signature' }, { name: 'r', label: 'Fechas', type: 'daterange', calendar: true }] })
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
    // Sin angular: solo ESM, un `require` no puede cargarlo.
    const sinAngular = usoTs
      .split('\n')
      .filter((l) => !/nexus-dialogs\/angular|provideNexusDialogs/.test(l))
      .join('\n')
    writeFileSync(join(dir, 'node16.cts'), sinAngular)
    tsc('node16.cts', '--module node16 --moduleResolution node16')
  })

  const app = `
import { dialog, configure } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'
import { themes } from 'nexus-dialogs/themes'
import Swal from 'nexus-dialogs/swal'
configure({ theme: themes.tailwind })
window.Swal = Swal
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

  // Tree-shaking: quien solo importa el núcleo no debe recibir formularios, toasts, swal ni importación.
  paso('tree-shaking: solo el núcleo (webpack)', () => {
    writeFileSync(
      join(dir, 'src/solo-nucleo.js'),
      "import { dialog } from 'nexus-dialogs'\nwindow.abrir = () => dialog.confirm('¿Seguro?')\n",
    )
    sh('npx webpack --mode production --entry ./src/solo-nucleo.js --output-path ./dist-nucleo --no-stats', dir)
    const js = readFileSync(join(dir, 'dist-nucleo/main.js'), 'utf8')
    const AJENOS = { forms: '.stepper', toast: 'data-nexus-toast', swal: 'swal-', importacion: 'imp-steps', rrhh: 'rrhh-alta' }
    for (const [modulo, marca] of Object.entries(AJENOS))
      if (js.includes(marca)) throw new Error(`solo-núcleo trae código de «${modulo}» (${marca}): el tree-shaking falló`)
    const kb = Buffer.byteLength(js) / 1024
    if (kb > 45) throw new Error(`solo-núcleo pesa ${kb.toFixed(1)} KB sin comprimir (máximo 45 KB)`)
    console.log(`   núcleo solo: ${kb.toFixed(1)} KB sin comprimir`)
  })

  console.log('\n✓ El paquete funciona en Node (ESM y CJS), TypeScript (bundler y node16) y con Vite y webpack.')
} finally {
  if (!process.env.CONSERVAR) rmSync(dir, { recursive: true, force: true })
}
