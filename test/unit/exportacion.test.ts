// Inyección de fórmulas al exportar: lo que empieza con = + - @ no debe llegar a Excel o LibreOffice como fórmula.
// La parte de LibreOffice se salta si no está instalado (en CI sí hay una comprobación aparte con xlsx).
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toCSV, toXLSX } from '../../src/import'

const PELIGROSOS = ['=1+1', '@SUM(A1:A2)', '+cmd', '-1+2', '=HYPERLINK("http://x","clic")', "=cmd|' /C calc'!A0", '\t=1+1', '\r=1+1']
const columnas = [
  { key: 'n', label: 'Nombre' },
  { key: 'v', label: 'Valor' },
]

describe('toCSV: inyección de fórmulas', () => {
  it.each(PELIGROSOS)('%j sale como texto con apóstrofo delante', (valor) => {
    const csv = toCSV([{ n: 'x', v: valor }], columnas)
    const celda = csv.split('\r\n')[1].split(',').slice(1).join(',')
    expect(celda.replace(/^"/, '')[0]).toBe("'")
  })

  it('el encabezado también se neutraliza', () => {
    expect(toCSV([], [{ key: 'a', label: '=2+2' }])).toContain("'=2+2")
  })

  it('los números de verdad no se tocan', () => {
    const csv = toCSV(
      [
        { n: 'a', v: -5 },
        { n: 'b', v: '-5' },
        { n: 'c', v: '+3.25' },
        { n: 'd', v: 0 },
      ],
      columnas,
    )
    expect(csv).toContain('a,-5\r\n')
    expect(csv).toContain('b,-5\r\n')
    expect(csv).toContain('c,+3.25\r\n')
    expect(csv).not.toContain("'-5")
  })

  it('texto normal y acentos quedan igual', () => {
    expect(toCSV([{ n: 'María', v: 'Ñandú' }], columnas)).toContain('María,Ñandú')
  })
})

describe('toXLSX: las celdas de texto nunca son fórmulas', () => {
  it('todos los valores peligrosos van como cadena en línea y el archivo no contiene <f>', async () => {
    const blob = await toXLSX(
      PELIGROSOS.map((v) => ({ n: 'x', v })),
      { columns: columnas },
    )
    const dir = mkdtempSync(join(tmpdir(), 'nd-'))
    const ruta = join(dir, 'a.xlsx')
    writeFileSync(ruta, Buffer.from(await blob.arrayBuffer()))
    const xml = execFileSync('unzip', ['-p', ruta, 'xl/worksheets/sheet1.xml']).toString()
    expect(xml).not.toContain('<f>')
    expect(xml).not.toContain('<f ')
    expect(xml.match(/t="inlineStr"/g)!.length).toBeGreaterThanOrEqual(PELIGROSOS.length)
  })
})

const hayLibreOffice = spawnSync('soffice', ['--version']).status === 0
describe.skipIf(!hayLibreOffice)('LibreOffice abre lo exportado sin evaluar fórmulas', () => {
  const convertir = (ruta: string, a: string, dir: string) =>
    spawnSync('soffice', ['--headless', '--convert-to', a, '--outdir', dir, ruta], { timeout: 90_000 })

  it('CSV → xlsx: ninguna celda trae fórmula', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nd-lo-'))
    const csv = join(dir, 'malo.csv')
    writeFileSync(
      csv,
      toCSV(
        PELIGROSOS.map((v) => ({ n: 'x', v })),
        columnas,
      ),
    )
    convertir(csv, 'xlsx', dir)
    const xml = execFileSync('unzip', ['-p', join(dir, 'malo.xlsx'), 'xl/worksheets/sheet1.xml']).toString()
    expect(xml).not.toMatch(/<f[ >]/)
  }, 120_000)

  it('xlsx → csv: el texto peligroso se conserva tal cual y no se calcula', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nd-lo-'))
    const blob = await toXLSX(
      [
        { n: 'x', v: '=1+1' },
        { n: 'y', v: '@SUM(A1:A2)' },
      ],
      { columns: columnas },
    )
    const ruta = join(dir, 'libro.xlsx')
    writeFileSync(ruta, Buffer.from(await blob.arrayBuffer()))
    convertir(ruta, 'csv', dir)
    const salida = readFileSync(join(dir, 'libro.csv'), 'utf8')
    expect(salida).toContain('=1+1')
    expect(salida).toContain('@SUM(A1:A2)')
    expect(salida).not.toMatch(/x,2\b/)
  }, 120_000)
})
