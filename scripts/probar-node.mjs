// Humo por versión de Node: importa (ESM) y requiere (CJS) cada punto de entrada de `exports` ya construido en dist/
// y comprueba que, sin DOM, importar no lanza y abrir un diálogo falla con un error explícito.
// No instala nada ni compila: corre con la versión de Node que lo invoque (CI lo repite en la matriz de Node).
// Requiere `npm run build`. Uso: node scripts/probar-node.mjs
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'

if (!existsSync('dist/nexus-dialogs.js')) {
  console.error('No existe dist/: corre `npm run build` primero.')
  process.exit(1)
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const requerir = createRequire(import.meta.url)
let n = 0
const fallos = []

for (const [ruta, cond] of Object.entries(pkg.exports)) {
  if (ruta === './package.json' || typeof cond !== 'object') continue
  const nombre = ruta === '.' ? pkg.name : `${pkg.name}/${ruta.slice(2)}`
  try {
    // Las envolturas de Vue, React y Angular dependen de su framework, que aquí es opcional: se prueban con sus versiones en CI.
    const peer = ['vue', 'react', 'angular'].includes(ruta.slice(2))
    if (peer) continue
    const esm = await import(nombre)
    if (!Object.keys(esm).length) throw new Error('ESM vacío')
    if (cond.require) if (!Object.keys(requerir(nombre)).length) throw new Error('CJS vacío')
    n++
  } catch (e) {
    fallos.push(`${nombre}: ${e instanceof Error ? e.message : e}`)
  }
}

try {
  const { dialog } = await import(pkg.name)
  await dialog.confirm({ title: 'x' })
  fallos.push('sin DOM, abrir un diálogo no falló')
} catch (e) {
  if (!/DOM|document|navegador|browser/i.test(String(e instanceof Error ? e.message : e))) fallos.push(`error sin DOM poco claro: ${e}`)
}

if (fallos.length) {
  console.error(`✗ Node ${process.version}\n  ${fallos.join('\n  ')}`)
  process.exit(1)
}
console.log(`✓ Node ${process.version}: ${n} entradas en ESM y CJS, y sin DOM falla con un error claro`)
