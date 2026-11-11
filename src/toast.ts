/**
 * Toasts con cola: avisos breves que no interrumpen.
 *
 * ```ts
 * import { toast } from 'nexus-dialogs/toast'
 * toast.success('Empleado guardado')
 * toast('Se archivaron 3 recibos', { action: { label: 'Deshacer', onClick: deshacer } })
 * await toast.promise(guardar(), { loading: 'Guardando…', success: 'Guardado', error: (e) => e.message })
 * ```
 * Se monta dentro del diálogo modal de arriba cuando hay uno abierto (si no, quedaría inerte detrás).
 */
import { angosto, direccion, h, uid } from './core/dom'
import { icon } from './core/icons'
import { adopt } from './core/sheet'
import { en, es } from './i18n'
import { BUTTONS, VARS } from './styles'
import type { Scheme } from './types'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default'
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface ToastAction {
  label: string
  onClick: (id: string) => void
}

export interface ToastOptions {
  /** Para actualizar o cerrar este toast después. */
  id?: string
  title?: string
  message?: string
  type?: ToastType
  /** Milisegundos visible. 0 = hasta que lo cierren. Por omisión 4000 (error: 7000, loading: 0, con acción: 6000). */
  duration?: number
  /** Un botón dentro del toast («Deshacer», «Reintentar»). */
  action?: ToastAction
  /** Mostrar ×. Por omisión true. */
  closable?: boolean
  onClose?: (id: string) => void
}

export interface ToastConfig {
  position?: ToastPosition
  /** Cuántos se ven a la vez; los demás esperan en cola. Por omisión 3. */
  max?: number
  /** Duración por omisión en ms. */
  duration?: number
  lang?: 'es' | 'en'
  scheme?: Scheme
  /** Dirección del texto; 'auto' sigue a la página. */
  dir?: 'ltr' | 'rtl' | 'auto'
  theme?: Record<string, string>
}

interface Item {
  id: string
  o: ToastOptions
  el?: HTMLElement
  restante: number
  inicio: number
  timer?: ReturnType<typeof setTimeout>
}

const cfg: Required<Omit<ToastConfig, 'theme'>> & { theme: Record<string, string> } = {
  position: 'bottom-right',
  max: 3,
  duration: 4000,
  lang: 'es',
  scheme: 'light',
  dir: 'auto',
  theme: {},
}
const visibles: Item[] = []
const cola: Item[] = []
let host: HTMLElement | null = null
let lista: HTMLElement
let polite: HTMLElement
let assertive: HTMLElement
let pausado = false

const CSS_TOAST =
  VARS +
  BUTTONS +
  `
:host{all:initial;position:fixed!important;inset:0!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;
  background:transparent!important;overflow:visible!important;pointer-events:none;z-index:2147483000;font:14px/1.45 var(--_font);color:var(--_fg)}
*,*::before,*::after{box-sizing:border-box}
ol{position:fixed;margin:0;padding:16px;list-style:none;display:flex;flex-direction:column;gap:10px;width:min(400px,100%)}
.top-left,.top-center,.top-right{top:0}.bottom-left,.bottom-center,.bottom-right{bottom:0;flex-direction:column-reverse}
.top-left,.bottom-left{left:0}.top-right,.bottom-right{right:0}.top-center,.bottom-center{left:50%;transform:translateX(-50%)}
li{pointer-events:auto;position:relative;display:flex;gap:12px;align-items:flex-start;padding:14px 12px 14px 14px;border-radius:12px;
  background:var(--_bg);border:1px solid var(--_line);box-shadow:0 12px 16px -4px rgba(16,24,40,.08),0 4px 6px -2px rgba(16,24,40,.03);
  animation:in .22s cubic-bezier(.2,.8,.2,1)}
li.out{animation:out .18s forwards}
@keyframes in{from{opacity:0;transform:translateY(8px) scale(.98)}}
@keyframes out{to{opacity:0;transform:scale(.96)}}
.success{--c:var(--_success)}.error{--c:var(--_danger)}.warning{--c:var(--_warning)}.info{--c:var(--_info)}.loading{--c:var(--_accent)}
.icon{flex:none;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  color:var(--c);background:color-mix(in srgb,var(--c) 14%,var(--_bg));box-shadow:0 0 0 5px color-mix(in srgb,var(--c) 6%,var(--_bg));margin:2px 2px 0}
.icon svg{width:18px;height:18px}
.spin{flex:none;width:20px;height:20px;margin:8px;border-radius:50%;border:2px solid var(--_line);border-top-color:var(--_accent);animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(1turn)}}
.txt{flex:1;min-width:0}
.txt{padding-top:6px}
.t{font-weight:600;display:block;color:var(--_fg)}
.m{color:var(--_muted)}
.t+.m{display:block;margin-top:2px}
.t~.act{margin-top:10px}
.act{flex:none;height:32px;padding:0 6px;margin-top:2px;border:0;border-radius:8px;background:transparent;color:var(--_accent);font:600 14px var(--_font);cursor:pointer}
.act:hover{background:color-mix(in srgb,var(--_accent) 8%,var(--_bg))}
.act:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
.x{flex:none;width:28px;height:28px;margin:-4px -4px 0 0;border-radius:8px;border:0;background:transparent;color:var(--_muted);cursor:pointer;display:flex;align-items:center;justify-content:center}
.x{margin:0}
.x:hover{background:var(--_surface)}
.x:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
ol.narrow{width:100%;left:0;right:0;transform:none}
ol.narrow.bottom-left,ol.narrow.bottom-center,ol.narrow.bottom-right{top:0;bottom:auto;flex-direction:column}
@media (prefers-reduced-motion:reduce){li,li.out{animation:none}.spin{animation:none}.icon path{animation:none}}
`

const L = () => (cfg.lang === 'en' ? en : es)

/** El diálogo modal de arriba, si hay: los toasts deben vivir dentro o quedan inertes detrás de él. */
function modalArriba(): HTMLDialogElement | null {
  const abiertos = [...document.querySelectorAll('dialog')].filter((d) => {
    if (!d.open) return false
    // Los de nexus-dialogs siempre son modales; para los demás, :modal (si el navegador lo entiende).
    if (d.hasAttribute('data-nexus-dialog')) return true
    try {
      return d.matches(':modal')
    } catch {
      return true
    }
  })
  return abiertos[abiertos.length - 1] ?? null
}

function montar(): void {
  host?.setAttribute('dir', direccion(cfg.dir))
  if (!host) {
    host = h('div', { 'data-nexus-toast': '', 'data-scheme': cfg.scheme, dir: direccion(cfg.dir) })
    const root = host.attachShadow({ mode: 'open' })
    adopt(root, CSS_TOAST)
    lista = h('ol', { class: cfg.position, 'aria-label': L().notifications })
    angosto(lista)
    polite = h('div', { class: 'sr', role: 'status', 'aria-live': 'polite' })
    assertive = h('div', { class: 'sr', role: 'alert', 'aria-live': 'assertive' })
    lista.addEventListener('pointerenter', () => pausar(true))
    lista.addEventListener('pointerleave', () => pausar(false))
    lista.addEventListener('focusin', () => pausar(true))
    lista.addEventListener('focusout', () => pausar(false))
    root.append(polite, assertive, lista)
  }
  for (const [k, v] of Object.entries(cfg.theme)) host.style.setProperty(k.startsWith('--') ? k : `--nd-${k}`, v)
  const destino = modalArriba() ?? document.body
  if (host.parentNode !== destino) {
    const enfocado = host.isConnected ? (host.shadowRoot?.activeElement as HTMLElement | null) : null
    destino.appendChild(host)
    // En el body, el Popover API lo sube a la capa superior: queda sobre cualquier z-index de la página.
    if (destino === document.body && 'showPopover' in host) {
      host.setAttribute('popover', 'manual')
      try {
        ;(host as any).showPopover()
      } catch {}
    } else host.removeAttribute('popover')
    enfocado?.focus({ preventScroll: true })
  }
}

if (typeof document !== 'undefined') {
  const remontar = () => host && (visibles.length ? setTimeout(montar) : 0)
  document.addEventListener('nexus-dialogs:open', remontar)
  document.addEventListener('nexus-dialogs:close', () => setTimeout(remontar, 200))
  document.addEventListener('visibilitychange', () => pausar(document.hidden))
}

function anunciar(o: ToastOptions): void {
  const region = o.type === 'error' ? assertive : polite
  region.textContent = ''
  setTimeout(() => (region.textContent = [o.title, o.message].filter(Boolean).join('. ')), 50)
}

function duracion(o: ToastOptions): number {
  if (o.duration !== undefined) return o.duration
  if (o.type === 'loading') return 0
  if (o.type === 'error') return 7000
  if (o.action) return 6000
  return cfg.duration
}

function programar(it: Item): void {
  clearTimeout(it.timer)
  if (!it.restante || pausado) return
  it.inicio = Date.now()
  it.timer = setTimeout(() => dismiss(it.id), it.restante)
}

function pausar(si: boolean): void {
  if (si === pausado) return
  pausado = si
  for (const it of visibles) {
    if (!it.restante) continue
    if (si) {
      clearTimeout(it.timer)
      it.restante = Math.max(800, it.restante - (Date.now() - it.inicio))
    } else programar(it)
  }
}

function dibujar(it: Item): HTMLElement {
  const { o } = it
  const titulo = o.title ? h('strong', { class: 't' }, o.title) : null
  const mensaje = o.message ? h('span', { class: 'm' }, o.message) : null
  const li = h(
    'li',
    { class: o.type ?? 'default', 'data-id': it.id },
    o.type === 'loading' ? h('span', { class: 'spin', 'aria-hidden': 'true' }) : o.type && o.type !== 'default' ? icon(o.type) : null,
    h('div', { class: 'txt' }, titulo, mensaje),
    o.action
      ? h(
          'button',
          {
            type: 'button',
            class: 'act',
            onclick: () => {
              o.action!.onClick(it.id)
              dismiss(it.id)
            },
          },
          o.action.label,
        )
      : null,
    o.closable === false
      ? null
      : h(
          'button',
          { type: 'button', class: 'x', 'aria-label': L().dismiss, onclick: () => dismiss(it.id) },
          (() => {
            const t = document.createElement('template')
            t.innerHTML =
              '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
            return t.content.firstChild as Node
          })(),
        ),
  )
  return li
}

function mostrar(it: Item): void {
  montar()
  it.el = dibujar(it)
  lista.appendChild(it.el)
  visibles.push(it)
  anunciar(it.o)
  programar(it)
}

function siguiente(): void {
  while (visibles.length < cfg.max && cola.length) mostrar(cola.shift()!)
  if (!visibles.length && host) {
    host.remove()
  }
}

/** Muestra un toast. Devuelve su id. */
export function toast(message: string | ToastOptions, opciones: ToastOptions = {}): string {
  const o: ToastOptions = typeof message === 'string' ? { ...opciones, message } : { ...message }
  const id = o.id ?? uid('toast')
  if (o.id && (visibles.some((v) => v.id === id) || cola.some((v) => v.id === id))) {
    update(id, o)
    return id
  }
  const it: Item = { id, o, restante: duracion(o), inicio: 0 }
  if (visibles.length < cfg.max) mostrar(it)
  else cola.push(it)
  return id
}

/** Cambia un toast que ya está en pantalla (o en cola). Útil para pasar de «Guardando…» a «Guardado». */
export function update(id: string, cambios: ToastOptions): void {
  const it = visibles.find((v) => v.id === id) ?? cola.find((v) => v.id === id)
  if (!it) return
  it.o = { ...it.o, ...cambios }
  it.restante = duracion(it.o)
  if (it.el) {
    const nuevo = dibujar(it)
    it.el.replaceWith(nuevo)
    it.el = nuevo
    anunciar(it.o)
    programar(it)
  }
}

/** Cierra un toast, o todos si no le pasas id. */
export function dismiss(id?: string): void {
  if (id === undefined) {
    cola.length = 0
    for (const v of [...visibles]) dismiss(v.id)
    return
  }
  const q = cola.findIndex((v) => v.id === id)
  if (q >= 0) cola.splice(q, 1)
  const i = visibles.findIndex((v) => v.id === id)
  if (i < 0) return
  const [it] = visibles.splice(i, 1)
  clearTimeout(it.timer)
  const el = it.el
  const quitar = () => {
    el?.remove()
    siguiente()
  }
  if (el && !matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('out')
    setTimeout(quitar, 180)
  } else quitar()
  try {
    it.o.onClose?.(id)
  } catch (e) {
    console.error(e)
  }
}

/** Opciones globales de los toasts. */
export function configureToast(c: ToastConfig): void {
  const definidos = Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined))
  Object.assign(cfg, { ...definidos, theme: { ...cfg.theme, ...c.theme } })
  if (host) {
    host.setAttribute('data-scheme', cfg.scheme)
    host.setAttribute('dir', direccion(cfg.dir))
    lista.classList.remove('top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right')
    lista.classList.add(cfg.position)
    for (const [k, v] of Object.entries(cfg.theme)) host.style.setProperty(k.startsWith('--') ? k : `--nd-${k}`, v)
  }
}

type Atajo = (message: string, opciones?: ToastOptions) => string
const atajo =
  (type: ToastType): Atajo =>
  (message, opciones = {}) =>
    toast(message, { ...opciones, type })

export interface PromiseMessages<T> {
  loading: string
  success: string | ((value: T) => string)
  error: string | ((error: any) => string)
}

/** Muestra «cargando» mientras la promesa corre y luego éxito o error. Devuelve la misma promesa. */
function promise<T>(p: Promise<T>, m: PromiseMessages<T>, opciones: ToastOptions = {}): Promise<T> {
  const id = toast(m.loading, { ...opciones, type: 'loading' })
  p.then(
    (v) =>
      update(id, { type: 'success', message: typeof m.success === 'function' ? m.success(v) : m.success, duration: opciones.duration }),
    (e) => update(id, { type: 'error', message: typeof m.error === 'function' ? m.error(e) : m.error, duration: opciones.duration }),
  )
  return p
}

toast.success = atajo('success')
toast.error = atajo('error')
toast.warning = atajo('warning')
toast.info = atajo('info')
toast.loading = atajo('loading')
toast.promise = promise
toast.update = update
toast.dismiss = dismiss
toast.configure = configureToast
