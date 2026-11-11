#!/usr/bin/env node
// Convierte el catálogo oficial de SEPOMEX (CPdescarga.txt) en archivos por prefijo para sepomexLookup().
//   npx nexus-dialogs-sepomex CPdescarga.txt public/cp
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSepomexShards } from '../dist/sepomex.js'

const [entrada, salida = 'cp'] = process.argv.slice(2)
if (!entrada || entrada === '-h' || entrada === '--help') {
  console.log(
    'Uso: nexus-dialogs-sepomex <CPdescarga.txt> [carpeta de salida]\n\nDescarga el TXT en correosdemexico.gob.mx («Descarga tu código postal»).',
  )
  process.exit(entrada ? 0 : 1)
}
const buf = readFileSync(entrada)
// SEPOMEX publica el TXT en Latin-1; si viene en UTF-8, también funciona.
let texto
try {
  texto = new TextDecoder('utf-8', { fatal: true }).decode(buf)
} catch {
  texto = new TextDecoder('latin1').decode(buf)
}
const shards = buildSepomexShards(texto)
mkdirSync(salida, { recursive: true })
let cps = 0
let bytes = 0
for (const [prefijo, datos] of Object.entries(shards)) {
  const json = JSON.stringify(datos)
  writeFileSync(join(salida, `${prefijo}.json`), json)
  cps += Object.keys(datos).length
  bytes += json.length
}
if (!cps) {
  console.error('No se encontraron códigos postales. ¿Es el archivo TXT de SEPOMEX (separado por |)?')
  process.exit(1)
}
writeFileSync(
  join(salida, 'info.json'),
  JSON.stringify({ generated: new Date().toISOString(), postalCodes: cps, files: Object.keys(shards).length }),
)
console.log(
  `✓ ${cps.toLocaleString('es-MX')} códigos postales en ${Object.keys(shards).length} archivos (${(bytes / 1024 / 1024).toFixed(1)} MB) → ${salida}/`,
)
