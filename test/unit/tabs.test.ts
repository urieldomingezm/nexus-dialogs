import { describe, expect, it, vi } from 'vitest'
import { configure } from 'nexus-dialogs'
import { tabs, tabsDialog } from '../../src/tabs'
import { $, $$, boton, esperar } from './utilidades'

const dos = [
  { id: 'general', label: 'Datos generales', content: 'Folio 1024' },
  { id: 'cita', label: 'Cita y entrevista', content: 'Hora 9:00' },
]
const tecla = (el: Element, key: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
const sel = () => $$('[role=tab]').map((t) => t.getAttribute('aria-selected'))

describe('tabs()', () => {
  it('arma tablist/tab/tabpanel enlazados y abre la primera pestaña', () => {
    const c = tabs({ tabs: dos, label: 'Candidato' })
    document.body.append(c.el)
    const lista = c.el.querySelector('[role=tablist]')!
    expect(lista.getAttribute('aria-label')).toBe('Candidato')
    const [t1, t2] = [...c.el.querySelectorAll<HTMLElement>('[role=tab]')]
    const [p1, p2] = [...c.el.querySelectorAll<HTMLElement>('[role=tabpanel]')]
    expect(t1.getAttribute('aria-controls')).toBe(p1.id)
    expect(p1.getAttribute('aria-labelledby')).toBe(t1.id)
    expect([t1.getAttribute('aria-selected'), t2.getAttribute('aria-selected')]).toEqual(['true', 'false'])
    expect([t1.tabIndex, t2.tabIndex]).toEqual([0, -1])
    expect(p1.inert).toBe(false)
    expect(p2.inert).toBe(true)
    expect(p1.textContent).toBe('Folio 1024')
    expect(c.current).toBe('general')
  })

  it('el contenido se pone como texto: el HTML en cadena no se interpreta', () => {
    const c = tabs({ tabs: [{ id: 'a', label: 'A', content: '<img src=x onerror=alert(1)>' }] })
    expect(c.el.querySelector('img')).toBeNull()
    expect(c.panel('a')!.textContent).toContain('<img')
  })

  it('`html` pasa por sanitize', () => {
    configure({ sanitize: (s) => s.replace(/<script.*?<\/script>/g, '') })
    const c = tabs({ tabs: [{ id: 'a', label: 'A', html: '<b>Hola</b><script>x()</script>' }] })
    expect(c.panel('a')!.innerHTML).toBe('<div><b>Hola</b></div>')
    configure({ sanitize: null })
  })

  it('con strictHtml (por omisión) `html` se muestra como texto', () => {
    const c = tabs({ tabs: [{ id: 'a', label: 'A', html: '<b>Hola</b>' }] })
    expect(c.panel('a')!.querySelector('b')).toBeNull()
    expect(c.panel('a')!.textContent).toBe('<b>Hola</b>')
  })

  it('flechas, Inicio y Fin cambian de pestaña y dan la vuelta; saltan las deshabilitadas', () => {
    const c = tabs({ tabs: [...dos, { id: 'x', label: 'X', disabled: true }, { id: 'z', label: 'Z', content: 'z' }] })
    document.body.append(c.el)
    const t = [...c.el.querySelectorAll<HTMLElement>('[role=tab]')]
    tecla(t[0], 'ArrowRight')
    expect(c.current).toBe('cita')
    tecla(t[1], 'ArrowRight') // salta «x»
    expect(c.current).toBe('z')
    tecla(t[3], 'ArrowRight') // da la vuelta
    expect(c.current).toBe('general')
    tecla(t[0], 'End')
    expect(c.current).toBe('z')
    tecla(t[3], 'Home')
    expect(c.current).toBe('general')
    tecla(t[0], 'ArrowLeft') // hacia atrás, también da la vuelta
    expect(c.current).toBe('z')
  })

  it('en un contenedor RTL las flechas se invierten', () => {
    const caja = document.createElement('div')
    caja.dir = 'rtl'
    const c = tabs({ tabs: dos })
    caja.append(c.el)
    document.body.append(caja)
    const t = [...c.el.querySelectorAll<HTMLElement>('[role=tab]')]
    tecla(t[0], 'ArrowLeft')
    expect(c.current).toBe('cita')
  })

  it('una pestaña deshabilitada no se activa con clic ni con select()', () => {
    const c = tabs({ tabs: [dos[0], { ...dos[1], disabled: true }] })
    c.el.querySelectorAll<HTMLElement>('[role=tab]')[1].click()
    expect(c.current).toBe('general')
    expect(c.select('cita')).toBe(false)
    expect(c.select('no-existe')).toBe(false)
    c.setDisabled('cita', false)
    expect(c.select('cita')).toBe(true)
  })

  it('`initial` abre otra pestaña; si es inválida o está deshabilitada, la primera disponible', () => {
    expect(tabs({ tabs: dos, initial: 'cita' }).current).toBe('cita')
    expect(tabs({ tabs: dos, initial: 'nada' }).current).toBe('general')
    expect(tabs({ tabs: [{ ...dos[0], disabled: true }, dos[1]], initial: 'general' }).current).toBe('cita')
  })

  it('una función de contenido se llama una sola vez, al abrir la pestaña', () => {
    const f = vi.fn(() => 'Cita')
    const c = tabs({ tabs: [dos[0], { id: 'cita', label: 'Cita', content: f }] })
    expect(f).not.toHaveBeenCalled()
    c.select('cita')
    c.select('general')
    c.select('cita')
    expect(f).toHaveBeenCalledTimes(1)
    expect(c.panel('cita')!.textContent).toBe('Cita')
  })

  it('contenido async: muestra «Cargando…» y luego el resultado', async () => {
    const c = tabs({ tabs: [{ id: 'a', label: 'A', content: async () => 'Listo' }] })
    expect(c.panel('a')!.textContent).toBe('Cargando…')
    expect(c.panel('a')!.getAttribute('aria-busy')).toBe('true')
    await esperar()
    expect(c.panel('a')!.textContent).toBe('Listo')
    expect(c.panel('a')!.hasAttribute('aria-busy')).toBe(false)
  })

  it('si el contenido falla (síncrono o async) muestra un aviso con role=alert', async () => {
    const c = tabs({
      tabs: [
        {
          id: 'a',
          label: 'A',
          content: () => {
            throw new Error('x')
          },
        },
        {
          id: 'b',
          label: 'B',
          content: async () => {
            throw new Error('y')
          },
        },
      ],
    })
    expect(c.panel('a')!.querySelector('[role=alert]')?.textContent).toBe('No se pudo cargar esta pestaña.')
    c.select('b')
    await esperar()
    expect(c.panel('b')!.querySelector('[role=alert]')).toBeTruthy()
  })

  it('onChange se llama al abrir y al cambiar; badge y setBadge', () => {
    const onChange = vi.fn()
    const c = tabs({ tabs: [dos[0], { ...dos[1], badge: 3 }], onChange })
    expect(onChange).toHaveBeenCalledWith('general', c)
    const insignia = c.el.querySelectorAll<HTMLElement>('.tab-badge')
    expect([insignia[0].hidden, insignia[1].hidden, insignia[1].textContent]).toEqual([true, false, '3'])
    c.select('cita')
    expect(onChange).toHaveBeenLastCalledWith('cita', c)
    c.setBadge('cita', null)
    expect(insignia[1].hidden).toBe(true)
    c.setBadge('general', 5)
    expect([insignia[0].hidden, insignia[0].textContent]).toEqual([false, '5'])
  })

  it('exige al menos una pestaña y ids únicos', () => {
    expect(() => tabs({ tabs: [] })).toThrow(/al menos una/)
    expect(() => tabs({ tabs: [dos[0], dos[0]] })).toThrow(/únicos/)
  })
})

describe('tamaños de tabs()', () => {
  const clases = (o: Parameters<typeof tabs>[0]) => tabs(o).el.className
  it('md por omisión no agrega clase; sm y lg sí', () => {
    expect(clases({ tabs: dos })).toBe('tabs nofill')
    expect(clases({ tabs: dos, scale: 'md' })).toBe('tabs nofill')
    expect(clases({ tabs: dos, scale: 'sm' })).toContain('sc-sm')
    expect(clases({ tabs: dos, scale: 'lg' })).toContain('sc-lg')
  })
  it('fill: por omisión solo en segmented; se puede forzar en un sentido u otro', () => {
    expect(clases({ tabs: dos })).toContain('nofill')
    expect(clases({ tabs: dos, variant: 'segmented' })).toMatch(/ fill$/)
    expect(clases({ tabs: dos, fill: true })).toMatch(/ fill$/)
    expect(clases({ tabs: dos, variant: 'segmented', fill: false })).toContain('nofill')
  })
})

describe('tabsDialog()', () => {
  it('abre el diálogo con las pestañas, un botón «Cerrar» y el foco en la pestaña activa', async () => {
    const p = tabsDialog({ title: 'Ana Torres', tabs: dos, header: 'Citado' })
    expect($('.title').textContent).toBe('Ana Torres')
    expect($('.tabs-head').textContent).toBe('Citado')
    expect($('[role=tablist]').getAttribute('aria-label')).toBe('Ana Torres')
    expect(sel()).toEqual(['true', 'false'])
    expect($$('.foot button').map((b) => b.textContent)).toEqual(['Cerrar'])
    $$('[role=tab]')[1].click()
    expect($('[role=tabpanel]:not([inert])').textContent).toBe('Hora 9:00')
    boton('close').click()
    expect(await p).toMatchObject({ confirmed: true, reason: 'confirm' })
  })

  it('la función de contenido recibe el diálogo y onOpen recibe el control', async () => {
    let visto: unknown
    let control: unknown
    const p = tabsDialog({
      title: 'X',
      tabs: [
        {
          id: 'a',
          label: 'A',
          content: ({ ctx }) => {
            visto = ctx
            return 'a'
          },
        },
      ],
      onOpen: (_ctx, c) => (control = c),
    })
    expect(visto).toBeTruthy()
    expect((control as { current: string }).current).toBe('a')
    boton('close').click()
    await p
  })

  it('scale y fill llegan al diálogo', async () => {
    const p = tabsDialog({ title: 'X', tabs: dos, scale: 'lg', fill: true })
    expect($('.tabs').className).toContain('sc-lg')
    expect($('.tabs').className).toMatch(/ fill$/)
    boton('close').click()
    await p
  })

  it('segmented y height auto ponen su clase', async () => {
    const p = tabsDialog({ title: 'X', tabs: dos, variant: 'segmented', height: 'auto' })
    expect($('.tabs').classList.contains('seg')).toBe(true)
    expect($('.tabs').classList.contains('auto')).toBe(true)
    boton('close').click()
    await p
  })

  it('en inglés, el botón y los avisos salen en inglés', async () => {
    configure({ lang: 'en' })
    const p = tabsDialog({ title: 'X', tabs: [{ id: 'a', label: 'A', content: async () => 'ok' }] })
    expect($('[role=tabpanel]').textContent).toBe('Loading…')
    expect($$('.foot button').map((b) => b.textContent)).toEqual(['Close'])
    boton('close').click()
    await p
    configure({ lang: 'es' })
  })
})
