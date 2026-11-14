// Límites de tamaño de cada archivo publicado, medidos minificado + gzip: lo que descarga el usuario final
// (el build ESM de Vite conserva los espacios; el bundler de cada app lo minifica). Requiere `npm run build`.
// Uso: npm run size                          (falla si algún archivo pasa su límite)
//      node scripts/tamano.mjs --base <dir>  (además compara contra otra compilación, p. ej. la de main)
import { gzipSync } from 'node:zlib'
import { readFileSync, existsSync, appendFileSync } from 'node:fs'
import { transformSync } from 'esbuild'

const LIMITES = {
  // Sin tope: el núcleo crece con cada corrección de estilos; se sigue midiendo y el CI muestra cuánto cambia contra main.
  'nexus-dialogs': Infinity,
  // Sin tope (Infinity): el paquete completo y los temas crecen con el modo oscuro de Tailwind y Bootstrap; se siguen midiendo y
  // el CI muestra cuánto cambian contra main, pero no fallan por tamaño.
  'nexus-dialogs.all': Infinity,
  forms: 25.5,
  toast: 6.8,
  themes: Infinity,
  patterns: 7,
  mx: 1.3,
  vue: 1,
  react: 1.2,
  angular: 1.3,
  swal: 8,
  'nexus-dialogs.swal.iife': 18.5,
  import: 10.5,
  table: 4,
  tabs: 3.5,
  timeline: 3,
  locales: 2,
  sepomex: 0.8,
  rrhh: 4.5,
}

if (!existsSync('dist/nexus-dialogs.js')) {
  console.error('No existe dist/: corre `npm run build` primero.')
  process.exit(1)
}

const i = process.argv.indexOf('--base')
const base = i > 0 ? process.argv[i + 1] : null
const gz = (ruta) => {
  if (!existsSync(ruta)) return null
  const min = transformSync(readFileSync(ruta, 'utf8'), { minify: true, format: 'esm' }).code
  return gzipSync(min).length / 1024
}

let fallos = 0
const filas = []
for (const [archivo, max] of Object.entries(LIMITES)) {
  const kb = gz(`dist/${archivo}.js`)
  const ok = kb < max
  const tope = Number.isFinite(max) ? `${max} KB` : 'sin tope'
  if (!ok) fallos++
  let cambio = ''
  if (base) {
    const antes = gz(`${base}/dist/${archivo}.js`)
    const d = antes === null ? null : Math.round((kb - antes) * 1024)
    cambio = d === null ? 'nuevo' : `${d > 0 ? '+' : ''}${d} B`
  }
  filas.push(`| ${archivo}.js | ${kb.toFixed(2)} KB | ${base ? `${cambio} | ` : ''}${max} KB | ${ok ? '✅' : '❌'} |`)
  console.log(`${ok ? '✓' : '✗'} ${archivo}.js  ${kb.toFixed(2)} KB min+gzip${base ? ` (${cambio} vs base)` : ''} (límite ${tope})`)
}

// En GitHub Actions deja la tabla en el resumen del job.
if (process.env.GITHUB_STEP_SUMMARY) {
  const cabecera = base
    ? ['| Archivo | Tamaño | Cambio vs base | Límite | |', '|---|---|---|---|---|']
    : ['| Archivo | Tamaño | Límite | |', '|---|---|---|---|']
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['### Tamaño (minificado + gzip)', '', ...cabecera, ...filas, ''].join('\n'))
}
process.exit(fallos ? 1 : 0)
