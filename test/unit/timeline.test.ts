import { describe, expect, it } from 'vitest'
import { configure } from 'nexus-dialogs'
import { timeline, timelineDialog, type TimelineStep } from '../../src/timeline'
import { $, $$, boton } from './utilidades'

const pasos: TimelineStep[] = [
  { id: 'cita', title: 'Cita', description: 'Cita registrada; falta confirmar asistencia.', date: '13/11/2026', status: 'current' },
  { id: 'neo', title: 'Enlace NEO', description: 'Sin liga de documentos registrada.', status: 'pending' },
  { id: 'docs', title: 'Documentos', status: 'pending' },
]
const textos = (el: Element, q: string) => [...el.querySelectorAll(q)].map((x) => x.textContent)

describe('timeline()', () => {
  it('lista ordenada con una etapa por elemento: número, título, descripción, fecha y estado en texto', () => {
    const t = timeline({ steps: pasos })
    const lis = [...t.el.querySelectorAll('ol > li')]
    expect(lis).toHaveLength(3)
    expect(t.el.querySelector('ol')!.getAttribute('role')).toBe('list')
    expect(textos(t.el, 'h3')).toEqual(['Cita', 'Enlace NEO', 'Documentos'])
    expect(lis[0].querySelector('.tl-mark')!.textContent).toBe('1')
    expect(lis[0].querySelector('.tl-desc')!.textContent).toBe('Cita registrada; falta confirmar asistencia.')
    expect(lis[0].querySelector('.tl-meta')!.textContent).toBe('13/11/2026En curso')
    expect(lis[1].querySelector('.tl-meta')!.textContent).toBe('Sin datoPendiente')
    expect(lis[2].querySelector('.tl-desc')).toBeNull()
  })

  it('la etapa en curso lleva aria-current="step"; el estado no depende solo del color', () => {
    const t = timeline({ steps: pasos })
    expect(t.el.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
    expect(t.el.querySelector('li.current')!.getAttribute('aria-current')).toBe('step')
    expect(textos(t.el, '.tl-chip')).toEqual(['En curso', 'Pendiente', 'Pendiente'])
    expect(t.el.querySelector('.tl-mark')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('resumen y barra: «0 de 3 etapas completadas · 0%» con progressbar accesible', () => {
    const t = timeline({ steps: pasos })
    expect(t.el.querySelector('.tl-sum p')!.textContent).toBe('0 de 3 etapas completadas · 0%')
    const b = t.el.querySelector('[role=progressbar]')!
    expect([b.getAttribute('aria-valuenow'), b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax')]).toEqual(['0', '0', '100'])
    expect(b.getAttribute('aria-label')).toBe('0 de 3 etapas completadas · 0%')
    expect(t.progress()).toEqual({ done: 0, total: 3, percent: 0 })
  })

  it('setStatus actualiza la etapa, el resumen y la barra; las omitidas no cuentan', () => {
    const t = timeline({ steps: [...pasos, { id: 'x', title: 'Extra', status: 'skipped' }] })
    expect(t.progress().total).toBe(3)
    expect(t.setStatus('cita', 'done', { date: new Date(2026, 10, 13) })).toBe(true)
    expect(t.progress()).toEqual({ done: 1, total: 3, percent: 33 })
    expect(t.el.querySelector('.tl-sum p')!.textContent).toBe('1 de 3 etapas completadas · 33%')
    expect((t.el.querySelector('.tl-bar div') as HTMLElement).style.width).toBe('33%')
    const li = t.el.querySelector('ol > li')!
    expect(li.className).toBe('done')
    expect(li.querySelector('.tl-mark svg')).toBeTruthy()
    expect(li.querySelector('time')!.getAttribute('datetime')).toBe('2026-11-13')
    expect(li.querySelector('time')!.textContent).toBe('13/11/2026')
    expect(li.hasAttribute('aria-current')).toBe(false)
    t.setStatus('neo', 'error', { statusLabel: 'Liga vencida' })
    expect(t.el.querySelectorAll('ol > li')[1].querySelector('.tl-chip')!.textContent).toBe('Liga vencida')
    expect(t.setStatus('nada', 'done')).toBe(false)
  })

  it('summary: false lo quita; un texto reemplaza al calculado; emptyDate lo personaliza u oculta', () => {
    expect(timeline({ steps: pasos, summary: false }).el.querySelector('.tl-sum')).toBeNull()
    expect(timeline({ steps: pasos, summary: 'Avance del candidato' }).el.querySelector('.tl-sum p')!.textContent).toBe(
      'Avance del candidato',
    )
    expect(textos(timeline({ steps: pasos, emptyDate: 'Por definir' }).el, '.tl-meta')[1]).toBe('Por definirPendiente')
    expect(textos(timeline({ steps: pasos, emptyDate: '' }).el, '.tl-meta')[1]).toBe('Pendiente')
  })

  it('el texto de las etapas entra como texto, no como HTML', () => {
    const t = timeline({ steps: [{ id: 'a', title: '<img src=x onerror=alert(1)>', description: '<b>x</b>', status: 'pending' }] })
    expect(t.el.querySelector('img')).toBeNull()
    expect(t.el.querySelector('b')).toBeNull()
  })

  it('singular, cero etapas e ids repetidos', () => {
    expect(timeline({ steps: [{ id: 'a', title: 'A', status: 'done' }] }).el.querySelector('.tl-sum p')!.textContent).toBe(
      '1 de 1 etapa completada · 100%',
    )
    expect(timeline({ steps: [] }).progress()).toEqual({ done: 0, total: 0, percent: 0 })
    expect(() => timeline({ steps: [pasos[0], pasos[0]] })).toThrow(/únicos/)
  })

  it('en inglés', () => {
    configure({ lang: 'en' })
    const t = timeline({ steps: pasos })
    expect(t.el.querySelector('.tl-sum p')!.textContent).toBe('0 of 3 steps completed · 0%')
    expect(textos(t.el, '.tl-chip')).toEqual(['In progress', 'Pending', 'Pending'])
    expect(textos(t.el, '.tl-meta')[1]).toBe('No dataPending')
    configure({ lang: 'es' })
  })
})

describe('tamaños y disposición de timeline()', () => {
  const clase = (o: Partial<Parameters<typeof timeline>[0]>) => timeline({ steps: pasos, ...o }).el.className
  it('md y vertical por omisión no agregan clases', () => {
    expect(clase({})).toBe('tl-wrap')
    expect(clase({ scale: 'md', layout: 'vertical' })).toBe('tl-wrap')
  })
  it('sm, lg y horizontal agregan su clase', () => {
    expect(clase({ scale: 'sm' })).toBe('tl-wrap sc-sm')
    expect(clase({ scale: 'lg', layout: 'horizontal' })).toBe('tl-wrap sc-lg h')
  })
})

describe('timelineDialog()', () => {
  it('abre el diálogo con el seguimiento, la nota al pie y un botón «Cerrar»', async () => {
    const p = timelineDialog({ title: 'Ortega Vázquez Mariela', steps: pasos, footnote: 'Los estados salen de MiQP y NEO.' })
    expect($('.title').textContent).toBe('Ortega Vázquez Mariela')
    expect($('ol[aria-label="Ortega Vázquez Mariela"]')).toBeTruthy()
    expect($$('ol > li')).toHaveLength(3)
    expect($('.note').textContent).toBe('Los estados salen de MiQP y NEO.')
    expect($$('.foot button').map((b) => b.textContent)).toEqual(['Cerrar'])
    boton('close').click()
    expect(await p).toMatchObject({ confirmed: true })
  })

  it('horizontal abre en xl por omisión; vertical en md; un size propio manda', async () => {
    const w = () => (document.querySelector('[data-nexus-host]') as HTMLElement).style.getPropertyValue('--_w')
    let p = timelineDialog({ title: 'A', steps: pasos, layout: 'horizontal' })
    expect(w()).toBe('860px')
    boton('close').click()
    await p
    p = timelineDialog({ title: 'B', steps: pasos })
    expect(w()).toBe('480px')
    boton('close').click()
    await p
    p = timelineDialog({ title: 'C', steps: pasos, layout: 'horizontal', size: 'lg' })
    expect(w()).toBe('640px')
    boton('close').click()
    await p
  })

  it('onOpen recibe el control para actualizar etapas con el diálogo abierto', async () => {
    const p = timelineDialog({ title: 'X', steps: pasos, onOpen: (_c, t) => t.setStatus('cita', 'done') })
    expect($('ol > li').className).toBe('done')
    expect($('.tl-sum p').textContent).toBe('1 de 3 etapas completadas · 33%')
    boton('close').click()
    await p
  })
})
