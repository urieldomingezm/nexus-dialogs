// Mediciones reproducibles: tamaños de cada archivo (minificado + gzip y brotli), lo que pesa usar solo una parte
// (tree-shaking) y tiempos reales en Chromium (abrir/cerrar diálogos, formularios, memoria).
//   npm run build && npm run bench                 → imprime las tablas
//   npm run bench -- --write                       → además reescribe docs/rendimiento.md (entre las marcas <!--bench-->)
//   npm run bench -- --json medicion.json          → guarda los números (para comparar después)
//   npm run bench -- --comparar medicion.json      → compara esta medición con una guardada (otra versión o rama)
//   PW_CHROMIUM=/ruta/a/chrome npm run bench       → usa un Chromium ya instalado
// Los tiempos dependen de la máquina: la página publicada dice dónde se midieron. Los tamaños no dependen de ella.
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform, release } from 'node:os'
import { build, transformSync } from 'esbuild'
import { chromium } from '@playwright/test'

if (!existsSync('dist/nexus-dialogs.js')) {
  console.error('No existe dist/: corre `npm run build` primero.')
  process.exit(1)
}
const kb = (n) => (n / 1024).toFixed(2)
const min = (codigo) => transformSync(codigo, { minify: true, format: 'esm' }).code
const medir = (codigo) => {
  const m = min(codigo)
  return { gz: gzipSync(m).length, br: brotliCompressSync(m).length }
}

// ── Tamaños por archivo ─────────────────────────────────────────────────────
const ARCHIVOS = [
  'nexus-dialogs',
  'nexus-dialogs.all',
  'forms',
  'toast',
  'themes',
  'patterns',
  'mx',
  'swal',
  'import',
  'table',
  'rrhh',
  'sepomex',
  'vue',
  'react',
  'angular',
]
const numeros = { tamanos: {}, parcial: {}, tiempos: {}, memoriaKB: 0 }
const filasTam = ARCHIVOS.filter((a) => existsSync(`dist/${a}.js`)).map((a) => {
  const t = medir(readFileSync(`dist/${a}.js`, 'utf8'))
  numeros.tamanos[a] = t.gz
  return `| \`${a}.js\` | ${kb(t.gz)} KB | ${kb(t.br)} KB |`
})

// ── Tree-shaking: lo que pesa importar solo una parte, con el bundler de una app ─
const CASOS = [
  ['Solo `dialog` (alertas y confirmaciones)', `import { dialog } from './dist/nexus-dialogs.js'; dialog.alert({ title: 'x' })`],
  [
    '`dialog` + `form`',
    `import { dialog } from './dist/nexus-dialogs.js'; import { form } from './dist/forms.js'; dialog.alert({ title: 'x' }); form({ title: 'x', fields: [] })`,
  ],
  ['Solo validadores de México (`mx`)', `import { isRFC } from './dist/mx.js'; console.log(isRFC('x'))`],
]
const filasTree = []
for (const [nombre, entrada] of CASOS) {
  try {
    const r = await build({
      stdin: { contents: entrada, resolveDir: process.cwd(), loader: 'js' },
      bundle: true,
      minify: true,
      format: 'esm',
      write: false,
      treeShaking: true,
      logLevel: 'silent',
    })
    const codigo = r.outputFiles[0].text
    numeros.parcial[nombre] = gzipSync(codigo).length
    filasTree.push(`| ${nombre} | ${kb(gzipSync(codigo).length)} KB | ${kb(brotliCompressSync(codigo).length)} KB |`)
  } catch (e) {
    filasTree.push(`| ${nombre} | no medido (${String(e.message).split('\n')[0].slice(0, 60)}) | |`)
  }
}

// ── Tiempos en Chromium ────────────────────────────────────────────────────
const N = 200
const navegador = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pagina = await navegador.newPage()
await pagina.emulateMedia({ reducedMotion: 'reduce' })
await pagina.setContent('<!doctype html><html><body><p>bench</p></body></html>')
await pagina.addScriptTag({ path: 'dist/nexus-dialogs.all.iife.js' })
const cdp = await pagina.context().newCDPSession(pagina)
const heap = async () => {
  await cdp.send('HeapProfiler.collectGarbage')
  const { metrics } = await cdp.send('Performance.getMetrics')
  return metrics.find((m) => m.name === 'JSHeapUsedSize').value
}
await cdp.send('Performance.enable')
const medida = await pagina.evaluate(async (N) => {
  const nd = window.NexusDialogs
  const esperar = () => new Promise((r) => requestAnimationFrame(() => r()))
  const pct = (v, p) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor((v.length * p) / 100))]
  const cierra = (rol) =>
    document
      .querySelector('dialog[data-nexus-dialog]')
      ?.querySelector('[data-nexus-host]')
      ?.shadowRoot?.querySelector(`button[data-role=${rol}]`)
  const abrirCerrar = async (abrir) => {
    const t0 = performance.now()
    const p = abrir()
    while (!cierra('confirm') && !cierra('cancel')) await esperar()
    const dt = performance.now() - t0
    ;(cierra('confirm') ?? cierra('cancel')).click()
    await p
    return dt
  }
  const serie = async (abrir, n) => {
    const v = []
    for (let i = 0; i < n; i++) v.push(await abrirCerrar(abrir))
    return { mediana: pct(v, 50), p95: pct(v, 95) }
  }
  const alerta = () => nd.dialog.alert({ title: 'Guardado', text: 'El empleado ya aparece en la nómina.' })
  const campos = Array.from({ length: 20 }, (_, i) => ({ name: 'c' + i, label: 'Campo ' + i, type: 'text' }))
  const formulario = () => nd.form({ title: 'Alta', fields: campos })
  const primera = await abrirCerrar(alerta) // arranque en frío
  await serie(alerta, 20) // calentamiento
  return {
    primera,
    alerta: await serie(alerta, N),
    formulario: await serie(formulario, 50),
  }
}, N)
const antes = await heap()
const restantes = await pagina.evaluate(async (N) => {
  const nd = window.NexusDialogs
  for (let i = 0; i < N; i++) {
    const p = nd.dialog.alert({ title: 'x' })
    await new Promise((r) => requestAnimationFrame(r))
    document.querySelector('dialog[data-nexus-dialog] [data-nexus-host]')?.shadowRoot?.querySelector('button[data-role=confirm]')?.click()
    await p
  }
  return document.querySelectorAll('dialog[data-nexus-dialog]').length
}, N)
const despues = await heap()
const version = navegador.version()
await navegador.close()

const ms = (n) => `${n.toFixed(1)} ms`
const filasTiempo = [
  `| Primer diálogo (arranque en frío) | ${ms(medida.primera)} | — |`,
  `| \`dialog.alert\`, ${N} aperturas | ${ms(medida.alerta.mediana)} | ${ms(medida.alerta.p95)} |`,
  `| \`form\` de 20 campos, 50 aperturas | ${ms(medida.formulario.mediana)} | ${ms(medida.formulario.p95)} |`,
]
const entorno = `${cpus()[0]?.model.trim()} · ${platform()} ${release()} · Node ${process.version} · Chromium ${version}`
const fuga = (despues - antes) / 1024
numeros.tiempos = {
  'Primer diálogo (arranque en frío)': medida.primera,
  '`dialog.alert` (mediana)': medida.alerta.mediana,
  '`form` de 20 campos (mediana)': medida.formulario.mediana,
}
numeros.memoriaKB = fuga
const bloque = `<!--bench-->
**Entorno de esta medición:** ${entorno}.

### Tamaño de cada archivo

| Archivo | min + gzip | min + brotli |
|---|---|---|
${filasTam.join('\n')}

### Lo que pesa usar solo una parte (con un bundler)

| Caso | min + gzip | min + brotli |
|---|---|---|
${filasTree.join('\n')}

### Tiempos en Chromium (animaciones reducidas)

De la llamada a la función hasta que el diálogo está en pantalla con su botón listo.

| Escenario | Mediana | p95 |
|---|---|---|
${filasTiempo.join('\n')}

### Memoria

Tras ${N} aperturas y cierres de \`dialog.alert\` (con recolección de basura antes y después), el montón de JavaScript cambió **${fuga >= 0 ? '+' : ''}${fuga.toFixed(0)} KB** y quedaron **${restantes}** diálogos en el DOM.
<!--/bench-->`

console.log(bloque)
if (process.argv.includes('--write')) {
  const ruta = 'docs/rendimiento.md'
  const md = readFileSync(ruta, 'utf8')
  if (!md.includes('<!--bench-->')) throw new Error('docs/rendimiento.md no tiene las marcas <!--bench-->')
  writeFileSync(ruta, md.replace(/<!--bench-->[\s\S]*<!--\/bench-->/, bloque))
  console.log(`\nEscrito en ${ruta}`)
  // La página en inglés lleva el mismo bloque con los rótulos traducidos.
  const rutaEn = 'docs/en/rendimiento.md'
  if (existsSync(rutaEn)) {
    const en = bloque
      .replace('**Entorno de esta medición:**', '**Environment of this measurement:**')
      .replace('### Tamaño de cada archivo', '### Size of each file')
      .replace('| Archivo | min + gzip | min + brotli |', '| File | min + gzip | min + brotli |')
      .replace('### Lo que pesa usar solo una parte (con un bundler)', '### What using only a part weighs (with a bundler)')
      .replace('| Caso | min + gzip | min + brotli |', '| Case | min + gzip | min + brotli |')
      .replace('Solo `dialog` (alertas y confirmaciones)', 'Only `dialog` (alerts and confirmations)')
      .replace('Solo validadores de México (`mx`)', 'Only Mexican validators (`mx`)')
      .replace('### Tiempos en Chromium (animaciones reducidas)', '### Timings in Chromium (reduced animations)')
      .replace(
        'De la llamada a la función hasta que el diálogo está en pantalla con su botón listo.',
        'From the function call until the dialog is on screen with its button ready.',
      )
      .replace('| Escenario | Mediana | p95 |', '| Scenario | Median | p95 |')
      .replace('Primer diálogo (arranque en frío)', 'First dialog (cold start)')
      .replace(/`dialog.alert`, (\d+) aperturas/, '`dialog.alert`, $1 openings')
      .replace('`form` de 20 campos, 50 aperturas', '`form` with 20 fields, 50 openings')
      .replace('### Memoria', '### Memory')
      .replace(
        /Tras (\d+) aperturas y cierres de `dialog.alert` \(con recolección de basura antes y después\), el montón de JavaScript cambió \*\*([^*]+)\*\* y quedaron \*\*(\d+)\*\* diálogos en el DOM\./,
        'After $1 openings and closings of `dialog.alert` (with garbage collection before and after), the JavaScript heap changed **$2** and **$3** dialogs were left in the DOM.',
      )
    writeFileSync(rutaEn, readFileSync(rutaEn, 'utf8').replace(/<!--bench-->[\s\S]*<!--\/bench-->/, en))
    console.log(`Escrito en ${rutaEn}`)
  }
}

const arg = (nombre) => {
  const i = process.argv.indexOf(nombre)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const guardar = arg('--json')
if (guardar) {
  writeFileSync(guardar, JSON.stringify({ entorno, ...numeros }, null, 2) + '\n')
  console.log(`\nNúmeros guardados en ${guardar}`)
}

// ── Comparar con otra medición ─────────────────────────────────────────────
// Los tamaños no dependen de la máquina: un aumento de más de 3 % hace fallar el comando (exit 1). Los tiempos sí dependen
// de ella y solo se informan (compara mediciones hechas en la misma máquina).
const contra = arg('--comparar')
if (contra) {
  const base = JSON.parse(readFileSync(contra, 'utf8'))
  const cambio = (a, b) => (a ? ((b - a) / a) * 100 : 0)
  const fmt = (c) => `${c >= 0 ? '+' : ''}${c.toFixed(1)} %`
  let regresion = false
  const filas = []
  const comparar = (titulo, antes, ahora, unidad, vigila) => {
    for (const [k, v] of Object.entries(ahora)) {
      if (!(k in antes)) continue
      const c = cambio(antes[k], v)
      const mal = vigila && c > 3
      if (mal) regresion = true
      filas.push(`| ${titulo}: ${k} | ${unidad(antes[k])} | ${unidad(v)} | ${fmt(c)}${mal ? ' ⚠' : ''} |`)
    }
  }
  const enKB = (n) => `${kb(n)} KB`
  comparar('Archivo', base.tamanos ?? {}, numeros.tamanos, enKB, true)
  comparar('Parcial', base.parcial ?? {}, numeros.parcial, enKB, true)
  comparar('Tiempo', base.tiempos ?? {}, numeros.tiempos, ms, false)
  console.log(`\n### Comparación con ${contra}\n\n| Medida | Antes | Ahora | Cambio |\n|---|---|---|---|\n${filas.join('\n')}`)
  if (regresion) {
    console.error('\nHay archivos que crecieron más de 3 %. Optimiza el código; los límites de tamaño no se suben.')
    process.exitCode = 1
  }
}
