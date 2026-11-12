/**
 * Seguimiento por etapas, suelto (`timeline`) o dentro de un diálogo (`timelineDialog`): el avance de un candidato
 * (cita, enlace, documentos, revisión, contratación, ingreso), el estado de un trámite, un pedido.
 *
 * ```ts
 * import { timelineDialog } from 'nexus-dialogs/timeline'
 *
 * await timelineDialog({
 *   title: 'Ortega Vázquez Mariela Berenice',
 *   steps: [
 *     { id: 'cita', title: 'Cita', description: 'Cita registrada; falta confirmar asistencia.', date: '13/11/2026', status: 'current' },
 *     { id: 'docs', title: 'Documentos', description: 'Sin expediente recibido todavía.', status: 'pending' },
 *   ],
 *   footnote: 'Los estados salen de los registros de MiQP y NEO.',
 * })
 * ```
 * Cada etapa dice su estado con **texto** («Completada», «En curso», «Pendiente»…), no solo con color. Arriba va el resumen
 * «2 de 6 etapas completadas · 33 %» con su barra de progreso (las etapas `skipped` no cuentan).
 */
import { labels, language, openDialog } from 'nexus-dialogs'
import type { DialogContext, DialogOptions, DialogResult } from 'nexus-dialogs'
import { h, svg } from './core/dom'

export type StepStatus = 'done' | 'current' | 'pending' | 'error' | 'skipped'

const ES = {
  done: 'Completada',
  current: 'En curso',
  pending: 'Pendiente',
  error: 'Con problema',
  skipped: 'Omitida',
  noDate: 'Sin dato',
  sum: (n: number, t: number, p: number) => `${n} de ${t} ${t === 1 ? 'etapa completada' : 'etapas completadas'} · ${p}%`,
  loc: 'es-MX',
}
const EN = {
  done: 'Completed',
  current: 'In progress',
  pending: 'Pending',
  error: 'Problem',
  skipped: 'Skipped',
  noDate: 'No data',
  sum: (n: number, t: number, p: number) => `${n} of ${t} ${t === 1 ? 'step' : 'steps'} completed · ${p}%`,
  loc: 'en-US',
}
const T = () => (language() === 'en' ? EN : ES)

export interface TimelineStep {
  /** Identificador estable (para `setStatus`). */
  id: string
  title: string
  description?: string
  /** Texto libre («13/11/2026») o una `Date` (se formatea según el idioma). Vacío: «Sin dato». */
  date?: string | Date | null
  status: StepStatus
  /** Texto del estado si quieres otro («Esperando al candidato»). Por omisión, el del idioma. */
  statusLabel?: string
}

export interface TimelineOptions {
  steps: TimelineStep[]
  /** Resumen con barra de progreso. `false` lo quita; un texto reemplaza al calculado. Por omisión, calculado. */
  summary?: boolean | string
  /** Qué mostrar cuando una etapa no tiene fecha. `''` no muestra nada. Por omisión «Sin dato». */
  emptyDate?: string
  /** Nombre accesible de la lista. Por omisión, el título del diálogo. */
  label?: string
}

export interface TimelineProgress {
  done: number
  total: number
  percent: number
}

export interface TimelineControl {
  readonly el: HTMLElement
  progress(): TimelineProgress
  /** Cambia el estado de una etapa (y, si quieres, su fecha, descripción o texto de estado). `false` si no existe. */
  setStatus(id: string, status: StepStatus, extra?: Partial<Pick<TimelineStep, 'date' | 'description' | 'statusLabel'>>): boolean
}

const CSS = `
.tl-wrap:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus);border-radius:8px}
.tl-sum{margin:0 0 20px}
.tl-sum p{margin:0 0 8px;font-size:13px;color:var(--_subtle);font-variant-numeric:tabular-nums}
.tl-bar{height:8px;border-radius:4px;background:var(--_line);overflow:hidden}
.tl-bar div{height:100%;border-radius:4px;background:var(--_success);transition:width .25s}
.tl{list-style:none;margin:0;padding:0}
.tl>li{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr);column-gap:14px;padding-bottom:20px}
.tl>li:last-child{padding-bottom:0}
.tl>li:not(:last-child)::before{content:'';position:absolute;inset-inline-start:15px;top:32px;bottom:2px;width:2px;background:var(--_line)}
.tl>li.done:not(:last-child)::before{background:var(--_success)}
.tl-mark{grid-row:1/3;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;
  border:2px solid var(--c);color:var(--c);background:var(--_bg);font:600 13px var(--_font);font-variant-numeric:tabular-nums}
.tl>li.done .tl-mark{background:var(--c);color:var(--_bg)}
.tl>li.current .tl-mark{box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 18%,transparent)}
.tl>li.skipped .tl-mark{border-style:dashed}
.tl-mark svg{width:16px;height:16px}
.tl h3{margin:4px 0 2px;font:600 15px/1.3 var(--_font);color:var(--_fg)}
.tl>li.skipped h3{text-decoration:line-through;color:var(--_muted)}
.tl-desc{margin:0;font-size:14px;line-height:1.4;color:var(--_muted)}
.tl-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-top:6px;font-size:13px;color:var(--_subtle)}
.tl-meta:empty{display:none}
.tl-chip{padding:1px 10px;border-radius:999px;font-weight:600;font-size:12px;background:color-mix(in srgb,var(--c) 12%,var(--_bg));color:color-mix(in srgb,var(--c) 70%,var(--_fg))}
.tl>li{--c:var(--_muted)}
.tl>li.done{--c:var(--_success)}
.tl>li.current{--c:var(--_accent)}
.tl>li.error{--c:var(--_error)}
`

const PALOMA =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>'

function fecha(d: TimelineStep['date'], vacia: string): Node | null {
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    const t = h('time', { datetime: d.toISOString().slice(0, 10) })
    t.textContent = new Intl.DateTimeFormat(T().loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
    return t
  }
  const texto = typeof d === 'string' ? d.trim() : ''
  return texto ? document.createTextNode(texto) : vacia ? h('span', null, vacia) : null
}

/** Seguimiento para insertar donde quieras. En un diálogo propio agrega `styles: TIMELINE_CSS`. */
export function timeline(o: TimelineOptions): TimelineControl {
  const ids = new Set(o.steps.map((s) => s.id))
  if (ids.size !== o.steps.length) throw new Error('nexus-dialogs/timeline: los ids de las etapas deben ser únicos.')

  const pasos = o.steps.map((s) => ({ ...s }))
  const lista = h('ol', { class: 'tl', role: 'list', 'aria-label': o.label })
  const resumen = h('div', { class: 'tl-sum' })
  const barra = h('div', { class: 'tl-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('div'))
  const texto = h('p')
  resumen.append(texto, barra)
  // Región con nombre y enfocable: si el contenido es más alto que la pantalla, el teclado puede desplazarlo.
  const raiz = h(
    'div',
    { class: 'tl-wrap', role: 'region', 'aria-label': o.label, tabindex: '0' },
    o.summary === false ? null : resumen,
    lista,
  )

  const progreso = (): TimelineProgress => {
    const contables = pasos.filter((s) => s.status !== 'skipped')
    const done = contables.filter((s) => s.status === 'done').length
    return { done, total: contables.length, percent: contables.length ? Math.round((done / contables.length) * 100) : 0 }
  }

  function pintarResumen(): void {
    const p = progreso()
    const t = typeof o.summary === 'string' ? o.summary : T().sum(p.done, p.total, p.percent)
    texto.textContent = t
    barra.setAttribute('aria-valuenow', String(p.percent))
    barra.setAttribute('aria-valuetext', t)
    barra.setAttribute('aria-label', t)
    ;(barra.firstChild as HTMLElement).style.width = `${p.percent}%`
  }

  function pintar(i: number): HTMLElement {
    const s = pasos[i]
    const li = lista.children[i] as HTMLElement | undefined
    const nuevo = li ?? h('li')
    nuevo.className = s.status
    if (s.status === 'current') nuevo.setAttribute('aria-current', 'step')
    else nuevo.removeAttribute('aria-current')
    const marca = h('span', { class: 'tl-mark', 'aria-hidden': 'true' })
    if (s.status === 'done') marca.append(svg(PALOMA))
    else marca.textContent = String(i + 1)
    const meta = h('div', { class: 'tl-meta' })
    const f = fecha(s.date, o.emptyDate ?? T().noDate)
    if (f) meta.append(f)
    meta.append(h('span', { class: 'tl-chip' }, s.statusLabel ?? T()[s.status]))
    nuevo.replaceChildren(
      marca,
      h('h3', null, s.title),
      h('div', null, s.description ? h('p', { class: 'tl-desc' }, s.description) : null, meta),
    )
    return nuevo
  }

  pasos.forEach((_, i) => lista.append(pintar(i)))
  pintarResumen()

  return {
    el: raiz,
    progress: progreso,
    setStatus(id, status, extra) {
      const i = pasos.findIndex((s) => s.id === id)
      if (i < 0) return false
      pasos[i] = { ...pasos[i], ...extra, status }
      pintar(i)
      pintarResumen()
      return true
    },
  }
}

export interface TimelineDialogOptions<T = unknown> extends TimelineOptions, Omit<DialogOptions<T>, 'html' | 'onOpen'> {
  onOpen?: (ctx: DialogContext, control: TimelineControl) => void
}

/** Un diálogo con el seguimiento. Por omisión lleva un solo botón «Cerrar». Usa `footnote` para la nota al pie. */
export function timelineDialog<T = unknown>(o: TimelineDialogOptions<T>): Promise<DialogResult<T>> {
  const { steps, summary, emptyDate, label, onOpen, ...resto } = o
  let control!: TimelineControl
  return openDialog<T>({
    role: 'dialog',
    size: 'md',
    ...resto,
    moduleCss: CSS,
    buttons: o.buttons ?? [{ id: 'close', role: 'confirm', text: labels().close }],
    render: () => (control = timeline({ steps, summary, emptyDate, label: label ?? o.title })).el,
    onOpen: (ctx) => onOpen?.(ctx, control),
  } as Parameters<typeof openDialog<T>>[0])
}

/** Estilos del seguimiento, para quien use `timeline()` dentro de un diálogo propio (`styles: TIMELINE_CSS`). */
export const TIMELINE_CSS: string = CSS
