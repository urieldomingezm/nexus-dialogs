/**
 * Pestañas accesibles, sueltas (`tabs`) o dentro de un diálogo (`tabsDialog`): el detalle de un candidato con
 * «Datos generales» y «Cita y entrevista», la ficha de un empleado, una encuesta con varias secciones.
 *
 * ```ts
 * import { tabsDialog } from 'nexus-dialogs/tabs'
 *
 * await tabsDialog({
 *   title: 'Ana Torres Reyes',
 *   tabs: [
 *     { id: 'general', label: 'Datos generales', content: () => tarjetaGeneral(candidato) },
 *     { id: 'cita', label: 'Cita y entrevista', content: () => tarjetaCita(candidato) },
 *   ],
 * })
 * ```
 * El contenido es texto o un nodo tuyo; si quieres HTML en cadena usa `html` (pasa por `sanitize` / `strictHtml`, como
 * el `html` de cualquier diálogo). Una función se llama la primera vez que se abre la pestaña y puede ser `async`.
 * Por omisión el diálogo conserva la altura de la pestaña más alta, así no «brinca» al cambiar de una a otra.
 */
import { labels, language, openDialog, setHtml } from 'nexus-dialogs'
import type { DialogContext, DialogOptions, DialogResult } from 'nexus-dialogs'
import { h, uid } from './core/dom'

const ES = { loading: 'Cargando…', failed: 'No se pudo cargar esta pestaña.' }
const EN = { loading: 'Loading…', failed: 'Could not load this tab.' }
const T = () => (language() === 'es' ? ES : EN)

/** Lo que recibe la función de contenido de una pestaña. */
export interface TabInfo {
  id: string
  /** El panel de la pestaña, por si quieres escribir en él directamente. */
  panel: HTMLElement
  /** El diálogo abierto (solo con `tabsDialog`). */
  ctx?: DialogContext
}

type Contenido = string | Node | null | undefined

export interface TabSpec {
  /** Identificador estable. Es lo que recibe `initial`, `select` y `onChange`. */
  id: string
  /** Texto de la pestaña. Corto: «Datos generales», no «Ver los datos generales del candidato». */
  label: string
  /** Texto, un nodo o una función que lo produce. La función se llama la primera vez que se abre la pestaña. */
  content?: Contenido | ((info: TabInfo) => Contenido | Promise<Contenido>)
  /** HTML en cadena. Pasa por `sanitize`; con `strictHtml` (por omisión) se muestra como texto. */
  html?: string
  /** Número o texto corto junto a la etiqueta: cuántas referencias hay, «Nuevo». */
  badge?: string | number
  disabled?: boolean
  /** Icono antes de la etiqueta: un nodo (por ejemplo un SVG) o las clases de tu fuente de iconos (`'bi bi-journal-text'`). */
  icon?: string | Node
}

export interface TabsOptions {
  tabs: TabSpec[]
  /** Pestaña que se abre primero. Por omisión, la primera que no esté deshabilitada. */
  initial?: string
  /** Nombre accesible de la lista de pestañas. Por omisión, el título del diálogo. */
  label?: string
  /**
   * `soft` (por omisión): pestañas que se reparten todo el ancho, con la activa sobre un fondo suave del color de acento.
   * `underline`: línea bajo la activa. `segmented`: control con la activa rellena.
   */
  variant?: 'soft' | 'underline' | 'segmented'
  /**
   * Tamaño de las pestañas: `sm` (34 px), `md` (42 px, por omisión) o `lg` (50 px). No cambia el ancho del diálogo: ese es `size`.
   * Para medidas propias usa las variables `--nd-tab-height`, `--nd-tab-font-size` y `--nd-tab-padding` (con `theme`).
   */
  scale?: 'sm' | 'md' | 'lg'
  /** Las pestañas se reparten todo el ancho por igual. Por omisión en `soft` y `segmented`; con muchas, conservan un ancho mínimo y la lista se desplaza. */
  fill?: boolean
  /**
   * `stable` (por omisión): todas las pestañas ocupan el mismo lugar y el conjunto mide lo que la más alta.
   * `auto`: mide lo que la pestaña activa.
   */
  height?: 'stable' | 'auto'
  /** Se llama al cambiar de pestaña (también al abrir la primera). */
  onChange?: (id: string, control: TabsControl) => void
}

export interface TabsControl {
  /** El elemento que insertas donde quieras. */
  readonly el: HTMLElement
  /** Id de la pestaña activa. */
  readonly current: string
  /** Activa una pestaña. `false` si no existe o está deshabilitada. */
  select(id: string, focus?: boolean): boolean
  /** El panel de una pestaña, o `null` si no existe. */
  panel(id: string): HTMLElement | null
  setBadge(id: string, badge: string | number | null): void
  setDisabled(id: string, disabled: boolean): void
}

const CSS = `
.tabs{min-width:0;container-type:inline-size;--tab-h:42px;--tab-fs:14px;--tab-px:14px}
.tabs.sc-sm{--tab-h:34px;--tab-fs:13px;--tab-px:10px}
.tabs.sc-lg{--tab-h:50px;--tab-fs:16px;--tab-px:18px}
.tabs-bar{position:sticky;top:0;z-index:2;background:var(--_bg);box-shadow:0 -20px 0 var(--_bg)}
.tabs-list{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--_line)}
.tabs-list::-webkit-scrollbar{display:none}
.tab{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:var(--nd-tab-height,var(--tab-h));padding:0 var(--nd-tab-padding,var(--tab-px));margin-bottom:-1px;border:0;border-bottom:2px solid transparent;
  background:none;color:var(--_muted);font:600 var(--nd-tab-font-size,var(--tab-fs)) var(--_font);cursor:pointer;white-space:nowrap}
.fill .tab{flex:1 0 0;min-width:max-content}
.tab:hover:not([aria-disabled=true]){color:var(--_fg)}
.tab[aria-selected=true]{color:color-mix(in srgb,var(--_accent) 65%,var(--_fg));border-bottom-color:var(--_accent)}
.tab[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.tab:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus);border-radius:8px}
.tab-badge{padding:0 7px;border-radius:999px;background:color-mix(in srgb,var(--_accent) 14%,var(--_bg));color:color-mix(in srgb,var(--_accent) 65%,var(--_fg));font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.tab-badge[hidden]{display:none}

.soft .tabs-list{gap:6px;padding:0;border:0}
.soft .tab{flex:1 1 0;min-width:max-content;margin:0;border:0;border-radius:10px;font-weight:500}
.soft.nofill .tab{flex:none}
.soft .tab:hover:not([aria-selected=true]):not([aria-disabled=true]){background:var(--_surface)}
.soft .tab[aria-selected=true]{background:color-mix(in srgb,var(--_accent) 14%,var(--_bg));color:color-mix(in srgb,var(--_accent) 55%,var(--_fg));font-weight:600}
.tab-ico{display:inline-flex;font-size:1.15em;line-height:1}
.tab-ico svg{width:1.15em;height:1.15em}
.seg .tabs-list{padding:4px;gap:4px;border:1px solid var(--_line);border-radius:999px;background:var(--_surface)}
.seg .tab{flex:1 1 0;height:calc(var(--nd-tab-height,var(--tab-h)) - 6px);margin:0;border:0;border-radius:999px}
.seg.nofill .tab{flex:none}
/* Contenedor angosto (celular, panel lateral): pestañas más compactas y la lista se desplaza en vez de encogerlas. */
@container (max-width:420px){.tab{padding:0 calc(var(--nd-tab-padding,var(--tab-px)) - 3px)}}
.seg .tab[aria-selected=true]{background:var(--_accent);color:var(--_accent-fg)}
.seg .tab[aria-selected=true] .tab-badge{background:color-mix(in srgb,var(--_accent-fg) 24%,transparent);color:var(--_accent-fg)}

.tabs-panels{display:grid;padding-top:16px}
.tabs-panels>.tab-panel{grid-area:1/1;min-width:0}
.tab-panel:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus);border-radius:8px}
.tab-panel[data-off]{visibility:hidden}
.auto .tabs-panels>.tab-panel[data-off]{display:none}
.tab-estado{margin:0;padding:24px 0;text-align:center;color:var(--_subtle);font-size:14px}
.tab-estado.error{color:var(--_error)}
.tabs-head{margin-bottom:20px;color:var(--_fg)}
.tabs-head:empty{display:none}
`

/** Pestañas para insertar donde quieras (dentro de un `form`, de un panel o de un diálogo propio con `render`). */
export function tabs(o: TabsOptions, ctx?: DialogContext): TabsControl {
  if (!o.tabs.length) throw new Error('nexus-dialogs/tabs: se necesita al menos una pestaña.')
  const ids = new Set(o.tabs.map((t) => t.id))
  if (ids.size !== o.tabs.length) throw new Error('nexus-dialogs/tabs: los ids de las pestañas deben ser únicos.')

  const base = uid('tabs')
  const variante = o.variant ?? 'soft'
  const lista = h('div', { class: 'tabs-list', role: 'tablist', 'aria-label': o.label })
  const paneles = h('div', { class: 'tabs-panels' })
  const raiz = h(
    'div',
    {
      class: `tabs${variante === 'segmented' ? ' seg' : variante === 'soft' ? ' soft' : ''}${o.height === 'auto' ? ' auto' : ''}${o.scale && o.scale !== 'md' ? ` sc-${o.scale}` : ''}${
        (o.fill ?? variante !== 'underline') ? ' fill' : ' nofill'
      }`,
    },
    h('div', { class: 'tabs-bar' }, lista),
    paneles,
  )

  const estado = o.tabs.map((spec, i) => {
    const insignia = h(
      'span',
      { class: 'tab-badge', hidden: spec.badge === undefined || spec.badge === null || spec.badge === '' },
      spec.badge,
    )
    const boton = h('button', {
      type: 'button',
      class: 'tab',
      role: 'tab',
      id: `${base}-t${i}`,
      'aria-controls': `${base}-p${i}`,
      'aria-selected': 'false',
      'aria-disabled': spec.disabled ? 'true' : null,
      tabindex: '-1',
    })
    if (spec.icon) {
      boton.append(
        typeof spec.icon === 'string'
          ? h('i', { class: `tab-ico ${spec.icon}`, 'aria-hidden': 'true' })
          : h('span', { class: 'tab-ico', 'aria-hidden': 'true' }, spec.icon),
      )
    }
    boton.append(spec.label, insignia)
    const panel = h('div', {
      class: 'tab-panel',
      role: 'tabpanel',
      id: `${base}-p${i}`,
      'aria-labelledby': boton.id,
      tabindex: '0',
      'data-off': '',
    })
    panel.inert = true
    lista.append(boton)
    paneles.append(panel)
    return { spec, boton, insignia, panel, cargado: false, deshabilitada: !!spec.disabled }
  })

  let actual = -1
  const indiceDe = (id: string): number => o.tabs.findIndex((t) => t.id === id)

  function pintar(e: (typeof estado)[number], c: Contenido): void {
    e.panel.replaceChildren()
    if (c === undefined || c === null) return
    e.panel.append(typeof c === 'string' ? document.createTextNode(c) : c)
  }

  async function cargar(i: number): Promise<void> {
    const e = estado[i]
    if (e.cargado) return
    e.cargado = true
    const { content, html } = e.spec
    if (html !== undefined) {
      const caja = h('div')
      setHtml(caja, html)
      e.panel.replaceChildren(caja)
      return
    }
    if (typeof content !== 'function') return pintar(e, content)
    let resultado: Contenido | Promise<Contenido>
    try {
      resultado = content({ id: e.spec.id, panel: e.panel, ctx })
    } catch {
      e.panel.replaceChildren(h('p', { class: 'tab-estado error', role: 'alert' }, T().failed))
      return
    }
    if (!(resultado instanceof Promise)) return pintar(e, resultado)
    e.panel.setAttribute('aria-busy', 'true')
    e.panel.replaceChildren(h('p', { class: 'tab-estado', role: 'status' }, T().loading))
    try {
      pintar(e, await resultado)
    } catch {
      e.panel.replaceChildren(h('p', { class: 'tab-estado error', role: 'alert' }, T().failed))
    } finally {
      e.panel.removeAttribute('aria-busy')
    }
  }

  function activar(i: number, enfocar: boolean): boolean {
    if (i < 0 || i >= estado.length || estado[i].deshabilitada) return false
    if (i === actual) {
      if (enfocar) estado[i].boton.focus()
      return true
    }
    const anterior = actual
    actual = i
    estado.forEach((e, k) => {
      const sel = k === i
      e.boton.setAttribute('aria-selected', String(sel))
      e.boton.tabIndex = sel ? 0 : -1
      e.panel.inert = !sel
      if (sel) e.panel.removeAttribute('data-off')
      else e.panel.setAttribute('data-off', '')
    })
    estado[i].boton.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })
    // Con altura estable la pestaña corta queda arriba: si venías bajando por la larga, vuelve al inicio del contenido.
    if (anterior >= 0) raiz.closest<HTMLElement>('.body')?.scrollTo?.({ top: 0 })
    if (enfocar) estado[i].boton.focus()
    void cargar(i)
    o.onChange?.(estado[i].spec.id, control)
    return true
  }

  lista.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<HTMLButtonElement>('.tab')
    if (b)
      activar(
        estado.findIndex((e) => e.boton === b),
        true,
      )
  })
  lista.addEventListener('keydown', (ev) => {
    const b = (ev.target as Element).closest('.tab')
    const i = estado.findIndex((e) => e.boton === b)
    if (i < 0) return
    const rtl = getComputedStyle(lista).direction === 'rtl'
    const paso = ev.key === 'ArrowRight' ? (rtl ? -1 : 1) : ev.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0
    let destino = -1
    if (paso) {
      for (let k = 1; k <= estado.length; k++) {
        const j = (i + paso * k + estado.length * k) % estado.length
        if (!estado[j].deshabilitada) {
          destino = j
          break
        }
      }
    } else if (ev.key === 'Home') destino = estado.findIndex((e) => !e.deshabilitada)
    else if (ev.key === 'End') destino = estado.map((e) => !e.deshabilitada).lastIndexOf(true)
    else return
    ev.preventDefault()
    if (destino >= 0) activar(destino, true)
  })

  const control: TabsControl = {
    el: raiz,
    get current() {
      return estado[actual]?.spec.id ?? ''
    },
    select: (id, focus = false) => activar(indiceDe(id), focus),
    panel: (id) => estado[indiceDe(id)]?.panel ?? null,
    setBadge(id, badge) {
      const e = estado[indiceDe(id)]
      if (!e) return
      e.insignia.textContent = badge === null ? '' : String(badge)
      e.insignia.hidden = badge === null || badge === ''
    },
    setDisabled(id, disabled) {
      const i = indiceDe(id)
      const e = estado[i]
      if (!e) return
      e.deshabilitada = disabled
      if (disabled) e.boton.setAttribute('aria-disabled', 'true')
      else e.boton.removeAttribute('aria-disabled')
      if (disabled && i === actual) {
        const otra = estado.findIndex((x) => !x.deshabilitada)
        if (otra >= 0) activar(otra, false)
      }
    },
  }

  const primera = o.initial !== undefined ? indiceDe(o.initial) : -1
  const inicio = primera >= 0 && !estado[primera].deshabilitada ? primera : estado.findIndex((e) => !e.deshabilitada)
  if (inicio >= 0) activar(inicio, false)
  return control
}

export interface TabsDialogOptions<T = unknown> extends TabsOptions, Omit<DialogOptions<T>, 'html' | 'onOpen'> {
  /** Resumen sobre las pestañas (nombre y estado, por ejemplo). Texto o un nodo. */
  header?: string | Node
  onOpen?: (ctx: DialogContext, control: TabsControl) => void
}

/** Un diálogo con pestañas. Por omisión lleva un solo botón «Cerrar»; pasa `buttons` para otra cosa. */
export function tabsDialog<T = unknown>(o: TabsDialogOptions<T>): Promise<DialogResult<T>> {
  const { tabs: especs, initial, label, variant, scale, fill, height, onChange, header, onOpen, ...resto } = o
  let control!: TabsControl
  return openDialog<T>({
    role: 'dialog',
    size: 'lg',
    initialFocus: '[role=tab][aria-selected=true]',
    buttons: [{ id: 'close', role: 'confirm', text: labels().close }],
    ...resto,
    moduleCss: CSS,
    render: (ctx) => {
      control = tabs({ tabs: especs, initial, label: label ?? o.title, variant, scale, fill, height, onChange }, ctx)
      const cabecera = h('div', { class: 'tabs-head' }, header)
      return h('div', null, cabecera, control.el)
    },
    onOpen: (ctx) => onOpen?.(ctx, control),
  } as Parameters<typeof openDialog<T>>[0])
}

/** Estilos de las pestañas, para quien las use con `tabs()` dentro de un diálogo propio (`styles: TABS_CSS`). */
export const TABS_CSS: string = CSS
