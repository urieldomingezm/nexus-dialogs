import { describe, expect, it, vi } from 'vitest'
import { configure } from '../../src'
import { form, formFromJSON } from '../../src/forms'
import { addBusinessDays, businessDays, isBusinessDay, mexicanHolidays } from '../../src/mx'
import { toCSV, toXLSX, readXLSX } from '../../src/import'
import { pickRows } from '../../src/table'
import { plantillas, sinResolvers } from '../../src/rrhh'
import { $, $$, boton, escribir, esperar } from './utilidades'

describe('festivos y días hábiles (mx)', () => {
  it('artículo 74 de la LFT, con lunes movibles y el 1 de octubre cada seis años', () => {
    expect(mexicanHolidays(2026)).toEqual([
      '2026-01-01',
      '2026-02-02',
      '2026-03-16',
      '2026-05-01',
      '2026-09-16',
      '2026-11-16',
      '2026-12-25',
    ])
    expect(mexicanHolidays(2024)).toContain('2024-10-01')
    expect(mexicanHolidays(2025)).not.toContain('2025-10-01')
    expect(mexicanHolidays(2030)).toContain('2030-10-01')
  })

  it('cuenta hábiles sin fines de semana ni festivos; acepta festivos propios y otro fin de semana', () => {
    expect(businessDays('2026-11-09', '2026-11-20')).toBe(9) // 10 entre semana menos el 16 de noviembre
    expect(businessDays('2026-11-09', '2026-11-20', { holidays: ['2026-11-10'] })).toBe(8)
    expect(businessDays('2026-11-09', '2026-11-20', { mexican: false })).toBe(10)
    expect(businessDays('2026-11-09', '2026-11-14', { weekend: [0] })).toBe(6)
    expect(businessDays('2026-11-20', '2026-11-09')).toBe(0)
    expect(isBusinessDay('2026-12-25')).toBe(false)
    expect(isBusinessDay('2026-12-24')).toBe(true)
    expect(addBusinessDays('2026-12-24', 3)).toBe('2026-12-30')
    expect(addBusinessDays('2027-01-04', -1)).toBe('2026-12-31')
  })
})

describe('daterange con días hábiles', () => {
  it('muestra el conteo, marca festivos y el máximo cuenta solo hábiles', async () => {
    const p = form({
      title: 'Vacaciones',
      fields: [
        {
          name: 'f',
          label: 'Días',
          type: 'daterange',
          calendar: true,
          presets: false,
          businessDays: true,
          holidays: ['2026-12-24'],
          maxDays: 5,
        },
      ],
    })
    const [desde, hasta] = $$('.dr-inputs input') as HTMLInputElement[]
    escribir(desde, '21/12/2026')
    escribir(hasta, '29/12/2026')
    // 21, 22, 23 (24 propio, 25 de ley, 26-27 fin de semana), 28, 29 → 5
    expect($('.dr-count').textContent).toBe('5 días hábiles')
    const navidad = $('.cal-day[data-d="2026-12-25"]')
    expect(navidad.className).toContain('hol')
    expect(navidad.getAttribute('aria-label')).toMatch(/\(Festivo\)$/)
    expect($('.cal-day[data-d="2026-12-26"]').className).toContain('off')
    escribir(hasta, '30/12/2026')
    expect($('.dr-count').textContent).toBe('6 días hábiles')
    boton('confirm').click()
    await esperar()
    expect($('.field.daterange .msg').textContent).toBe('Máximo 5 días hábiles.')
    escribir(hasta, '29/12/2026')
    boton('confirm').click()
    expect((await p).value).toEqual({ f: { from: '2026-12-21', to: '2026-12-29' } })
  })
})

describe('date con calendario', () => {
  it('escribe dd/mm/aaaa, abre el calendario con el botón o ↓, elige con Enter y valida', async () => {
    const p = form({
      title: 'X',
      fields: [{ name: 'ingreso', label: 'Ingreso', type: 'date', calendar: true, required: true, min: '2026-01-01' }],
    })
    const input = $<HTMLInputElement>('input[name=ingreso]') ?? $<HTMLInputElement>('.datecal input')
    expect(input.type).toBe('text')
    const abrirBtn = $<HTMLButtonElement>('.cal-btn')
    expect($('.cal-pop').hidden).toBe(true)
    abrirBtn.click()
    expect($('.cal-pop').hidden).toBe(false)
    expect(abrirBtn.getAttribute('aria-expanded')).toBe('true')
    escribir(input, '15/03/2026')
    expect($('.cal-day[data-d="2026-03-15"]').className).toContain('sel')
    $<HTMLButtonElement>('.cal-day[data-d="2026-03-20"]').click()
    expect(input.value).toBe('20/03/2026')
    expect($('.cal-pop').hidden).toBe(true)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect($('.cal-pop').hidden).toBe(false)
    $('.cal-pop').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect($('.cal-pop').hidden).toBe(true)
    escribir(input, '20/12/2025')
    boton('confirm').click()
    await esperar()
    expect($('.field.date .msg').textContent).toMatch(/entre/)
    escribir(input, '20/03/2026')
    boton('confirm').click()
    expect((await p).value).toEqual({ ingreso: '2026-03-20' })
  })
})

describe('exportar', () => {
  const cols = [
    { key: 'n', label: 'Número' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'ingreso', label: 'Ingreso', type: 'date' as const },
    { key: 'salario', label: 'Salario', type: 'number' as const },
  ]
  const rows = [
    { n: '1', nombre: 'Ana "Pérez"', ingreso: '2024-02-01', salario: 412.5 },
    { n: '2', nombre: 'Leo, López', ingreso: new Date('2023-11-15T00:00:00Z'), salario: 380 },
  ]

  it('CSV con BOM y comillas', () => {
    expect(toCSV(rows, cols)).toBe(
      '﻿Número,Nombre,Ingreso,Salario\r\n1,"Ana ""Pérez""",2024-02-01,412.5\r\n2,"Leo, López",2023-11-15,380\r\n',
    )
  })

  it('el .xlsx que genera se puede volver a leer (ida y vuelta) con fechas de verdad', async () => {
    const blob = await toXLSX(rows, { columns: cols, sheet: 'Empleados' })
    expect(blob.type).toContain('spreadsheetml')
    expect(await readXLSX(blob)).toEqual([
      ['Número', 'Nombre', 'Ingreso', 'Salario'],
      ['1', 'Ana "Pérez"', '2024-02-01', '412.5'],
      ['2', 'Leo, López', '2023-11-15', '380'],
    ])
  })
})

describe('pickRows con exportar', () => {
  it('exporta las seleccionadas, o todas las que coinciden si no hay selección', async () => {
    const onExport = vi.fn()
    const rows = [
      { id: '1', nombre: 'Ana' },
      { id: '2', nombre: 'Anabel' },
      { id: '3', nombre: 'Luis' },
    ]
    const p = pickRows({ rows, columns: [{ key: 'nombre', label: 'Nombre' }], onExport })
    await esperar()
    escribir($<HTMLInputElement>('input[type=search]'), 'ana')
    await esperar(150)
    expect($('.exp span').textContent).toBe('Exportar todo:')
    ;($$('.exp .link')[1] as HTMLButtonElement).click()
    await esperar()
    expect(onExport).toHaveBeenLastCalledWith([rows[0], rows[1]], 'csv')
    ;($$('tbody input')[0] as HTMLInputElement).click()
    expect($('.exp span').textContent).toBe('Exportar seleccionados:')
    ;($$('.exp .link')[0] as HTMLButtonElement).click()
    await esperar()
    expect(onExport).toHaveBeenLastCalledWith([rows[0]], 'xlsx')
    boton('cancel').click()
    await p
  })
})

describe('plantillas de RR. HH.', () => {
  it('las nueve abren con formFromJSON (sin resolvers) y tienen los campos clave', async () => {
    for (const [nombre, plantilla] of Object.entries(plantillas)) {
      localStorage.clear()
      const p = formFromJSON(sinResolvers(plantilla))
      await esperar()
      expect($('h2').textContent, nombre).toBe(plantilla.title)
      boton('cancel').click()
      await esperar()
      expect((await p).confirmed).toBe(false)
    }
    expect(plantillas.vacaciones.fields!.find((f) => f.name === 'fechas')).toMatchObject({ type: 'daterange', businessDays: true })
    expect(Object.keys(plantillas)).toHaveLength(9)
    expect(plantillas.evaluacion.steps!.map((p) => p.title)).toEqual(['Datos', 'Competencias', 'Resultado y compromisos'])
    expect(plantillas.capacitacion.fields!.find((f) => f.name === 'fechas')).toMatchObject({ type: 'daterange' })
    expect(plantillas.cambioPuesto.steps!.map((p) => p.title)).toEqual(['Movimiento', 'Antes y después', 'Justificación'])
    expect(plantillas.altaEmpleado.steps!.map((s) => s.title)).toEqual([
      'Datos personales',
      'Contacto y domicilio',
      'Puesto y sueldo',
      'Pago y documentos',
    ])
  })

  it('con resolvers, la validación por nombre funciona; sin ellos, avisa qué falta', async () => {
    await expect(formFromJSON(plantillas.altaEmpleado)).rejects.toThrow('falta el resolver «curpLibre»')
    const rfcLibre = vi.fn(() => null)
    const p = formFromJSON(plantillas.altaEmpleado, { resolvers: { rfcLibre, curpLibre: () => null, buscarCP: () => null } })
    await esperar()
    expect($('.stepper')).not.toBeNull()
    boton('cancel').click()
    await p
  })

  it('permiso: el motivo «Otro» muestra «¿Cuál?» y la duración cambia los campos', async () => {
    const p = formFromJSON(plantillas.permiso)
    await esperar()
    const campo = (n: string) => $(`[name=${n}]`)?.closest('.field, fieldset') as HTMLElement
    expect(campo('otro').hidden).toBe(true)
    escribir($<HTMLSelectElement>('select[name=motivo]'), 'Otro')
    expect(campo('otro').hidden).toBe(false)
    expect(($$('.field.daterange') as HTMLElement[])[0].hidden).toBe(false)
    ;($$('input[type=radio]').find((r) => (r as HTMLInputElement).value === 'Horas') as HTMLInputElement).click()
    expect(($$('.field.daterange') as HTMLElement[])[0].hidden).toBe(true)
    expect(campo('horas').hidden).toBe(false)
    boton('cancel').click()
    await esperar()
    boton('discard')?.click()
    await p
  })
})

describe('inglés', () => {
  it('calendario, hábiles y tabla en inglés', async () => {
    configure({ lang: 'en' })
    try {
      const p = form({
        title: 'X',
        confirmDiscard: false,
        fields: [{ name: 'f', label: 'Days', type: 'daterange', calendar: true, presets: false, businessDays: true }],
      })
      const [desde, hasta] = $$('.dr-inputs input') as HTMLInputElement[]
      expect(desde.placeholder).toBe('mm/dd/yyyy')
      escribir(desde, '11/09/2026')
      escribir(hasta, '11/13/2026')
      expect($('.dr-count').textContent).toBe('5 business days')
      expect($('.cal-title').textContent).toBe('November 2026')
      boton('cancel').click()
      await p
      const q = pickRows({ rows: [{ id: '1', nombre: 'Ana' }], columns: [{ key: 'nombre', label: 'Name' }], onExport: () => {} })
      await esperar()
      expect($('.exp span').textContent).toBe('Export all:')
      expect(boton('confirm').textContent).toBe('Choose')
      boton('cancel').click()
      await q
    } finally {
      configure({ lang: 'es' })
    }
  })
})
