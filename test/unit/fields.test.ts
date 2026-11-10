import { describe, expect, it, vi } from 'vitest'
import { es } from 'nexus-dialogs'
import { form, wizard } from '../../src/forms'
import { defaultDatePresets } from '../../src/fields'
import { $, $$, abiertos, boton, escribir, esperar, raiz } from './utilidades'

const tecla = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }))
const opciones = () => $$('[role=option]').map((o) => o.querySelector('.cb-text span')!.textContent)

describe('combobox', () => {
  const personas = [
    { value: 'ana', label: 'Ana Torres', description: 'Almacén', group: 'Almacén' },
    { value: 'marta', label: 'Marta Gil', description: 'Nómina', group: 'Nómina' },
    { value: 'oscar', label: 'Óscar Núñez', description: 'Nómina', group: 'Nómina', disabled: true },
  ]

  it('filtra sin acentos, agrupa, navega con flechas y elige con Enter (sin enviar el formulario)', async () => {
    const p = form({ title: 'X', fields: [{ name: 'p', label: 'Persona', type: 'combobox', options: personas }] })
    const input = $<HTMLInputElement>('[role=combobox]')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    escribir(input, 'nomina')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(opciones()).toEqual(['Marta Gil', 'Óscar Núñez'])
    expect($('.cb-group').textContent).toBe('Nómina')
    expect(input.getAttribute('aria-activedescendant')).toBe($$('[role=option]')[0].id)
    tecla(input, 'ArrowDown') // Óscar está deshabilitado: se lo salta
    expect(input.getAttribute('aria-activedescendant')).toBe($$('[role=option]')[0].id)
    tecla(input, 'Enter')
    await esperar()
    expect(abiertos()).toBe(1)
    expect(input.value).toBe('Marta Gil')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    boton('confirm').click()
    expect((await p).value).toEqual({ p: 'marta' })
  })

  it('Esc con la lista abierta solo cierra la lista', async () => {
    const p = form({ title: 'X', fields: [{ name: 'p', label: 'Persona', type: 'combobox', options: personas }] })
    const input = $<HTMLInputElement>('[role=combobox]')
    escribir(input, 'a')
    tecla(input, 'Escape')
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await esperar()
    expect(abiertos()).toBe(1)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await esperar(300)
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect((await p).reason).toBe('escape')
  })

  it('múltiple: chips con «Quitar», máximo y Retroceso', async () => {
    const p = form({
      title: 'X',
      fields: [{ name: 'e', label: 'Equipo', type: 'combobox', multiple: true, maxItems: 2, options: personas, value: ['ana'] }],
    })
    expect($$('.cb-chips li span').map((s) => s.textContent)).toEqual(['Ana Torres'])
    expect($('.cb-x').getAttribute('aria-label')).toBe('Quitar Ana Torres')
    const input = $<HTMLInputElement>('[role=combobox]')
    expect($('[role=listbox]').getAttribute('aria-multiselectable')).toBe('true')
    escribir(input, 'marta')
    tecla(input, 'Enter')
    await esperar()
    expect($$('.cb-chips li span').map((s) => s.textContent)).toEqual(['Ana Torres', 'Marta Gil'])
    escribir(input, '')
    tecla(input, 'Backspace')
    expect($$('.cb-chips li span').map((s) => s.textContent)).toEqual(['Ana Torres'])
    boton('confirm').click()
    expect((await p).value).toEqual({ e: ['ana'] })
  })

  it('búsqueda async y «Crear»', async () => {
    const search = vi.fn(async (q: string) => ['Aceros del Norte', 'Abarrotes Lupita'].filter((x) => x.toLowerCase().includes(q)))
    const creatable = vi.fn(async (texto: string) => ({ value: 'id-99', label: texto }))
    const p = form({ title: 'X', fields: [{ name: 'c', label: 'Cliente', type: 'combobox', search, creatable, required: true }] })
    const input = $<HTMLInputElement>('[role=combobox]')
    escribir(input, 'ace')
    expect($('.cb-note').textContent).toBe('Buscando…')
    await esperar(300)
    expect(search).toHaveBeenCalledWith('ace')
    expect(opciones()).toEqual(['Aceros del Norte', 'Crear «ace»'])
    escribir(input, 'Bodegas Ramírez')
    await esperar(300)
    expect(opciones()).toEqual(['Crear «Bodegas Ramírez»'])
    tecla(input, 'Enter')
    await esperar()
    expect(creatable).toHaveBeenCalledWith('Bodegas Ramírez')
    boton('confirm').click()
    expect((await p).value).toEqual({ c: 'id-99' })
  })

  it('obligatorio vacío marca el error en el input', async () => {
    const p = form({ title: 'X', fields: [{ name: 'c', label: 'Cliente', type: 'combobox', options: personas, required: true }] })
    boton('confirm').click()
    await esperar()
    expect($('[role=combobox]').getAttribute('aria-invalid')).toBe('true')
    expect($('.msg').textContent).toBe(es.required)
    dispatchClose()
    await p
  })
})

const dispatchClose = () => (document.querySelector('dialog') as HTMLDialogElement).close()

describe('file', () => {
  const archivo = (nombre: string, tipo: string, bytes = 10) => new File([new Uint8Array(bytes)], nombre, { type: tipo })
  const poner = (files: File[]) => {
    const input = $<HTMLInputElement>('input[type=file]')
    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('filtra por tipo y peso, lista y quita archivos', async () => {
    const p = form({
      title: 'X',
      fields: [{ name: 'd', label: 'Documentos', type: 'file', multiple: true, accept: '.pdf,image/*', maxSize: 100 }],
    })
    expect($('button.btn-secondary').textContent).toBe('Elegir archivos')
    poner([
      archivo('a.pdf', 'application/pdf'),
      archivo('foto.png', 'image/png'),
      archivo('x.exe', 'application/x-msdownload'),
      archivo('grande.pdf', 'application/pdf', 500),
    ])
    expect($$('.f-name').map((n) => n.textContent)).toEqual(['a.pdf', 'foto.png'])
    expect($('.file-note').textContent).toContain('x.exe no se agregó')
    expect($('.file-note').textContent).toContain('grande.pdf no se agregó')
    ;($$('.files button')[0] as HTMLButtonElement).click()
    expect($$('.f-name').map((n) => n.textContent)).toEqual(['foto.png'])
    boton('confirm').click()
    const r = await p
    expect((r.value as any).d.map((f: File) => f.name)).toEqual(['foto.png'])
  })

  it('upload: progreso, error con reintento y bloqueo mientras sube', async () => {
    let falla = true
    let soltar!: () => void
    const upload = vi.fn(
      (file: File, progreso: (n: number) => void) =>
        new Promise((ok, mal) => {
          progreso(50)
          soltar = () => (falla ? mal(new Error('rechazado')) : ok(`id-${file.name}`))
        }),
    )
    const p = form({ title: 'X', fields: [{ name: 'd', label: 'Doc', type: 'file', upload }] })
    poner([archivo('a.pdf', 'application/pdf')])
    await esperar()
    expect($('[role=progressbar]').getAttribute('aria-valuenow')).toBe('50')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe('Espera a que terminen de subirse los archivos.')
    soltar()
    await esperar()
    expect($('.files li').className).toBe('error')
    falla = false
    ;($$('.files button')[0] as HTMLButtonElement).click() // Reintentar
    await esperar()
    soltar()
    await esperar()
    boton('confirm').click()
    expect((await p).value).toEqual({ d: 'id-a.pdf' })
  })
})

describe('daterange', () => {
  it('atajo de quincena, orden y máximo de días', async () => {
    const p = form({ title: 'X', fields: [{ name: 'r', label: 'Periodo', type: 'daterange', required: true, maxDays: 10 }] })
    expect($('fieldset legend').textContent).toContain('Periodo')
    const [desde, hasta] = $$('input[type=date]') as HTMLInputElement[]
    escribir(desde, '2026-11-20')
    escribir(hasta, '2026-11-10')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe('«Hasta» debe ser igual o posterior a «Desde».')
    escribir(hasta, '2026-12-31')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe('El rango es de máximo 10 días.')
    escribir(hasta, '2026-11-25')
    boton('confirm').click()
    expect((await p).value).toEqual({ r: { from: '2026-11-20', to: '2026-11-25' } })
  })

  it('los atajos marcan aria-pressed y calculan la quincena', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 1, 20)) // 20 feb 2026
    const [, , quincena, , mesPasado] = defaultDatePresets().map((x) => x.range())
    expect(quincena.map((d) => d.toDateString())).toEqual([new Date(2026, 1, 16).toDateString(), new Date(2026, 1, 28).toDateString()])
    expect(mesPasado.map((d) => d.getDate())).toEqual([1, 31])
    const p = form({ title: 'X', fields: [{ name: 'r', label: 'Periodo', type: 'daterange' }] })
    const chips = $$('.preset')
    chips[2].click()
    expect(chips[2].getAttribute('aria-pressed')).toBe('true')
    vi.useRealTimers()
    boton('confirm').click()
    expect((await p).value).toEqual({ r: { from: '2026-02-16', to: '2026-02-28' } })
  })
})

describe('otp', () => {
  it('solo dígitos, cajas visuales y envío automático al completar', async () => {
    const p = form({ title: 'X', fields: [{ name: 'c', label: 'Código', type: 'otp', length: 4, required: true }] })
    const input = $<HTMLInputElement>('.otp-input')
    expect(input.getAttribute('autocomplete')).toBe('one-time-code')
    expect(input.getAttribute('inputmode')).toBe('numeric')
    expect($$('.otp-box').length).toBe(4)
    escribir(input, '12a')
    expect(input.value).toBe('12')
    expect($$('.otp-box').map((b) => b.textContent)).toEqual(['1', '2', '', ''])
    escribir(input, '1234')
    expect((await p).value).toEqual({ c: '1234' })
  })

  it('incompleto marca error', async () => {
    const p = form({ title: 'X', fields: [{ name: 'c', label: 'Código', type: 'otp', autoSubmit: false }] })
    escribir($('.otp-input'), '12')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe('Escribe los 6 dígitos.')
    dispatchClose()
    await p
  })
})

describe('items', () => {
  const partidas = {
    name: 'partidas',
    label: 'Partidas',
    type: 'items' as const,
    required: true,
    maxRows: 3,
    fields: [
      { name: 'concepto', label: 'Concepto', required: true },
      { name: 'precio', label: 'Precio', type: 'money' as const, required: true },
    ],
    totals: (filas: Record<string, any>[]) => [{ label: 'Total', value: String(filas.reduce((s, f) => s + (f.precio || 0), 0)) }],
  }

  it('filas mínimas, agregar, quitar, máximo, totales y valores', async () => {
    const p = form({ title: 'X', confirmDiscard: false, fields: [partidas] })
    expect($$('.row[role=group]').length).toBe(1)
    expect($('.row[role=group]').getAttribute('aria-label')).toBe('Fila 1')
    expect(($('.row[role=group] .btn-cancel') as HTMLButtonElement).disabled).toBe(true) // mínimo 1
    const agregar = $('.rows-foot button') as HTMLButtonElement
    agregar.click()
    agregar.click()
    expect(agregar.disabled).toBe(true)
    const filas = $$('.row[role=group]')
    escribir(filas[0].querySelector('input')!, 'Hojas')
    escribir(filas[0].querySelectorAll('input')[1], '100')
    escribir(filas[1].querySelector('input')!, 'Tóner')
    escribir(filas[1].querySelectorAll('input')[1], '50.5')
    expect($('.totals dd').textContent).toBe('150.5')
    ;(filas[2].querySelector('.btn-cancel') as HTMLButtonElement).click()
    expect($$('.row[role=group]').length).toBe(2)
    expect($$('.row[role=group] .btn-cancel').map((b) => b.getAttribute('aria-label'))).toEqual(['Quitar fila 1', 'Quitar fila 2'])
    boton('confirm').click()
    expect((await p).value).toEqual({
      partidas: [
        { concepto: 'Hojas', precio: 100 },
        { concepto: 'Tóner', precio: 50.5 },
      ],
    })
  })

  it('valida cada fila y no marca errores antes de enviar', async () => {
    const p = form({ title: 'X', confirmDiscard: false, fields: [partidas] })
    const fila = $('.row[role=group]')
    fila.querySelector('input')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await esperar()
    expect($('.field.items').classList.contains('invalid')).toBe(false)
    boton('confirm').click()
    await esperar()
    expect($('.summary').textContent).toContain('Partidas: Revisa las filas marcadas.')
    expect(fila.querySelectorAll('[aria-invalid=true]').length).toBe(2)
    dispatchClose()
    await p
  })

  it('en el asistente, la revisión resume las filas', async () => {
    const p = wizard({
      title: 'X',
      review: true,
      confirmDiscard: false,
      steps: [{ title: 'Gasto', fields: [{ ...partidas, value: [{ concepto: 'Hojas', precio: 10 }] }] }],
    })
    boton('next').click()
    await esperar()
    expect($('.review dd').textContent).toBe('Hojas · $ 10.00 MXN')
    boton('confirm').click()
    expect((await p).confirmed).toBe(true)
    expect(raiz).toBeTypeOf('function')
  })
})
