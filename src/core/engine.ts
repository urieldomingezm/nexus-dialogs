// Motor de diálogos: un <dialog> nativo (capa superior del navegador, fondo inerte, Esc) con un host dentro cuyo
// Shadow DOM tiene el contenido. Todos los diálogos públicos (alert, confirm, prompt, form, wizard) pasan por aquí.
import { config, labels, setHtml } from '../config'
import { CORE_CSS } from '../styles'
import type { ButtonSpec, CloseReason, DialogContext, DialogOptions, DialogResult, Dismissible, TimerControl } from '../types'
import { activeDeep, angosto, direccion, focusables, h, reducedMotion, uid } from './dom'
import { closeIcon, icon } from './icons'
import { adopt, globalStyles } from './sheet'

/** Lo devuelve `collect` cuando el contenido no es válido: el diálogo se queda abierto. */
export const INVALID: unique symbol = Symbol('nexus-dialogs.invalid')

export interface EngineOptions<T> extends DialogOptions<T> {
  /** alertdialog para avisos que interrumpen (alert, confirm); dialog para formularios. */
  role?: 'dialog' | 'alertdialog'
  /** Contenido propio dentro de .body. */
  render?: (ctx: DialogContext) => Node | null | void
  /** Valor al confirmar. Devuelve INVALID para no cerrar. */
  collect?: (ctx: DialogContext) => T | typeof INVALID | Promise<T | typeof INVALID>
  /** Intercepta los clics de botón. Devuelve true si ya lo manejó. */
  onAction?: (button: ButtonSpec, ctx: DialogContext) => boolean | Promise<boolean>
  /** CSS adicional del módulo (forms). */
  moduleCss?: string
  /** Dónde montar el `<dialog>` (por omisión `document.body`). Sigue siendo modal y en la capa superior. */
  target?: Element
  /** `false`: Enter dentro de un campo ya no confirma. */
  allowEnter?: boolean
  /** Cada vez que el diálogo entra o sale del estado «procesando». */
  onLoading?: (loading: boolean, ctx: DialogContext) => void
  /** Justo al empezar a cerrar, antes de la animación y de quitarlo del DOM. */
  onClosing?: (ctx: DialogContext) => void
}

interface Abierto {
  ctx: DialogContext
}
const pila: Abierto[] = []

/**
 * Si algo quita un diálogo del DOM sin cerrarlo (el router destruye la vista que lo contenía, `target.remove()`), el navegador no avisa:
 * la promesa quedaría colgada y la página sin scroll. Mientras haya diálogos abiertos, este vigía los cierra con reason 'program'.
 */
let vigia: MutationObserver | null = null
function vigilar(): void {
  if (pila.length && !vigia && typeof MutationObserver === 'function') {
    vigia = new MutationObserver(() => {
      for (const a of [...pila]) if (!a.ctx.dialog.isConnected) a.ctx.close('program')
    })
    vigia.observe(document.documentElement, { childList: true, subtree: true })
  } else if (!pila.length && vigia) {
    vigia.disconnect()
    vigia = null
  }
}

const SIZES = { sm: 400, md: 480, lg: 640, xl: 860 } as const

let bloqueos = 0
let padding: string | null = null
/** Bloquea el scroll de la página. Compensa el ancho de la barra para que el contenido no brinque. */
function bloquear(si: boolean): void {
  const antes = bloqueos
  bloqueos = Math.max(0, bloqueos + (si ? 1 : -1))
  const html = document.documentElement
  const body = document.body
  if (bloqueos && !antes) {
    const barra = window.innerWidth - html.clientWidth
    if (barra > 0) {
      padding = body.style.getPropertyValue('padding-right')
      const actual = parseFloat(getComputedStyle(body).paddingRight) || 0
      body.style.setProperty('padding-right', `${actual + barra}px`, 'important')
    }
    html.setAttribute('data-nexus-lock', '')
  } else if (!bloqueos && antes) {
    html.removeAttribute('data-nexus-lock')
    if (padding !== null) {
      if (padding) body.style.setProperty('padding-right', padding)
      else body.style.removeProperty('padding-right')
      padding = null
    }
  }
}

const emitir = (tipo: 'open' | 'close', dialog: HTMLDialogElement): void => {
  document.dispatchEvent(new CustomEvent(`nexus-dialogs:${tipo}`, { detail: { dialog } }))
}

function permisos(o: DialogOptions<any>): Required<Dismissible> {
  const lateral = o.placement === 'right' || o.placement === 'left'
  const base = { escape: true, backdrop: true, closeButton: lateral }
  if (o.dismissible === false) return { escape: false, backdrop: false, closeButton: false }
  if (o.dismissible === true || o.dismissible === undefined) return base
  return { ...base, ...o.dismissible }
}

const varianteDe = (b: ButtonSpec): string =>
  b.variant ?? (b.role === 'confirm' ? 'primary' : b.role === 'cancel' || b.role === 'deny' ? 'cancel' : 'secondary')

/** Abre un diálogo y resuelve cuando se cierra. Nunca rechaza: los errores de `preConfirm` se muestran dentro. */
export function openDialog<T = unknown>(opciones: EngineOptions<T>): Promise<DialogResult<T>> {
  const cfg = config()
  const L = labels()
  const o: EngineOptions<T> = { ...(cfg.defaults as EngineOptions<T>), ...opciones }
  const placement = o.placement ?? 'center'
  const puede = permisos(o)
  globalStyles()

  // ── Estructura ────────────────────────────────────────────────────────────
  const dialog = document.createElement('dialog')
  dialog.setAttribute('data-nexus-dialog', '')
  if (o.role === 'alertdialog') dialog.setAttribute('role', 'alertdialog')
  dialog.setAttribute('aria-label', o.title || o.text?.slice(0, 120) || L.info)
  if (o.title && o.text) dialog.setAttribute('aria-description', o.text)

  const host = h('div', { 'data-nexus-host': '', 'data-scheme': o.scheme ?? cfg.scheme, dir: direccion(o.dir ?? cfg.dir) })
  for (const [k, v] of Object.entries({ ...cfg.theme, ...o.theme })) host.style.setProperty(k.startsWith('--') ? k : `--nd-${k}`, v)
  const w = typeof o.size === 'number' ? o.size : o.size ? SIZES[o.size] : undefined
  if (w) host.style.setProperty('--_w', `${w}px`)
  const root = host.attachShadow({ mode: 'open' })
  adopt(root, CORE_CSS)
  if (o.moduleCss) adopt(root, o.moduleCss)
  if (o.styles) adopt(root, o.styles)

  const tituloId = uid('t')
  const titulo = o.title ? h('h2', { class: 'title', id: tituloId }, o.title) : null
  const texto = o.text ? h('p', { class: 'text' }, o.text) : null
  let html: HTMLElement | null = null
  if (o.html !== undefined) {
    html = h('div', { class: 'text html' })
    if (typeof o.html === 'string') setHtml(html, o.html)
    else html.appendChild(o.html)
  }
  // Las confirmaciones de peligro llevan la papelera; el icono va junto al título y solo se centra en avisos de un botón.
  const icono = o.icon ?? (o.danger && o.role === 'alertdialog' ? 'delete' : undefined)
  const centrado = !!icono && (o.buttons ? o.buttons.filter((b) => !b.hidden).length : 2) <= 1
  const head =
    titulo || texto || html || icono
      ? h('header', { class: centrado ? 'head centered' : icono ? 'head hi' : 'head' }, icono ? icon(icono) : null, h('div', null, titulo, texto, html))
      : null
  const body = h('div', { class: 'body' })
  const error = h('div', { class: 'err', role: 'alert', hidden: true })
  const foot = h('footer', { class: centrado ? 'foot plain' : 'foot' })
  const panel = h(
    'section',
    { class: ['panel', o.className].filter(Boolean).join(' '), 'aria-labelledby': titulo ? tituloId : null },
    head,
    body,
    error,
    foot,
  )
  if (puede.closeButton) {
    panel.classList.add('has-x')
    panel.appendChild(
      h('button', { type: 'button', class: 'x', 'aria-label': L.close, onclick: () => intentarCerrar('close') }, closeIcon()),
    )
  }
  const overlay = h('div', { class: 'overlay', 'aria-hidden': 'true' })
  const raiz = h(
    'div',
    { class: `p-${placement}${cfg.sheetOnMobile ? ' sheet' : ''}`, 'data-state': 'closed' },
    overlay,
    h('div', { class: 'wrap' }, panel),
  )
  root.appendChild(raiz)
  dialog.appendChild(host)
  const soltarAngosto = angosto(raiz)

  // ── Estado ────────────────────────────────────────────────────────────────
  let terminado = false
  let cargando = false
  let botones: ButtonSpec[] = []
  let resolver!: (r: DialogResult<T>) => void
  const promesa = new Promise<DialogResult<T>>((r) => (resolver = r))
  const previo = activeDeep()
  const textos = new Map<HTMLButtonElement, string>()

  let control: TimerControl | undefined
  const ctx: DialogContext = {
    dialog,
    root,
    body,
    close: (reason = 'program', value, confirmed = false) => terminar(reason, value as T, confirmed, reason === 'deny'),
    setLoading(si, txt) {
      cargando = si
      panel.setAttribute('aria-busy', String(si))
      o.onLoading?.(si, ctx)
      for (const b of foot.querySelectorAll('button')) {
        if (si) {
          textos.set(b, b.textContent ?? '')
          b.disabled = true
          if (b.dataset.role === 'confirm') b.textContent = txt ?? L.loading
        } else {
          if (textos.has(b)) b.textContent = textos.get(b)!
          const spec = botones.find((x) => x.id === b.dataset.id)
          b.disabled = !!spec?.disabled || (b.dataset.role === 'confirm' && bloqueadoPorTexto())
        }
      }
      if (!si) textos.clear()
    },
    setError(msg) {
      error.textContent = msg ?? ''
      error.hidden = !msg
    },
    setTitle(t) {
      if (titulo) titulo.textContent = t
      dialog.setAttribute('aria-label', t)
    },
    setButtons(specs) {
      botones = specs
      foot.replaceChildren(
        ...specs.map((b) =>
          h(
            'button',
            {
              type: 'button',
              class: `btn btn-${varianteDe(b)}`,
              'data-id': b.id,
              'data-role': b.role ?? 'custom',
              hidden: !!b.hidden,
              disabled: !!b.disabled || (b.role === 'confirm' && bloqueadoPorTexto()),
              onclick: () => void pulsar(b),
            },
            b.text,
          ),
        ),
      )
    },
    button: (id) => foot.querySelector<HTMLButtonElement>(`button[data-id="${CSS.escape(id)}"]`),
    get timer() {
      return control
    },
  }

  // ── Escribir para confirmar ───────────────────────────────────────────────
  let escrito: HTMLInputElement | null = null
  let bloqueEscrito: HTMLElement | null = null
  const bloqueadoPorTexto = (): boolean => !!o.requireText && escrito?.value !== o.requireText
  if (o.requireText) {
    const id = uid('c')
    const ayuda = uid('h')
    escrito = h('input', { id, class: 'input', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': ayuda })
    escrito.addEventListener('input', () => {
      const b = foot.querySelector<HTMLButtonElement>('button[data-role=confirm]')
      if (b && !cargando) b.disabled = bloqueadoPorTexto()
    })
    bloqueEscrito = h(
      'div',
      { class: 'typed' },
      h('label', { for: id }, `${L.typeToConfirm} `, h('code', null, o.requireText)),
      escrito,
      h('small', { id: ayuda }, L.typeToConfirmHelp),
    )
  }

  // Primero el contenido (qué se pierde) y al final el campo para escribir el nombre.
  const propio = o.render?.(ctx)
  if (propio) body.appendChild(propio)
  if (bloqueEscrito) body.appendChild(bloqueEscrito)
  if (o.footnote) body.appendChild(h('p', { class: 'note' }, o.footnote))

  ctx.setButtons(
    o.buttons ?? [
      { id: 'cancel', role: 'cancel', text: o.cancelText ?? L.cancel, variant: o.danger ? 'secondary' : 'cancel' },
      { id: 'confirm', role: 'confirm', text: o.confirmText ?? L.confirm, variant: o.danger ? 'danger' : 'primary' },
    ],
  )

  // ── Acciones ──────────────────────────────────────────────────────────────
  async function confirmar(): Promise<void> {
    if (bloqueadoPorTexto()) return
    ctx.setError(null)
    let valor: T | typeof INVALID | undefined = true as unknown as T
    if (o.collect) {
      valor = await o.collect(ctx)
      if (terminado || valor === INVALID) return // si cerraron mientras validaba, ya no se confirma nada
    }
    if (o.preConfirm) {
      ctx.setLoading(true)
      try {
        const r = await o.preConfirm(valor as T, ctx)
        if (terminado) return
        if (r === false) return ctx.setLoading(false)
        if (r !== undefined && r !== true) valor = r as T
      } catch (e) {
        if (terminado) return
        ctx.setLoading(false)
        ctx.setError(e instanceof Error ? e.message : String(e))
        return
      }
    }
    terminar('confirm', valor as T, true, false)
  }

  // Una acción a la vez: un doble clic (o Enter repetido) mientras algo async sigue en curso no la repite. Cancelar siempre se puede.
  let enCurso = false
  async function pulsar(b: ButtonSpec): Promise<void> {
    if (cargando || terminado) return
    const role = b.role ?? 'custom'
    if (role === 'cancel') return intentarCerrar('cancel')
    if (enCurso) return
    enCurso = true
    try {
      if (o.onAction && (await o.onAction(b, ctx))) return
      if (role === 'confirm') return await confirmar()
      if (role === 'deny') return terminar('deny', b.value as T, false, true)
      const r = b.onClick ? await b.onClick(ctx) : b.value
      if (r !== false && !terminado) terminar(b.id, (r === undefined ? b.value : r) as T, false, false)
    } finally {
      enCurso = false
    }
  }

  async function intentarCerrar(reason: CloseReason): Promise<void> {
    if (cargando || terminado) return
    if (reason === 'escape' && !puede.escape) return
    if (reason === 'backdrop' && !puede.backdrop) return
    if (o.beforeClose) {
      let ok = true
      try {
        ok = await o.beforeClose(reason, ctx)
      } catch {}
      if (!ok || terminado) return
    }
    terminar(reason, undefined, false, false)
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  let total = o.timer ?? 0
  let restante = total
  let inicio = 0
  let pausado = true
  let detenido = false
  let frame = 0
  const barra = restante && o.timerProgress !== false ? h('div', { class: 'timer', 'aria-hidden': 'true' }) : null
  if (barra) panel.appendChild(barra)
  const pintar = (queda: number): void => {
    if (barra) barra.style.transform = `scaleX(${Math.max(0, Math.min(1, queda / total))})`
  }
  const tick = (t: number): void => {
    if (pausado || terminado) return
    const queda = restante - (t - inicio)
    pintar(queda)
    if (queda <= 0) return terminar('timer', undefined, false, false)
    frame = requestAnimationFrame(tick)
  }
  const reanudar = (): void => {
    if (!total || !pausado || terminado || detenido) return
    pausado = false
    inicio = performance.now()
    frame = requestAnimationFrame(tick)
  }
  const pausar = (): void => {
    if (!total || pausado) return
    pausado = true
    cancelAnimationFrame(frame)
    restante -= performance.now() - inicio
  }
  const queda = (): number => Math.max(0, pausado ? restante : restante - (performance.now() - inicio))
  if (total) {
    control = {
      left: queda,
      running: () => !pausado && !terminado,
      stop() {
        const q = queda()
        detenido = true
        pausar()
        return q
      },
      resume() {
        detenido = false
        reanudar()
        return queda()
      },
      increase(ms) {
        if (terminado) return 0
        const corriendo = !pausado
        pausar()
        restante = Math.max(0, restante + ms)
        total = Math.max(total, restante)
        pintar(restante)
        if (corriendo) reanudar()
        return queda()
      },
    }
  }

  // ── Eventos ───────────────────────────────────────────────────────────────
  // Un control interno (la lista de un combobox) puede «consumir» el Esc: cierra lo suyo y el diálogo sigue abierto.
  // Chrome dispara 'cancel' aunque el keydown se haya cancelado, por eso se avisa con un evento propio.
  let escapeConsumido = -Infinity
  dialog.addEventListener('nexus-dialogs:escape', () => (escapeConsumido = performance.now()))
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault()
    if (performance.now() - escapeConsumido < 250) return
    void intentarCerrar('escape')
  })
  dialog.addEventListener('close', () => terminar('program', undefined, false, false))
  overlay.addEventListener('click', () => void intentarCerrar('backdrop'))
  root.addEventListener('keydown', (ev) => {
    const e = ev as KeyboardEvent
    if (o.allowEnter === false || e.key !== 'Enter' || e.isComposing || e.shiftKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement
    if (!(t instanceof HTMLInputElement) || ['button', 'submit', 'reset', 'file'].includes(t.type)) return
    // Enter = botón principal: confirmar o, en un asistente, «Siguiente».
    const b =
      foot.querySelector<HTMLButtonElement>('button[data-role=confirm]:not([hidden])') ??
      foot.querySelector<HTMLButtonElement>('button.btn-primary:not([hidden])')
    if (b && !b.disabled) {
      e.preventDefault()
      b.click()
    }
  })

  function terminar(reason: CloseReason, value: T | undefined, confirmed: boolean, denied: boolean): void {
    if (terminado) return
    terminado = true
    cancelAnimationFrame(frame)
    try {
      o.onClosing?.(ctx)
    } catch (e) {
      console.error(e)
    }
    soltarAngosto()
    const i = pila.findIndex((a) => a.ctx === ctx)
    if (i >= 0) pila.splice(i, 1)
    vigilar()
    raiz.setAttribute('data-state', 'closing')
    const fin = (): void => {
      if (dialog.open) {
        try {
          dialog.close()
        } catch {}
      }
      dialog.remove()
      bloquear(false)
      if (previo?.isConnected) previo.focus({ preventScroll: true })
      emitir('close', dialog)
      const r: DialogResult<T> = { confirmed, denied, value, reason }
      try {
        o.onClose?.(r)
      } catch (e) {
        console.error(e)
      }
      resolver(r)
    }
    if (reducedMotion() || !dialog.isConnected) fin()
    else setTimeout(fin, 180)
  }

  // ── Abrir ─────────────────────────────────────────────────────────────────
  ;(o.target?.isConnected ? o.target : document.body).appendChild(dialog)
  try {
    dialog.showModal()
  } catch {
    dialog.setAttribute('open', '')
  }
  bloquear(true)
  pila.push({ ctx })
  vigilar()
  emitir('open', dialog)
  requestAnimationFrame(() => raiz.setAttribute('data-state', 'open'))

  const destino = (): HTMLElement | null => {
    const f = o.initialFocus
    const btn = (r: string) => foot.querySelector<HTMLButtonElement>(`button[data-role=${r}]:not([hidden]):not([disabled])`)
    if (f === 'confirm') return btn('confirm')
    if (f === 'cancel') return btn('cancel')
    if (f && f !== 'first-field') return root.querySelector<HTMLElement>(f)
    // data-skip-initial: partes secundarias (la lada del teléfono) que no deben recibir el foco al abrir.
    const campo = focusables(body).find((e) => !e.hasAttribute('data-skip-initial'))
    if (campo && f !== undefined) return campo
    if (escrito) return escrito
    if (campo && body.querySelector('input,select,textarea')) return campo
    return o.danger ? btn('cancel') : (btn('confirm') ?? focusables(panel)[0] ?? null)
  }
  const foco = destino()
  if (foco) foco.focus({ preventScroll: true })
  else {
    panel.tabIndex = -1
    panel.focus({ preventScroll: true })
  }
  if (o.timer) {
    // Se pausa con el mouse o el foco del usuario encima (WCAG 2.2.1). El foco inicial no cuenta: se escucha después.
    let hover = false
    let foco = false
    panel.addEventListener('pointerenter', () => ((hover = true), pausar()))
    panel.addEventListener('pointerleave', () => ((hover = false), !foco && reanudar()))
    panel.addEventListener('focusin', () => ((foco = true), pausar()))
    panel.addEventListener('focusout', () =>
      setTimeout(() => {
        if (terminado) return
        foco = panel.contains(root.activeElement)
        if (!foco && !hover) reanudar()
      }),
    )
    reanudar()
  }
  try {
    o.onOpen?.(ctx)
  } catch (e) {
    console.error(e)
  }
  return promesa
}

/** Diálogos de nexus-dialogs abiertos ahora, del más antiguo al más reciente. */
export const openCount = (): number => pila.length

/** Cierra un diálogo concreto (el `<dialog>` que llega en `ctx.dialog` o en el evento `nexus-dialogs:open`). */
export function closeDialog(el: HTMLDialogElement, value?: unknown): boolean {
  const a = pila.find((x) => x.ctx.dialog === el)
  a?.ctx.close('program', value)
  return !!a
}

/** Cierra el diálogo de arriba (o todos) con reason 'program'. */
export function closeTop(value?: unknown, all = false): void {
  const lista = all ? [...pila].reverse() : pila.slice(-1)
  for (const a of lista) a.ctx.close('program', value)
}
