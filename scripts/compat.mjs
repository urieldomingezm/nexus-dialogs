// Matriz de compatibilidad: una sola fuente (compat/matriz.json) de la que salen
//   · las tablas de docs/soporte.md (entre <!-- compat:inicio --> y <!-- compat:fin -->),
//   · la matriz del job «Compatibilidad» de CI (--ci), que instala cada versión y corre sus pruebas,
//   · y las comprobaciones de que package.json (engines y peerDependencies) y el README dicen lo mismo (--check).
// Uso: npm run compat            reescribe las tablas de docs/soporte.md
//      npm run compat:check      falla si algo no coincide (corre en CI)
//      node scripts/compat.mjs --ci   imprime la matriz de CI en JSON
import { readFileSync, writeFileSync } from 'node:fs'

const leer = (p) => readFileSync(p, 'utf8')
const m = JSON.parse(leer('compat/matriz.json'))
const pkg = JSON.parse(leer('package.json'))
const INI = '<!-- compat:inicio -->'
const FIN = '<!-- compat:fin -->'

function tablas() {
  const nav = m.navegadores
  const filas = (cab, f) =>
    [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...f.map((x) => `| ${x.join(' | ')} |`)].join('\n')
  const motores = Object.entries(nav.minimos).map(([n, v]) => [n, `${v}`, nav.motores.find((x) => x.para === n)?.motor ?? '—'])
  const fw = m.frameworks.map((f) => [
    `${f.nombre} (\`${f.entrada}\`)`,
    `${f.minimo} o más${f.nota ? `. ${f.nota}` : ''}`,
    f.versiones.map((v) => v.etiqueta).join(', '),
  ])
  return [
    `**Qué se ejecuta en CI (matriz de compatibilidad).** Las filas salen de [\`compat/matriz.json\`](https://github.com/urieldomingezm/nexus-dialogs/blob/main/compat/matriz.json): CI instala cada versión indicada y corre las pruebas de su envoltura, así que lo que dice «ejecuta» es lo que de verdad se ejecuta. \`npm run compat:check\` falla si esta tabla, \`package.json\` o el README no coinciden con ese archivo.`,
    '',
    '#### Navegadores',
    '',
    filas(['Navegador', 'Mínimo', 'Motor que CI ejecuta (e2e)'], motores),
    '',
    nav.nota,
    '',
    '#### Frameworks',
    '',
    filas(['Framework', 'Mínimo declarado', 'Versiones que CI ejecuta'], fw),
    '',
    '#### Node',
    '',
    filas(['Mínimo', 'Versiones que CI ejecuta', 'Qué se comprueba'], [[`${m.node.minimo}`, m.node.probado.join(', '), m.node.nota]]),
  ].join('\n')
}

const entrada = (id) => m.frameworks.find((f) => f.id === id)
const fallos = []
function validar() {
  if (pkg.engines?.node !== `>=${m.node.minimo}`)
    fallos.push(`package.json engines.node es «${pkg.engines?.node}», la matriz dice >=${m.node.minimo}`)
  const dev = { vue: 'vue', react: 'react', angular: '@angular/core' }
  for (const [id, nombre] of Object.entries(dev)) {
    if (pkg.peerDependencies?.[nombre] !== `>=${entrada(id).minimo}`)
      fallos.push(`peerDependencies.${nombre} es «${pkg.peerDependencies?.[nombre]}», la matriz dice >=${entrada(id).minimo}`)
    if (!entrada(id).versiones[0].etiqueta.includes('mínimo')) fallos.push(`${id}: la primera versión probada debe ser el mínimo`)
  }
  if (!m.node.probado.includes(m.node.minimo)) fallos.push('Node: el mínimo debe estar entre las versiones probadas')
  const md = leer('docs/soporte.md')
  const hay = md.includes(INI) && md.includes(FIN)
  if (!hay) fallos.push('docs/soporte.md no tiene los marcadores compat:inicio / compat:fin')
  else if (md.slice(md.indexOf(INI) + INI.length, md.indexOf(FIN)).trim() !== tablas().trim())
    fallos.push('docs/soporte.md no está al día con compat/matriz.json: corre `npm run compat`')
  const nav = m.navegadores.minimos
  const rd = leer('README.md')
  const esperado = `Chrome/Edge ${nav['Chrome y Edge']}+, Firefox ${nav.Firefox}+, Safari ${nav.Safari}+`
  if (!rd.includes(esperado)) fallos.push(`README: debe decir «${esperado}»`)
  const sp = leer('docs/soporte.md')
  const esperadoDoc = `Chrome y Edge ${nav['Chrome y Edge']}, Firefox ${nav.Firefox}, Safari ${nav.Safari}`
  if (!sp.includes(esperadoDoc)) fallos.push(`docs/soporte.md: «Mínimos de la librería» debe decir «${esperadoDoc}»`)
}

const arg = process.argv[2]
if (arg === '--ci') {
  const include = m.frameworks.flatMap((f) =>
    f.versiones.map((v) => ({ nombre: `${f.nombre} ${v.etiqueta}`, paquetes: v.paquetes.join(' '), pruebas: f.pruebas.join(' ') })),
  )
  console.log(JSON.stringify({ include }))
} else if (arg === '--node') {
  console.log(JSON.stringify(m.node.probado))
} else if (arg === '--check') {
  validar()
  if (fallos.length) {
    console.error(`✗ Matriz de compatibilidad\n  ${fallos.join('\n  ')}`)
    process.exit(1)
  }
  console.log('✓ La matriz de compatibilidad coincide con package.json, el README y docs/soporte.md')
} else {
  const md = leer('docs/soporte.md')
  if (!md.includes(INI)) {
    console.error('Faltan los marcadores en docs/soporte.md')
    process.exit(1)
  }
  writeFileSync('docs/soporte.md', `${md.slice(0, md.indexOf(INI) + INI.length)}\n${tablas()}\n${md.slice(md.indexOf(FIN))}`)
  console.log('docs/soporte.md actualizado')
}
