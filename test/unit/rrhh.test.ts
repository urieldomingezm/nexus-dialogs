import { describe, expect, it, vi } from 'vitest'
import { deflateRawSync } from 'node:zlib'
import { form } from '../../src/forms'
import { convert, excelDate, guessMapping, importData, parseCSV, processRows, readSpreadsheet, type ImportColumn } from '../../src/import'
import { pickRows } from '../../src/table'
import { buildSepomexShards, sepomexLookup } from '../../src/sepomex'
import { $, $$, boton, escribir, esperar } from './utilidades'

// ── Calendario ──────────────────────────────────────────────────────────────
describe('daterange con calendario', () => {
  const abrir = () =>
    form({
      title: 'Vacaciones',
      fields: [{ name: 'f', label: 'Fechas', type: 'daterange', calendar: true, presets: false, required: true }],
    })
  const dia = (iso: string) => $<HTMLButtonElement>(`.cal-day[data-d="${iso}"]`)

  it('dos clics eligen el rango (en cualquier orden) y llenan las cajas dd/mm/aaaa', async () => {
    const p = abrir()
    const [desde, hasta] = $$('.dr-inputs input') as HTMLInputElement[]
    expect(desde.type).toBe('text')
    escribir(desde, '10/12/2026')
    expect($('.cal-title').textContent).toContain('2026')
    dia('2026-12-18').click()
    dia('2026-12-14').click()
    expect(desde.value).toBe('14/12/2026')
    expect(hasta.value).toBe('18/12/2026')
    expect(dia('2026-12-16').className).toContain('in')
    expect(dia('2026-12-14').getAttribute('aria-label')).toMatch(/14 de diciembre de 2026/)
    boton('confirm').click()
    expect((await p).value).toEqual({ f: { from: '2026-12-14', to: '2026-12-18' } })
  })

  it('flechas y Av Pág mueven el foco; texto que no es fecha marca error', async () => {
    const p = abrir()
    const [desde] = $$('.dr-inputs input') as HTMLInputElement[]
    escribir(desde, '31/01/2027')
    dia('2027-01-31').focus()
    dia('2027-01-31').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(raizActiva()?.getAttribute('data-d')).toBe('2027-02-01')
    raizActiva()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }))
    expect(raizActiva()?.getAttribute('data-d')).toBe('2027-03-01')
    escribir(desde, '31/02/2027')
    boton('confirm').click()
    await esperar()
    expect($('.field.daterange .msg').textContent).toBe('Escribe la fecha como dd/mm/aaaa.')
    boton('cancel').click()
    await esperar()
    boton('discard').click()
    await p
  })
})
// ── Lista de periodos ───────────────────────────────────────────────────────
describe('daterange con periods', () => {
  const abrir = (extra: Record<string, unknown> = {}) =>
    form({
      title: 'Capacitación',
      fields: [{ name: 'f', label: 'Fechas', type: 'daterange', periods: true, required: true, ...extra }],
    })
  const dia = (iso: string) => $<HTMLButtonElement>(`.cal-day[data-d="${iso}"]`)
  const mes = (iso: string) => {
    // Lleva el calendario al mes de `iso` con las flechas.
    const objetivo = iso.slice(0, 7)
    for (let i = 0; i < 24 && !document.querySelector('nexus-dialogs')?.shadowRoot?.querySelector(`.cal-day[data-d="${iso}"]`); i++) {
      const [a, m] = objetivo.split('-').map(Number)
      const t = $('.cal-title').textContent ?? ''
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ]
      const actual = meses.findIndex((n) => t.toLowerCase().startsWith(n)) + 1
      const anio = Number(t.match(/\d{4}/)?.[0])
      const dif = (a - anio) * 12 + (m - actual)
      $<HTMLButtonElement>(`.cal-nav[aria-label="${dif > 0 ? 'Mes siguiente' : 'Mes anterior'}"]`)?.click()
    }
  }

  it('un rango y un día suelto no corrido; sin cajas ni atajos', async () => {
    const p = abrir()
    expect($$('.dr-inputs, .presets').length).toBe(0)
    const hoy = new Date()
    const base = `${hoy.getFullYear() + 1}-03`
    mes(`${base}-17`)
    dia(`${base}-17`).click()
    expect($('.per-guia').textContent).toContain('último día')
    dia(`${base}-19`).click()
    expect($$('.per').length).toBe(1)
    expect($('.per-txt').textContent).toMatch(/^17 al 19 mar/)
    expect($('.per-n').textContent).toBe('3 días')
    // Segundo periodo: un solo día, cerrado con «Agregar otro periodo».
    dia(`${base}-25`).click()
    expect($$('.per').length).toBe(2)
    $<HTMLButtonElement>('.per-add').click()
    expect($('.per-add').hasAttribute('hidden')).toBe(true)
    boton('confirm').click()
    expect((await p).value).toEqual({
      f: [
        { from: `${base}-17`, to: `${base}-19` },
        { from: `${base}-25`, to: `${base}-25` },
      ],
    })
  })

  it('quitar un periodo; los periodos se ordenan y no pueden traslaparse', async () => {
    const hoy = new Date()
    const base = `${hoy.getFullYear() + 1}-05`
    const p = abrir()
    mes(`${base}-10`)
    dia(`${base}-20`).click()
    dia(`${base}-22`).click()
    dia(`${base}-05`).click()
    dia(`${base}-06`).click()
    const txt = $$('.per-txt').map((e) => e.textContent)
    expect(txt[0]).toMatch(/^5 al 6/)
    expect(txt[1]).toMatch(/^20 al 22/)
    dia(`${base}-21`).click()
    dia(`${base}-24`).click()
    boton('confirm').click()
    await esperar()
    expect($('.field.daterange .msg').textContent).toBe('Los periodos no pueden traslaparse.')
    $$<HTMLButtonElement>('.per-x')[2].click()
    expect($$('.per').length).toBe(2)
    expect($('.per-x').getAttribute('aria-label')).toMatch(/^Quitar periodo 5 al 6/)
    boton('confirm').click()
    const r = (await p).value as { f: { from: string }[] }
    expect(r.f.map((x) => x.from)).toEqual([`${base}-05`, `${base}-20`])
  })

  it('maxDays cuenta el total de todos los periodos', async () => {
    const base = `${new Date().getFullYear() + 1}-07`
    const p = abrir({ maxDays: 4 })
    mes(`${base}-01`)
    dia(`${base}-01`).click()
    dia(`${base}-03`).click()
    dia(`${base}-10`).click()
    dia(`${base}-11`).click()
    boton('confirm').click()
    await esperar()
    expect($('.field.daterange .msg').textContent).toBe('En total son máximo 4 días.')
    $<HTMLButtonElement>('.per-x').click()
    boton('confirm').click()
    expect(((await p).value as { f: unknown[] }).f.length).toBe(1)
  })
})
const raizActiva = () =>
  ($('.cal') as HTMLElement).getRootNode() && (($('.cal').getRootNode() as ShadowRoot).activeElement as HTMLElement | null)

// ── Firma ───────────────────────────────────────────────────────────────────
describe('signature', () => {
  it('obligatoria; con el teclado se puede firmar escribiendo el nombre; Borrar la quita', async () => {
    const p = form({ title: 'Recibo', fields: [{ name: 'firma', label: 'Firma', type: 'signature', required: true }] })
    expect($('canvas.sig-pad').getAttribute('aria-label')).toBe('Área para firmar')
    boton('confirm').click()
    await esperar()
    expect($('.field.signature .msg').textContent).toBe('Este campo es obligatorio.')
    const [escribirNombre, borrar] = $$('.sig-tools button')
    escribirNombre.click()
    const nombre = $<HTMLInputElement>('input.sig-name')
    expect(nombre.hidden).toBe(false)
    escribir(nombre, 'Laura Méndez')
    expect($('.sig').classList.contains('has')).toBe(true)
    borrar.click()
    expect($('.sig').classList.contains('has')).toBe(false)
    escribir(nombre, 'Laura Méndez')
    boton('confirm').click()
    const r = await p
    expect(String((r.value as any).firma)).toMatch(/^data:/)
  })
})

// ── Importar ────────────────────────────────────────────────────────────────
describe('import: lectura y conversión', () => {
  it('parseCSV: comillas, saltos dentro de comillas, BOM y separador automático', () => {
    expect(parseCSV('﻿nombre;salario\n"Pérez; Ana";"1,200.50"\r\n"Dice ""hola""\notra línea";3\n\n')).toEqual([
      ['nombre', 'salario'],
      ['Pérez; Ana', '1,200.50'],
      ['Dice "hola"\notra línea', '3'],
    ])
    expect(parseCSV('a\tb\n1\t2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('convert por tipo', () => {
    expect(convert('$1,234.50', 'number')).toBe(1234.5)
    expect(convert('1.234,50', 'number')).toBe(1234.5)
    expect(convert('12,5', 'number')).toBe(12.5)
    expect(convert('abc', 'number')).toBeUndefined()
    expect(convert('5/3/2024', 'date')).toBe('2024-03-05')
    expect(convert('31/02/2024', 'date')).toBeUndefined()
    expect(convert('45000', 'date')).toBe(excelDate(45000))
    expect(excelDate(45000)).toBe('2023-03-15')
    expect(convert('Sí', 'boolean')).toBe(true)
    expect(convert('no', 'boolean')).toBe(false)
    expect(convert('xaxx010101000', 'rfc')).toBe('XAXX010101000')
    expect(convert('ANA@X.MX', 'email')).toBe('ana@x.mx')
    expect(convert('  ', 'text')).toBeNull()
  })

  const cols: ImportColumn[] = [
    { name: 'numero', label: 'Número de empleado', required: true, unique: true, aliases: ['num', 'no empleado'] },
    { name: 'nombre', label: 'Nombre completo', required: true, aliases: ['empleado'] },
    { name: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
    { name: 'salario', label: 'Salario diario', type: 'number', validate: (v) => (v < 278.8 ? 'menor al salario mínimo' : null) },
  ]

  it('guessMapping sin acentos ni mayúsculas, con alias', () => {
    expect(guessMapping(['EMPLEADO', 'Num', 'Salario Diario', 'Fecha ingreso'], cols)).toEqual({
      numero: 1,
      nombre: 0,
      salario: 2,
      ingreso: 3,
    })
    // Por palabras y abreviaturas: «No. empleado», «Nombre», «Ingreso (fecha)».
    expect(guessMapping(['Ingreso (fecha)', 'No. Empleado', 'Nombre', 'Sueldo'], cols.slice(0, 3))).toEqual({
      numero: 1,
      nombre: 2,
      ingreso: 0,
    })
  })

  it('processRows: faltantes, inválidos, repetidos y validación propia', () => {
    const r = processRows(
      [
        ['1', 'Ana', '01/02/2024', '400'],
        ['', 'Leo', '', '300'],
        ['3', 'Eva', 'ayer', '300'],
        ['1', 'Ana bis', '', '300'],
        ['5', 'Sol', '', '100'],
      ],
      cols,
      { numero: 0, nombre: 1, ingreso: 2, salario: 3 },
      2,
    )
    expect(r.rows).toEqual([{ numero: '1', nombre: 'Ana', ingreso: '2024-02-01', salario: 400 }])
    expect(r.errors.map((e) => `${e.row}: ${e.message}`)).toEqual([
      '3: Número de empleado falta',
      '4: Fecha de ingreso no es válido: «ayer»',
      '5: Número de empleado está repetido (fila 2)',
      '6: Salario diario: menor al salario mínimo',
    ])
  })

  it('lee un .xlsx (zip con deflate), con textos compartidos y celdas de fecha', async () => {
    const archivos: Record<string, string> = {
      'xl/workbook.xml':
        '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Empleados" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/hoja.xml"/></Relationships>',
      'xl/sharedStrings.xml': '<sst><si><t>Nombre</t></si><si><t>Ingreso</t></si><si><r><t>Ana </t></r><r><t>Pérez</t></r></si></sst>',
      'xl/styles.xml': '<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>',
      'xl/worksheets/hoja.xml':
        '<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row><c r="A2" t="s"><v>2</v></c><c r="B2" s="1"><v>45000</v></c><c r="D2"><v>7</v></c></row></sheetData></worksheet>',
    }
    const filas = await readSpreadsheet(zip(archivos))
    expect(filas).toEqual([
      ['Nombre', 'Ingreso'],
      ['Ana Pérez', '2023-03-15', '', '7'],
    ])
  })
})

describe('importData (diálogo)', () => {
  const subir = (contenido: string, nombre = 'empleados.csv') => {
    const input = $<HTMLInputElement>('input[type=file]')
    Object.defineProperty(input, 'files', { value: [new File([contenido], nombre, { type: 'text/csv' })], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
  const columnas: ImportColumn[] = [
    { name: 'numero', label: 'Número', required: true, unique: true },
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'area', label: 'Área' },
  ]

  it('archivo → columnas (relacionadas solas) → revisión → importa solo las válidas', async () => {
    const onImport = vi.fn(async () => {})
    const p = importData({ title: 'Importar empleados', columns: columnas, onImport })
    await esperar()
    expect($$('.imp-steps li')[0].getAttribute('aria-current')).toBe('step')
    subir('Nombre,Numero,Area\nAna,1,Nómina\nLeo,,Almacén\nEva,3,Almacén\n')
    await esperar(20)
    expect(($$('.map select') as HTMLSelectElement[]).map((s) => s.value)).toEqual(['1', '0', '2'])
    expect($$('.map td:last-child').map((td) => td.textContent)).toEqual(['1', 'Ana', 'Nómina'])
    boton('next').click()
    await esperar()
    expect($('.stats .ok b').textContent).toBe('2')
    expect($('.errs').textContent).toContain('Fila 3 · Número falta')
    expect(boton('confirm').textContent).toBe('Importar 2 filas')
    boton('confirm').click()
    const r = await p
    expect(onImport).toHaveBeenCalledWith([
      { numero: '1', nombre: 'Ana', area: 'Nómina' },
      { numero: '3', nombre: 'Eva', area: 'Almacén' },
    ])
    expect(r.value!.errors).toHaveLength(1)
  })

  it('pide relacionar las columnas obligatorias', async () => {
    const p = importData({ columns: columnas })
    await esperar()
    subir('A;B\nx;y\n')
    await esperar(20)
    boton('next').click()
    await esperar()
    expect($('.map select.bad')).not.toBeNull()
    expect(raiz2().textContent).toContain('Elige una columna para: Número, Nombre.')
    boton('cancel').click()
    expect((await p).confirmed).toBe(false)
  })
})
const raiz2 = () => $('.panel') as HTMLElement

// ── Tabla con selección ─────────────────────────────────────────────────────
describe('pickRows', () => {
  const gente = Array.from({ length: 60 }, (_, i) => ({
    id: String(i + 1),
    nombre: `Persona ${i + 1}`,
    area: i % 2 ? 'Nómina' : 'Almacén',
  }))
  const columnas = [
    { key: 'id', label: 'Núm.' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'area', label: 'Área' },
  ]

  it('busca sin acentos, pagina, conserva la selección y elige', async () => {
    const p = pickRows({ title: 'Participantes', rows: gente, columns: columnas, pageSize: 25, selected: ['60'] })
    await esperar()
    expect($$('tbody tr')).toHaveLength(25)
    expect($('.pager span').textContent).toBe('1–25 de 60')
    expect($('.pick-count').textContent).toBe('1 seleccionado')
    $$('tbody tr')[1]
      .querySelector('td:nth-child(2)')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect($('.pick-count').textContent).toBe('2 seleccionados')
    escribir($<HTMLInputElement>('input[type=search]'), 'nomina')
    await esperar(150)
    expect($('.pager span').textContent).toBe('1–25 de 30')
    ;($('thead input[type=checkbox]') as HTMLInputElement).click()
    expect($('.pick-count').textContent).toBe('26 seleccionados')
    expect(boton('confirm').textContent).toBe('Elegir 26')
    boton('confirm').click()
    const r = await p
    expect(r.value!.map((x) => x.id).slice(0, 3)).toEqual(['60', '2', '4'])
    expect(r.value).toHaveLength(26)
  })

  it('una sola fila, filas deshabilitadas y mínimo', async () => {
    const p = pickRows({ rows: gente.slice(0, 3), columns: columnas, multiple: false, isDisabled: (r) => r.id === '2' })
    await esperar()
    expect($('thead input')).toBeNull()
    expect(($$('tbody input')[1] as HTMLInputElement).disabled).toBe(true)
    boton('confirm').click()
    await esperar()
    expect($('.panel').textContent).toContain('Elige al menos 1.')
    ;($$('tbody input')[0] as HTMLInputElement).click()
    ;($$('tbody input')[2] as HTMLInputElement).click()
    boton('confirm').click()
    expect((await p).value!.map((x) => x.id)).toEqual(['3'])
  })

  it('carga remota con búsqueda y páginas', async () => {
    const load = vi.fn(async ({ search, page }: { search: string; page: number; pageSize: number }) => ({
      rows: [{ id: `${search}-${page}`, nombre: 'X', area: 'Y' }],
      total: 40,
    }))
    const p = pickRows({ rows: undefined, load, columns: columnas, pageSize: 20 })
    await esperar()
    expect(load).toHaveBeenLastCalledWith({ search: '', page: 0, pageSize: 20 })
    ;($('button[aria-label="Página siguiente"]') as HTMLButtonElement).click()
    await esperar()
    expect(load).toHaveBeenLastCalledWith({ search: '', page: 1, pageSize: 20 })
    expect($('tbody tr').getAttribute('data-k')).toBe('-1')
    boton('cancel').click()
    await p
  })
})

// ── SEPOMEX ─────────────────────────────────────────────────────────────────
describe('sepomex', () => {
  const TXT = [
    'El Catálogo Nacional de Códigos Postales, es elaborado por Correos de México…',
    'd_codigo|d_asenta|d_tipo_asenta|D_mnpio|d_estado|d_ciudad|d_CP|c_estado|c_oficina|c_CP|c_tipo_asenta|c_mnpio|id_asenta_cpcons|d_zona|c_cve_ciudad',
    '64000|Obispado|Colonia|Monterrey|Nuevo León|Monterrey|64001|19|64001||09|039|0001|Urbano|01',
    '64000|Centro|Colonia|Monterrey|Nuevo León|Monterrey|64001|19|64001||09|039|0002|Urbano|01',
    '01000|San Ángel|Colonia|Álvaro Obregón|Ciudad de México|Ciudad de México|01001|09|01001||09|010|0001|Urbano|01',
  ].join('\r\n')

  it('convierte el TXT oficial en archivos por prefijo', () => {
    expect(buildSepomexShards(TXT)).toEqual({
      '64': { '64000': ['Nuevo León', 'Monterrey', 'Monterrey', ['Centro', 'Obispado']] },
      '01': { '01000': ['Ciudad de México', 'Álvaro Obregón', 'Ciudad de México', ['San Ángel']] },
    })
  })

  it('busca bajando solo el archivo del prefijo, una vez', async () => {
    const shards = buildSepomexShards(TXT)
    const fetch = vi.fn(async (url: string) => {
      const pref = url.match(/(\d\d)\.json$/)![1]
      return { ok: !!shards[pref], json: async () => shards[pref] }
    })
    const buscar = sepomexLookup({ baseUrl: '/cp', fetch })
    expect(await buscar('64000')).toEqual({
      state: 'Nuevo León',
      municipality: 'Monterrey',
      city: 'Monterrey',
      neighborhoods: ['Centro', 'Obispado'],
    })
    expect(await buscar('64999')).toBeNull()
    expect(await buscar('99000')).toBeNull()
    expect(await buscar('abc')).toBeNull()
    expect(fetch.mock.calls.map((c) => c[0])).toEqual(['/cp/64.json', '/cp/99.json'])
  })
})

// ── zip mínimo para la prueba del .xlsx ─────────────────────────────────────
function zip(archivos: Record<string, string>): Blob {
  const enc = new TextEncoder()
  const partes: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let off = 0
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const n = enc.encode(nombre)
    const datos = new Uint8Array(deflateRawSync(enc.encode(contenido)))
    const local = new Uint8Array(30 + n.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(8, 8, true)
    lv.setUint32(18, datos.length, true)
    lv.setUint16(26, n.length, true)
    local.set(n, 30)
    const central = new Uint8Array(46 + n.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(10, 8, true)
    cv.setUint32(20, datos.length, true)
    cv.setUint16(28, n.length, true)
    cv.setUint32(42, off, true)
    central.set(n, 46)
    partes.push(local, datos)
    centrales.push(central)
    off += local.length + datos.length
  }
  const tamCentral = centrales.reduce((s, c) => s + c.length, 0)
  const fin = new Uint8Array(22)
  const fv = new DataView(fin.buffer)
  fv.setUint32(0, 0x06054b50, true)
  fv.setUint16(8, centrales.length, true)
  fv.setUint16(10, centrales.length, true)
  fv.setUint32(12, tamCentral, true)
  fv.setUint32(16, off, true)
  return new Blob([...partes, ...centrales, fin])
}
