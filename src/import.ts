/**
 * Importar CSV o Excel (.xlsx) eligiendo qué columna va a cada campo. Para cargas masivas: empleados, incidencias, saldos.
 *
 * ```ts
 * import { importData } from 'nexus-dialogs/import'
 *
 * const r = await importData({
 *   title: 'Importar empleados',
 *   columns: [
 *     { name: 'numero', label: 'Número de empleado', required: true, unique: true },
 *     { name: 'nombre', label: 'Nombre completo', required: true, aliases: ['empleado', 'nombre'] },
 *     { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
 *     { name: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
 *     { name: 'salario', label: 'Salario diario', type: 'number' },
 *   ],
 *   onImport: (filas) => api.post('/empleados/lote', filas),
 * })
 * ```
 * Sin dependencias: el CSV se lee aquí mismo y el .xlsx se descomprime con `DecompressionStream` del navegador.
 */
import { INVALID, language, openDialog } from 'nexus-dialogs'
import type { ButtonSpec, DialogContext, DialogOptions, DialogResult } from 'nexus-dialogs'
import { h, svg, uid } from './core/dom'
import { isCLABE, isCURP, isNSS, isPostalCode, isRFC } from './mx'

// ── Textos ──────────────────────────────────────────────────────────────────
const ES = {
  title: 'Importar datos',
  step1: 'Elige el archivo',
  step2: 'Relaciona las columnas',
  step3: 'Revisa antes de importar',
  drop: 'Arrastra aquí tu archivo CSV o Excel, o',
  choose: 'Elegir archivo',
  template: 'Descargar plantilla',
  formats: 'CSV o Excel (.xlsx), hasta {0} filas',
  reading: 'Leyendo el archivo…',
  badFile: 'No se pudo leer el archivo. Guárdalo como CSV o .xlsx e inténtalo de nuevo.',
  empty: 'El archivo no tiene filas.',
  tooMany: 'El archivo tiene {0} filas; el máximo es {1}.',
  headers: 'La primera fila tiene los nombres de las columnas',
  field: 'Campo',
  column: 'Columna del archivo',
  example: 'Ejemplo',
  none: 'No importar',
  colN: 'Columna {0}',
  mapRequired: 'Elige una columna para: {0}.',
  ready: '{0} filas listas',
  withErrors: '{0} con errores',
  allOk: 'Todas las filas están bien.',
  errorsTitle: 'Filas con errores (no se importarán):',
  andMore: 'Y {0} más.',
  row: 'Fila {0}',
  required: 'falta',
  invalid: 'no es válido',
  duplicate: 'está repetido (fila {0})',
  importN: 'Importar {0} filas',
  import1: 'Importar 1 fila',
  next: 'Siguiente',
  back: 'Atrás',
  cancel: 'Cancelar',
  importing: 'Importando…',
  nothing: 'No hay filas válidas para importar.',
}
type Textos = typeof ES
const EN: Textos = {
  title: 'Import data',
  step1: 'Choose the file',
  step2: 'Match the columns',
  step3: 'Review before importing',
  drop: 'Drop your CSV or Excel file here, or',
  choose: 'Choose file',
  template: 'Download template',
  formats: 'CSV or Excel (.xlsx), up to {0} rows',
  reading: 'Reading the file…',
  badFile: 'The file could not be read. Save it as CSV or .xlsx and try again.',
  empty: 'The file has no rows.',
  tooMany: 'The file has {0} rows; the maximum is {1}.',
  headers: 'The first row has the column names',
  field: 'Field',
  column: 'File column',
  example: 'Example',
  none: 'Do not import',
  colN: 'Column {0}',
  mapRequired: 'Choose a column for: {0}.',
  ready: '{0} rows ready',
  withErrors: '{0} with errors',
  allOk: 'All rows look good.',
  errorsTitle: 'Rows with errors (they will not be imported):',
  andMore: 'And {0} more.',
  row: 'Row {0}',
  required: 'is missing',
  invalid: 'is not valid',
  duplicate: 'is repeated (row {0})',
  importN: 'Import {0} rows',
  import1: 'Import 1 row',
  next: 'Next',
  back: 'Back',
  cancel: 'Cancel',
  importing: 'Importing…',
  nothing: 'There are no valid rows to import.',
}
const T = (): Textos => (language() === 'es' ? ES : EN)
const f = (s: string, ...v: (string | number)[]) => s.replace(/\{(\d)\}/g, (_, i) => String(v[+i] ?? ''))
const plano = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

// ── CSV ─────────────────────────────────────────────────────────────────────

/** CSV a filas. Comillas, saltos de línea dentro de comillas y separador automático (coma, punto y coma o tabulador). */
export function parseCSV(texto: string, separador?: string): string[][] {
  const t = texto.replace(/^\uFEFF/, '')
  if (!separador) {
    const primera = t.slice(0, t.search(/\r?\n/) >>> 0 || t.length)
    const cuenta = (c: string) => primera.split(c).length
    separador = [',', ';', '\t'].sort((a, b) => cuenta(b) - cuenta(a))[0]
  }
  const filas: string[][] = []
  let fila: string[] = []
  let campo = ''
  let comillas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"' && campo === '') comillas = true
    else if (c === separador) {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      fila.push(campo)
      filas.push(fila)
      fila = []
      campo = ''
    } else campo += c
  }
  if (campo !== '' || fila.length) {
    fila.push(campo)
    filas.push(fila)
  }
  return filas.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Texto de un archivo: UTF-8, o Windows-1252 si no lo es (lo típico de un CSV guardado desde Excel en español). */
async function texto(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1252').decode(buf)
  }
}

// ── XLSX ────────────────────────────────────────────────────────────────────

/** Archivos dentro del .xlsx (es un zip). */
async function descomprimir(buf: ArrayBuffer, quiero: (nombre: string) => boolean): Promise<Map<string, string>> {
  const v = new DataView(buf)
  let fin = -1
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65_557); i--)
    if (v.getUint32(i, true) === 0x06054b50) {
      fin = i
      break
    }
  if (fin < 0) throw new Error('zip')
  const n = v.getUint16(fin + 10, true)
  let p = v.getUint32(fin + 16, true)
  const dec = new TextDecoder()
  const salida = new Map<string, string>()
  for (let k = 0; k < n; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zip')
    const metodo = v.getUint16(p + 10, true)
    const tam = v.getUint32(p + 20, true)
    const ln = v.getUint16(p + 28, true)
    const le = v.getUint16(p + 30, true)
    const lc = v.getUint16(p + 32, true)
    const local = v.getUint32(p + 42, true)
    const nombre = dec.decode(new Uint8Array(buf, p + 46, ln))
    p += 46 + ln + le + lc
    if (!quiero(nombre)) continue
    const ini = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true)
    const datos = new Uint8Array(buf, ini, tam)
    if (metodo === 0) salida.set(nombre, dec.decode(datos))
    else if (metodo === 8) {
      const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      salida.set(nombre, dec.decode(await new Response(flujo).arrayBuffer()))
    }
  }
  return salida
}

const FECHAS_INTEGRADAS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47])
const columna = (ref: string) => {
  let n = 0
  for (const c of ref.replace(/\d+/g, '')) n = n * 26 + c.charCodeAt(0) - 64
  return n - 1
}
/** Número de serie de Excel → ISO (AAAA-MM-DD). */
export function excelDate(serie: number): string {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serie * 86_400_000))
  return d.toISOString().slice(0, 10)
}

/** Primera hoja de un .xlsx como filas de texto. Las celdas con formato de fecha salen como AAAA-MM-DD. */
export async function readXLSX(file: Blob): Promise<string[][]> {
  const xml = (s?: string) => new DOMParser().parseFromString(s ?? '<x/>', 'application/xml')
  const zip = await descomprimir(await file.arrayBuffer(), (n) => n.startsWith('xl/') && /\.(xml|rels)$/.test(n) && !n.includes('/theme/'))
  // Primera hoja según el libro (no siempre es sheet1.xml).
  let hoja = 'xl/worksheets/sheet1.xml'
  const rid = xml(zip.get('xl/workbook.xml')).getElementsByTagName('sheet')[0]
  const relId =
    rid?.getAttribute('r:id') ?? rid?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
  for (const r of Array.from(xml(zip.get('xl/_rels/workbook.xml.rels')).getElementsByTagName('Relationship')))
    if (r.getAttribute('Id') === relId) hoja = 'xl/' + (r.getAttribute('Target') ?? '').replace(/^\/?xl\//, '')
  if (!zip.has(hoja)) hoja = [...zip.keys()].find((n) => n.startsWith('xl/worksheets/') && n.endsWith('.xml')) ?? hoja
  const compartidos = Array.from(xml(zip.get('xl/sharedStrings.xml')).getElementsByTagName('si')).map((si) =>
    Array.from(si.getElementsByTagName('t'))
      .filter((t) => t.parentElement?.tagName !== 'rPh')
      .map((t) => t.textContent)
      .join(''),
  )
  // Estilos con formato de fecha.
  const estilos = xml(zip.get('xl/styles.xml'))
  const propios = new Set(
    Array.from(estilos.getElementsByTagName('numFmt'))
      .filter((n) => /[dmy]/i.test((n.getAttribute('formatCode') ?? '').replace(/"[^"]*"|\[[^\]]*\]/g, '')))
      .map((n) => Number(n.getAttribute('numFmtId'))),
  )
  const xfs = estilos.getElementsByTagName('cellXfs')[0]
  const esFecha = Array.from(xfs?.getElementsByTagName('xf') ?? []).map((x) => {
    const id = Number(x.getAttribute('numFmtId'))
    return FECHAS_INTEGRADAS.has(id) || propios.has(id)
  })
  const filas: string[][] = []
  for (const r of Array.from(xml(zip.get(hoja)).getElementsByTagName('row'))) {
    const fila: string[] = []
    for (const c of Array.from(r.getElementsByTagName('c'))) {
      const tipo = c.getAttribute('t')
      const v = c.getElementsByTagName('v')[0]?.textContent ?? ''
      let valor: string
      if (tipo === 's') valor = compartidos[Number(v)] ?? ''
      else if (tipo === 'inlineStr') valor = c.getElementsByTagName('t')[0]?.textContent ?? ''
      else if (tipo === 'b') valor = v === '1' ? 'TRUE' : 'FALSE'
      else if (!tipo || tipo === 'n') valor = v !== '' && esFecha[Number(c.getAttribute('s') ?? 0)] ? excelDate(Number(v)) : v
      else valor = v
      const ref = c.getAttribute('r')
      const i = ref ? columna(ref) : fila.length
      while (fila.length < i) fila.push('')
      fila[i] = valor
    }
    filas.push(fila)
  }
  return filas.filter((r) => r.some((c) => c.trim() !== ''))
}

/** CSV, TXT o .xlsx → filas de texto. */
export async function readSpreadsheet(file: File | Blob): Promise<string[][]> {
  const cabeza = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (cabeza[0] === 0x50 && cabeza[1] === 0x4b) return readXLSX(file)
  return parseCSV(await texto(file))
}

// ── Conversión y validación ─────────────────────────────────────────────────

export type ImportType = 'text' | 'number' | 'date' | 'boolean' | 'email' | 'rfc' | 'curp' | 'nss' | 'clabe' | 'postal'

export interface ImportColumn {
  /** Clave en cada fila importada. */
  name: string
  label: string
  type?: ImportType
  required?: boolean
  /** No puede repetirse entre filas (número de empleado, RFC, CURP). */
  unique?: boolean
  /** Otros nombres con los que suele venir la columna, para relacionarla sola: ['empleado', 'nombre completo']. */
  aliases?: string[]
  /** Validación propia: devuelve el mensaje de error. */
  validate?: (value: any, row: Record<string, unknown>) => string | null | undefined | void
}

const SI = new Set(['si', 'sí', 'yes', 'true', 'verdadero', '1', 'x', 'v'])
const NO = new Set(['no', 'false', 'falso', '0', 'f', ''])
const MX: Partial<Record<ImportType, (v: string) => boolean>> = {
  rfc: isRFC,
  curp: isCURP,
  nss: isNSS,
  clabe: isCLABE,
  postal: isPostalCode,
}

/** Convierte el texto de una celda al tipo de la columna. undefined = no es válido. */
export function convert(raw: string, tipo: ImportType = 'text'): unknown {
  const s = raw.trim()
  if (s === '') return tipo === 'boolean' ? false : null
  switch (tipo) {
    case 'number': {
      // 1,234.50 · $1,234 · 1.234,50 (si la coma va al final como decimal).
      let n = s.replace(/[$\s]|MXN|USD/gi, '')
      if (/,\d{1,2}$/.test(n) && n.includes('.')) n = n.replace(/\./g, '').replace(',', '.')
      else if (/^-?\d+,\d{1,2}$/.test(n)) n = n.replace(',', '.')
      else n = n.replace(/,/g, '')
      const x = Number(n)
      return n !== '' && Number.isFinite(x) ? x : undefined
    }
    case 'date': {
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      if (/^\d{4,5}(\.\d+)?$/.test(s)) return excelDate(Number(s))
      const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
      if (!m) return undefined
      const [a, b] = language() === 'en' ? [+m[2], +m[1]] : [+m[1], +m[2]]
      const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
      const d = new Date(Date.UTC(y, b - 1, a))
      return d.getUTCDate() === a && d.getUTCMonth() === b - 1 ? d.toISOString().slice(0, 10) : undefined
    }
    case 'boolean': {
      const p = s.toLowerCase()
      return SI.has(p) ? true : NO.has(p) ? false : undefined
    }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s.toLowerCase() : undefined
    default: {
      const ok = MX[tipo]
      if (!ok) return s
      const u = tipo === 'rfc' || tipo === 'curp' ? s.toUpperCase() : s.replace(/\D/g, '')
      return ok(u) ? u : undefined
    }
  }
}

export interface ImportError {
  /** Número de fila como se ve en el archivo (contando el encabezado). */
  row: number
  column?: string
  message: string
}
export interface ImportResult<T> {
  /** Filas válidas, ya convertidas. */
  rows: T[]
  /** Errores de las filas que no se importaron. */
  errors: ImportError[]
}

/** Convierte y valida todas las filas con el mapeo columna → índice. */
export function processRows<T = Record<string, unknown>>(
  datos: string[][],
  columnas: ImportColumn[],
  mapa: Record<string, number>,
  primeraFila = 1,
): ImportResult<T> {
  const t = T()
  const rows: T[] = []
  const errors: ImportError[] = []
  const vistos = new Map<string, Map<string, number>>()
  datos.forEach((r, k) => {
    const n = k + primeraFila
    const fila: Record<string, unknown> = {}
    const mal: ImportError[] = []
    for (const c of columnas) {
      const i = mapa[c.name]
      if (i === undefined || i < 0) continue
      const raw = r[i] ?? ''
      const v = convert(raw, c.type)
      if (v === undefined) mal.push({ row: n, column: c.label, message: `${c.label} ${t.invalid}: «${raw.trim()}»` })
      else if (c.required && (v === null || v === '')) mal.push({ row: n, column: c.label, message: `${c.label} ${t.required}` })
      else fila[c.name] = v
    }
    for (const c of columnas) {
      if (mal.some((e) => e.column === c.label) || fila[c.name] === undefined) continue
      try {
        const e = c.validate?.(fila[c.name], fila)
        if (e) mal.push({ row: n, column: c.label, message: `${c.label}: ${e}` })
      } catch (e) {
        mal.push({ row: n, column: c.label, message: `${c.label}: ${e instanceof Error ? e.message : String(e)}` })
      }
      const v = fila[c.name]
      if (c.unique && v !== null && v !== '') {
        const clave = String(v).toLowerCase()
        const m = vistos.get(c.name) ?? new Map<string, number>()
        vistos.set(c.name, m)
        const antes = m.get(clave)
        if (antes !== undefined) mal.push({ row: n, column: c.label, message: `${c.label} ${f(t.duplicate, antes)}` })
        else m.set(clave, n)
      }
    }
    if (mal.length) errors.push(...mal)
    else rows.push(fila as T)
  })
  return { rows, errors }
}

/** Columna del archivo que corresponde a cada campo, por nombre, etiqueta o alias (sin acentos ni mayúsculas). */
export function guessMapping(encabezados: string[], columnas: ImportColumn[]): Record<string, number> {
  const mapa: Record<string, number> = {}
  const usados = new Set<number>()
  const claves = encabezados.map(plano)
  for (const c of columnas) {
    const nombres = [c.name, c.label, ...(c.aliases ?? [])].map(plano).filter(Boolean)
    let i = claves.findIndex((h, k) => !usados.has(k) && nombres.includes(h))
    // Coincidencia parcial solo con 3 letras o más (si no, «b» coincidiría con «nombre»).
    if (i < 0)
      i = claves.findIndex(
        (h, k) => !usados.has(k) && h.length >= 3 && nombres.some((n) => n.length >= 3 && (h.includes(n) || n.includes(h))),
      )
    if (i >= 0) {
      mapa[c.name] = i
      usados.add(i)
    }
  }
  // Por palabras: «No. empleado» ↔ «Número de empleado» (abreviaturas comunes y sin «de», «la»…).
  const palabras = (x: string) =>
    new Set(
      x
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9#]+/)
        .map((w) => ABREV[w] ?? w)
        .filter((w) => w && !VACIAS.has(w)),
    )
  const cabeceras = encabezados.map(palabras)
  for (const c of columnas) {
    if (mapa[c.name] !== undefined) continue
    const mias = [c.name, c.label, ...(c.aliases ?? [])].map(palabras)
    let mejor = -1
    let puntos = 0
    cabeceras.forEach((ws, k) => {
      if (usados.has(k)) return
      const p = Math.max(...mias.map((m) => [...m].filter((w) => ws.has(w)).length))
      if (p > puntos) [mejor, puntos] = [k, p]
    })
    if (mejor >= 0) {
      mapa[c.name] = mejor
      usados.add(mejor)
    }
  }
  return mapa
}
const ABREV: Record<string, string> = {
  no: 'numero',
  num: 'numero',
  nro: 'numero',
  '#': 'numero',
  no_: 'numero',
  fecha: 'fecha',
  tel: 'telefono',
  cel: 'telefono',
}
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'of', 'the'])

/** Descarga un CSV con los encabezados (con BOM para que Excel respete los acentos). */
export function downloadTemplate(columnas: ImportColumn[], nombre = 'plantilla.csv'): void {
  const fila = columnas.map((c) => (/[",;\n]/.test(c.label) ? `"${c.label.replace(/"/g, '""')}"` : c.label)).join(',')
  const url = URL.createObjectURL(new Blob(['﻿' + fila + '\r\n'], { type: 'text/csv;charset=utf-8' }))
  const a = h('a', { href: url, download: nombre })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Diálogo ─────────────────────────────────────────────────────────────────

export interface ImportOptions<T> extends Omit<DialogOptions<ImportResult<T>>, 'render' | 'buttons' | 'collect'> {
  columns: ImportColumn[]
  /** Por omisión 5000. */
  maxRows?: number
  /** Nombre del CSV de plantilla. false oculta «Descargar plantilla». */
  template?: string | false
  /** Se ejecuta al importar (con «Importando…»). Si lanza, el error se muestra y el diálogo sigue abierto. */
  onImport?: (rows: T[]) => unknown | Promise<unknown>
}

const CSS = `
.imp-steps{display:flex;gap:8px;margin:0 0 16px;padding:0;list-style:none;font-size:13px;font-weight:500;color:var(--_subtle)}
.imp-steps li{flex:1}
.imp-steps li::before{content:"";display:block;height:4px;border-radius:2px;background:var(--_line);margin-bottom:8px}
.imp-steps li.on{color:var(--_accent)}
.imp-steps li.on::before{background:var(--_accent)}
.drop{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px 20px;border:1px dashed var(--_border);border-radius:12px;background:var(--_surface);text-align:center;font-size:14px;color:var(--_muted)}
.drop.over{border-color:var(--_accent);background:color-mix(in srgb,var(--_accent) 6%,var(--_bg))}
.drop small{color:var(--_subtle);font-size:12px}
.drop-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center}
.drop-ico{width:40px;height:40px;border-radius:10px;border:1px solid var(--_line);background:var(--_bg);display:flex;align-items:center;justify-content:center;box-shadow:var(--_xs)}
.btn-sm{height:34px;padding:0 12px;font-size:13px}
.note{margin:10px 0 0;font-size:14px;color:var(--_error)}
.note:empty{display:none}
.status{margin:10px 0 0;font-size:14px;color:var(--_muted)}
.status:empty{display:none}
.link{border:0;background:transparent;color:var(--_accent);font:600 14px var(--_font);cursor:pointer;padding:6px 8px;border-radius:8px;margin-top:12px}
.link:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
.check{display:flex;gap:10px;align-items:center;font-size:14px;margin:0 0 12px;color:var(--_label)}
.check input{width:18px;height:18px;accent-color:var(--_accent);margin:0}
.map{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--_line);border-radius:12px;overflow:hidden;font-size:14px}
.map th{background:var(--_surface);color:var(--_subtle);font-size:12px;font-weight:600;text-align:start;padding:10px 14px}
.map td{padding:8px 14px;border-top:1px solid var(--_line);vertical-align:middle;color:var(--_fg)}
.map td:last-child{color:var(--_subtle);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.map select{width:100%;height:36px;border:1px solid var(--_border);border-radius:8px;background:var(--_bg);color:var(--_fg);font:14px var(--_font);padding:0 8px}
.map select:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus);border-color:var(--_accent)}
.map select.bad{border-color:var(--_error)}
.req{color:var(--_error)}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}
.stats div{padding:14px;border:1px solid var(--_line);border-radius:12px}
.stats b{display:block;font-size:24px;line-height:30px;color:var(--_fg)}
.stats span{font-size:13px;color:var(--_subtle)}
.stats .ok b{color:var(--_success)}
.stats .bad b{color:var(--_error)}
.errs{margin:0;padding:12px 14px 12px 32px;max-height:220px;overflow:auto;border-radius:12px;font-size:14px;line-height:22px;color:var(--_muted);
  background:color-mix(in srgb,var(--_danger) 4%,var(--_bg));border:1px solid color-mix(in srgb,var(--_danger) 22%,var(--_bg))}
.errs-t{margin:0 0 8px;font-size:14px;font-weight:600;color:var(--_label)}
.good{margin:0;padding:12px 14px;border-radius:12px;font-size:14px;color:var(--_fg);background:color-mix(in srgb,var(--_success) 8%,var(--_bg))}
.narrow .map td:last-child,.narrow .map th:last-child{display:none}
`

/** Diálogo de importación: archivo → columnas → revisión. Resuelve con las filas válidas y los errores. */
export function importData<T = Record<string, unknown>>(o: ImportOptions<T>): Promise<DialogResult<ImportResult<T>>> {
  const t = T()
  const max = o.maxRows ?? 5000
  let paso = 0
  let datos: string[][] = []
  let conEncabezados = true
  let mapa: Record<string, number> = {}
  let resultado: ImportResult<T> = { rows: [], errors: [] }
  let ctxRef: DialogContext
  const pasos = h('ol', { class: 'imp-steps' }, ...[t.step1, t.step2, t.step3].map((s) => h('li', null, s)))
  const cuerpo = h('div', { 'aria-live': 'polite' })

  const encabezados = () => (conEncabezados ? (datos[0] ?? []) : (datos[0] ?? []).map((_, i) => f(t.colN, i + 1)))
  const filas = () => (conEncabezados ? datos.slice(1) : datos)

  const botones = (): ButtonSpec[] => {
    const n = resultado.rows.length
    return [
      { id: 'cancel', role: 'cancel', text: t.cancel },
      { id: 'back', role: 'custom', text: t.back, variant: 'secondary', hidden: paso === 0 },
      paso === 2
        ? { id: 'confirm', role: 'confirm', text: n === 1 ? t.import1 : f(t.importN, n.toLocaleString()), variant: 'primary', disabled: !n }
        : { id: 'next', role: 'custom', text: t.next, variant: 'primary', hidden: paso === 0 },
    ]
  }

  const ir = (i: number) => {
    paso = i
    ;[...pasos.children].forEach((li, k) => {
      li.className = k <= i ? 'on' : ''
      if (k === i) li.setAttribute('aria-current', 'step')
      else li.removeAttribute('aria-current')
    })
    ctxRef.setError(null)
    cuerpo.replaceChildren(i === 0 ? pantallaArchivo() : i === 1 ? pantallaColumnas() : pantallaRevision())
    ctxRef.setButtons(botones())
    cuerpo.querySelector<HTMLElement>('button,select,input')?.focus()
  }

  const pantallaArchivo = () => {
    const nota = h('p', { class: 'note', role: 'alert' })
    const estado = h('p', { class: 'status', role: 'status' })
    const oculto = h('input', { type: 'file', hidden: true, accept: '.csv,.txt,.tsv,.xlsx,text/csv' })
    const elegir = h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => oculto.click() }, t.choose)
    const ico = h('span', { class: 'drop-ico', 'aria-hidden': 'true' })
    ico.appendChild(
      svg(
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h6.5L15 6v11.5H5zM11.5 2.5V6H15M7.5 10.5h5M7.5 13.5h5"/></svg>',
      ),
    )
    const zona = h(
      'div',
      { class: 'drop' },
      ico,
      h('div', { class: 'drop-row' }, h('span', null, t.drop), elegir),
      h('small', null, f(t.formats, max.toLocaleString())),
    )
    const leer = async (file?: File | null) => {
      if (!file) return
      nota.textContent = ''
      estado.textContent = t.reading
      try {
        const d = await readSpreadsheet(file)
        estado.textContent = ''
        if (d.length < 2 && conEncabezados) return void (nota.textContent = t.empty)
        if (d.length - 1 > max) return void (nota.textContent = f(t.tooMany, (d.length - 1).toLocaleString(), max.toLocaleString()))
        datos = d
        mapa = guessMapping(encabezados(), o.columns)
        ir(1)
      } catch {
        estado.textContent = ''
        nota.textContent = t.badFile
      }
    }
    oculto.addEventListener('change', () => leer(oculto.files?.[0]))
    zona.addEventListener('dragover', (e) => (e.preventDefault(), zona.classList.add('over')))
    zona.addEventListener('dragleave', () => zona.classList.remove('over'))
    zona.addEventListener('drop', (e) => {
      e.preventDefault()
      zona.classList.remove('over')
      void leer(e.dataTransfer?.files[0])
    })
    const plantilla =
      o.template === false
        ? null
        : h('button', { type: 'button', class: 'link', onclick: () => downloadTemplate(o.columns, o.template || undefined) }, t.template)
    return h('div', null, zona, oculto, estado, nota, plantilla)
  }

  const pantallaColumnas = () => {
    const cab = encabezados()
    const ejemplo = filas()[0] ?? []
    const id = uid('imp')
    const casilla = h('input', { type: 'checkbox', id, checked: conEncabezados })
    casilla.addEventListener('change', () => {
      conEncabezados = casilla.checked
      mapa = guessMapping(encabezados(), o.columns)
      ir(1)
    })
    const filasMapa = o.columns.map((c) => {
      const sel = h(
        'select',
        { 'aria-label': `${t.column}: ${c.label}`, 'data-col': c.name },
        h('option', { value: '-1' }, t.none),
        ...cab.map((nombre, i) => h('option', { value: String(i) }, nombre || f(t.colN, i + 1))),
      )
      sel.value = String(mapa[c.name] ?? -1)
      const muestra = h('td')
      const pintar = () => (muestra.textContent = mapa[c.name] >= 0 ? (ejemplo[mapa[c.name]] ?? '') : '')
      sel.addEventListener('change', () => {
        mapa[c.name] = Number(sel.value)
        sel.classList.remove('bad')
        pintar()
      })
      pintar()
      return h(
        'tr',
        null,
        h('td', null, c.label, c.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
        h('td', null, sel),
        muestra,
      )
    })
    return h(
      'div',
      null,
      h('label', { class: 'check', for: id }, casilla, h('span', null, t.headers)),
      h(
        'table',
        { class: 'map' },
        h(
          'thead',
          null,
          h('tr', null, h('th', { scope: 'col' }, t.field), h('th', { scope: 'col' }, t.column), h('th', { scope: 'col' }, t.example)),
        ),
        h('tbody', null, ...filasMapa),
      ),
    )
  }

  const pantallaRevision = () => {
    const { rows, errors } = resultado
    const filasMal = new Set(errors.map((e) => e.row)).size
    const lista = errors.slice(0, 50)
    return h(
      'div',
      null,
      h(
        'div',
        { class: 'stats' },
        h('div', { class: 'ok' }, h('b', null, rows.length.toLocaleString()), h('span', null, f(t.ready, '').trim())),
        h('div', { class: filasMal ? 'bad' : '' }, h('b', null, filasMal.toLocaleString()), h('span', null, f(t.withErrors, '').trim())),
      ),
      errors.length
        ? h(
            'div',
            null,
            h('p', { class: 'errs-t' }, t.errorsTitle),
            h(
              'ul',
              { class: 'errs' },
              ...lista.map((e) => h('li', null, `${f(t.row, e.row)} · ${e.message}`)),
              errors.length > lista.length ? h('li', null, f(t.andMore, errors.length - lista.length)) : null,
            ),
          )
        : h('p', { class: 'good' }, t.allOk),
    )
  }

  return openDialog<ImportResult<T>>({
    role: 'dialog',
    size: 'lg',
    title: o.title ?? t.title,
    dismissible: { backdrop: false },
    ...o,
    moduleCss: CSS,
    buttons: [],
    render: (ctx) => {
      ctxRef = ctx
      return h('div', null, pasos, cuerpo)
    },
    onOpen: (ctx) => {
      ir(0)
      o.onOpen?.(ctx)
    },
    onAction: async (b) => {
      if (b.id === 'back') {
        ir(paso - 1)
        return true
      }
      if (b.id === 'next' && paso === 1) {
        const faltan = o.columns.filter((c) => c.required && !(mapa[c.name] >= 0))
        if (faltan.length) {
          for (const c of faltan) cuerpo.querySelector(`select[data-col="${c.name}"]`)?.classList.add('bad')
          ctxRef.setError(f(t.mapRequired, faltan.map((c) => c.label).join(', ')))
          cuerpo.querySelector<HTMLElement>('select.bad')?.focus()
          return true
        }
        resultado = processRows<T>(filas(), o.columns, mapa, conEncabezados ? 2 : 1)
        ir(2)
        return true
      }
      return false
    },
    collect: async () => {
      if (!resultado.rows.length) {
        ctxRef.setError(t.nothing)
        return INVALID
      }
      if (o.onImport) {
        ctxRef.setLoading(true, t.importing)
        try {
          await o.onImport(resultado.rows)
        } catch (e) {
          ctxRef.setLoading(false)
          ctxRef.setError(e instanceof Error ? e.message : String(e))
          return INVALID
        }
        ctxRef.setLoading(false)
      }
      return resultado
    },
  })
}

// ── Exportar ────────────────────────────────────────────────────────────────

export interface ExportColumn<R = Record<string, unknown>> {
  key: string
  label: string
  /** 'date' escribe fechas de verdad en Excel (AAAA-MM-DD o Date); 'number' números; el resto, texto. */
  type?: 'text' | 'number' | 'date' | 'boolean'
  /** Texto propio para la celda (solo CSV y texto en Excel). */
  format?: (value: any, row: R) => string | number | boolean | null | undefined
}
export interface ExportOptions<R = Record<string, unknown>> {
  columns: ExportColumn<R>[]
  /** Nombre del archivo, sin extensión. Por omisión 'datos'. */
  filename?: string
  /** Nombre de la hoja de Excel. Por omisión 'Datos'. */
  sheet?: string
}

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const ref = (col: number, fila: number) => {
  let c = ''
  for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) c = String.fromCharCode(64 + ((n - 1) % 26) + 1) + c
  return c + fila
}
/** Días desde 1899-12-30 (serie de Excel). */
const serieExcel = (v: unknown): number | null => {
  const d = v instanceof Date ? v : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? new Date(v.slice(0, 10) + 'T00:00:00Z') : null
  if (!d || isNaN(d.getTime())) return null
  return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(1899, 11, 30)) / 86_400_000)
}

/** Texto CSV (con BOM, para que Excel respete los acentos). */
export function toCSV<R>(rows: R[], columns: ExportColumn<R>[], separador = ','): string {
  const celda = (v: unknown) => {
    let s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)
    // Inyección de fórmulas: Excel y LibreOffice evalúan lo que empieza con = + - @ (o tab/retorno). Un apóstrofo delante lo deja como
    // texto. Los números de verdad (-5, +3.2, o un `number`) no se tocan.
    if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s) && !/^[+-]?\d+(\.\d+)?$/.test(s)) s = `'${s}`
    return /[",;\n\r\t]/.test(s) || s.includes(separador) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lineas = [columns.map((c) => celda(c.label)).join(separador)]
  for (const r of rows)
    lineas.push(columns.map((c) => celda(c.format ? c.format((r as any)[c.key], r) : (r as any)[c.key])).join(separador))
  return '﻿' + lineas.join('\r\n') + '\r\n'
}

// CRC-32 para el zip.
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (d: Uint8Array) => {
  let c = 0xffffffff
  for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
async function comprimir(d: Uint8Array): Promise<{ datos: Uint8Array; metodo: number }> {
  if (typeof CompressionStream === 'undefined') return { datos: d, metodo: 0 }
  const flujo = new Blob([d as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return { datos: new Uint8Array(await new Response(flujo).arrayBuffer()), metodo: 8 }
}
/** Zip mínimo (sin fechas) con los archivos dados. */
async function zip(archivos: Record<string, string>): Promise<Blob> {
  const enc = new TextEncoder()
  const partes: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let off = 0
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = enc.encode(nombre)
    const crudo = enc.encode(contenido)
    const { datos, metodo } = await comprimir(crudo)
    const crc = crc32(crudo)
    const local = new Uint8Array(30 + n.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(8, metodo, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, datos.length, true)
    lv.setUint32(22, crudo.length, true)
    lv.setUint16(26, n.length, true)
    local.set(n, 30)
    const central = new Uint8Array(46 + n.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(10, metodo, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, datos.length, true)
    cv.setUint32(24, crudo.length, true)
    cv.setUint16(28, n.length, true)
    cv.setUint32(42, off, true)
    central.set(n, 46)
    partes.push(local, datos)
    centrales.push(central)
    off += local.length + datos.length
  }
  const tam = centrales.reduce((s, c) => s + c.length, 0)
  const fin = new Uint8Array(22)
  const fv = new DataView(fin.buffer)
  fv.setUint32(0, 0x06054b50, true)
  fv.setUint16(8, centrales.length, true)
  fv.setUint16(10, centrales.length, true)
  fv.setUint32(12, tam, true)
  fv.setUint32(16, off, true)
  return new Blob([...partes, ...centrales, fin] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Libro .xlsx con una hoja: encabezados en negrita, fechas y números de verdad, anchos de columna según el contenido. */
export async function toXLSX<R>(rows: R[], o: ExportOptions<R>): Promise<Blob> {
  const cols = o.columns
  const anchos = cols.map((c) => Math.min(60, Math.max(8, c.label.length + 2)))
  const celdas: string[] = []
  const filaXml = (vals: string[], r: number) => `<row r="${r}">${vals.join('')}</row>`
  celdas.push(
    filaXml(
      cols.map((c, i) => `<c r="${ref(i, 1)}" t="inlineStr" s="1"><is><t>${xmlEsc(c.label)}</t></is></c>`),
      1,
    ),
  )
  rows.forEach((row, k) => {
    const r = k + 2
    const vals = cols.map((c, i) => {
      const crudo = c.format ? c.format((row as any)[c.key], row) : (row as any)[c.key]
      if (crudo === null || crudo === undefined || crudo === '') return ''
      const tipo =
        c.type ?? (typeof crudo === 'number' ? 'number' : typeof crudo === 'boolean' ? 'boolean' : crudo instanceof Date ? 'date' : 'text')
      const texto = crudo instanceof Date ? crudo.toISOString().slice(0, 10) : String(crudo)
      anchos[i] = Math.min(60, Math.max(anchos[i], texto.length + 2))
      if (tipo === 'number' && typeof crudo === 'number' && Number.isFinite(crudo)) return `<c r="${ref(i, r)}"><v>${crudo}</v></c>`
      if (tipo === 'boolean') return `<c r="${ref(i, r)}" t="b"><v>${crudo ? 1 : 0}</v></c>`
      if (tipo === 'date') {
        const n = serieExcel(crudo)
        if (n !== null) return `<c r="${ref(i, r)}" s="2"><v>${n}</v></c>`
      }
      return `<c r="${ref(i, r)}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(texto)}</t></is></c>`
    })
    celdas.push(filaXml(vals.filter(Boolean), r))
  })
  const hoja = xmlEsc((o.sheet ?? 'Datos').slice(0, 31))
  const colsXml = anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  return zip({
    '[Content_Types].xml': `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${hoja}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `${X}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml': `${X}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${colsXml}</cols><sheetData>${celdas.join('')}</sheetData><autoFilter ref="A1:${ref(cols.length - 1, Math.max(1, rows.length + 1))}"/></worksheet>`,
  })
}

function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const a = h('a', { href: url, download: nombre })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Descarga las filas como .xlsx (por omisión) o .csv. Sin dependencias. */
export async function exportData<R>(rows: R[], o: ExportOptions<R> & { format?: 'xlsx' | 'csv' }): Promise<void> {
  const nombre = o.filename ?? 'datos'
  if (o.format === 'csv') descargar(new Blob([toCSV(rows, o.columns)], { type: 'text/csv;charset=utf-8' }), `${nombre}.csv`)
  else descargar(await toXLSX(rows, o), `${nombre}.xlsx`)
}
