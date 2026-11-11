/**
 * Adaptador compatible con SweetAlert2: cambia el import y lo que ya tienes sigue funcionando.
 *
 * ```ts
 * // antes: import Swal from 'sweetalert2'
 * import Swal from 'nexus-dialogs/swal'
 *
 * const r = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar' })
 * if (r.isConfirmed) …
 * ```
 * Cubre lo que más se usa: fire, mixin, toasts, inputs, preConfirm, timer y los métodos estáticos comunes.
 * Los colores (`confirmButtonColor`…) y `customClass` se ignoran a propósito: se aplica el estándar de botones.
 */
import { dialog, INVALID, labels, openDialog } from 'nexus-dialogs'
import type { ButtonSpec, CloseReason, DialogContext, IconName } from 'nexus-dialogs'
import { toast, type ToastPosition } from 'nexus-dialogs/toast'
import { css, focusables, h, uid } from './core/dom'
import { closeIcon, icon as crearIcono } from './core/icons'

export type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question'
export type SweetAlertInput =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'range'
  | 'file'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'

export const DismissReason = { cancel: 'cancel', backdrop: 'backdrop', close: 'close', esc: 'esc', timer: 'timer' } as const
export type DismissReason = (typeof DismissReason)[keyof typeof DismissReason]

export interface SweetAlertResult<T = any> {
  isConfirmed: boolean
  isDenied: boolean
  isDismissed: boolean
  value?: T
  dismiss?: DismissReason
}

type Opciones = Record<string, string> | Map<string, string>
type Validador = (
  value: any,
  validationMessage?: string,
) => string | null | undefined | false | void | Promise<string | null | undefined | false | void>

export interface SweetAlertOptions {
  title?: string
  titleText?: string
  text?: string
  html?: string | HTMLElement
  icon?: SweetAlertIcon
  footer?: string
  toast?: boolean
  position?: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end'
  width?: number | string
  timer?: number
  timerProgressBar?: boolean
  showConfirmButton?: boolean
  showDenyButton?: boolean
  showCancelButton?: boolean
  showCloseButton?: boolean
  confirmButtonText?: string
  denyButtonText?: string
  cancelButtonText?: string
  focusConfirm?: boolean
  focusCancel?: boolean
  focusDeny?: boolean
  allowOutsideClick?: boolean | (() => boolean)
  allowEscapeKey?: boolean | (() => boolean)
  input?: SweetAlertInput
  inputLabel?: string
  inputPlaceholder?: string
  inputValue?: string | number | boolean
  inputOptions?: Opciones | Promise<Opciones>
  inputAttributes?: Record<string, string>
  inputValidator?: Validador
  validationMessage?: string
  preConfirm?: (inputValue: any) => any
  preDeny?: (value: any) => any
  willOpen?: (popup: HTMLElement) => void
  didOpen?: (popup: HTMLElement) => void
  didRender?: (popup: HTMLElement) => void
  willClose?: (popup: HTMLElement) => void
  didClose?: () => void
  iconHtml?: string
  imageUrl?: string
  imageWidth?: number | string
  imageHeight?: number | string
  imageAlt?: string
  progressSteps?: string[]
  currentProgressStep?: number
  progressStepsDistance?: number | string
  inputAutoTrim?: boolean
  inputAutoFocus?: boolean
  returnInputValueOnDeny?: boolean
  reverseButtons?: boolean
  allowEnterKey?: boolean
  /** `light`, `dark` o `auto`. Los demás temas de SweetAlert2 (bootstrap, material-ui…) se ignoran. */
  theme?: string
  /** Dónde montar el diálogo (selector o elemento). Sigue siendo modal. */
  target?: string | HTMLElement
  draggable?: boolean
  /** Selector o elemento `<template>` con `<swal-title>`, `<swal-html>`, `<swal-button>`, `<swal-param>`… */
  template?: string | HTMLTemplateElement
  closeButtonHtml?: string
  closeButtonAriaLabel?: string
  confirmButtonAriaLabel?: string
  denyButtonAriaLabel?: string
  cancelButtonAriaLabel?: string
  didDestroy?: () => void
  /** Extra de nexus-dialogs: botón principal rojo y foco en Cancelar. Se activa solo si el texto del botón dice eliminar/borrar/delete. */
  danger?: boolean
  /** Se aceptan (y se ignoran) el resto de opciones de SweetAlert2: colores, customClass, backdrop, etc. */
  [otra: string]: unknown
}

// ── Estado del diálogo abierto (para los métodos estáticos) ─────────────────
interface Entrada {
  ctx: DialogContext
  o: SweetAlertOptions
  campo: Campo | null
  input: () => HTMLElement | null
  forzado?: SweetAlertResult
  botonesOff: boolean
  inputOff: boolean
  tituloId: string
}
const pila: Entrada[] = []
const actual = () => pila[pila.length - 1]
const panelDe = (ctx: DialogContext): HTMLElement => ctx.root.querySelector<HTMLElement>('.panel')!
const buscar = (sel: string): HTMLElement | null => {
  const e = actual()
  return e ? e.ctx.root.querySelector<HTMLElement>(sel) : null
}

const PELIGRO = /(elimin|borr|delet|remov|quitar|destru|descart)/i
const RAZON: Partial<Record<CloseReason, DismissReason>> = {
  cancel: 'cancel',
  escape: 'esc',
  backdrop: 'backdrop',
  close: 'close',
  timer: 'timer',
}
const ICONOS: IconName[] = ['success', 'error', 'warning', 'info', 'question']

const textoPlano = (html: string): string => {
  const t = document.createElement('template')
  t.innerHTML = html
  return t.content.textContent?.trim() ?? ''
}

const valor = <T>(v: T | (() => T) | undefined, omision: T): T => (typeof v === 'function' ? (v as () => T)() : (v ?? omision))

function normalizar(args: unknown[]): SweetAlertOptions {
  if (typeof args[0] === 'object' && args[0] !== null) return { ...(args[0] as SweetAlertOptions) }
  const [title, html, icon] = args as [string?, string?, SweetAlertIcon?]
  return { title, html, icon }
}

const DIM = (v: number | string | undefined): string | undefined => (v === undefined ? undefined : typeof v === 'number' ? `${v}px` : v)

const valorParam = (v: string): unknown => {
  if (v === 'true') return true
  if (v === 'false') return false
  if (v !== '' && !Number.isNaN(Number(v))) return Number(v)
  if (/^[[{]/.test(v)) {
    try {
      return JSON.parse(v)
    } catch {}
  }
  return v
}

/** Lee un `<template>` de SweetAlert2: `<swal-title>`, `<swal-html>`, `<swal-icon>`, `<swal-image>`, `<swal-input>`, `<swal-button>`, `<swal-footer>` y `<swal-param>`. */
function leerPlantilla(t: string | HTMLTemplateElement): SweetAlertOptions {
  const el = typeof t === 'string' ? document.querySelector(t) : t
  if (!(el instanceof HTMLTemplateElement)) {
    console.warn('nexus-dialogs/swal: la plantilla no existe o no es un <template>:', t)
    return {}
  }
  const c = el.content
  const r: Record<string, unknown> = {}
  const uno = (tag: string) => c.querySelector(tag)
  const titulo = uno('swal-title')
  if (titulo) r.title = titulo.textContent?.trim()
  const html = uno('swal-html')
  if (html) r.html = html.innerHTML
  const pie = uno('swal-footer')
  if (pie) r.footer = pie.innerHTML
  const ic = uno('swal-icon')
  if (ic) {
    r.icon = ic.textContent?.trim()
    const color = ic.getAttribute('color')
    if (color) r.iconColor = color
  }
  const img = uno('swal-image')
  if (img) {
    r.imageUrl = img.getAttribute('src') ?? undefined
    r.imageWidth = img.getAttribute('width') ?? undefined
    r.imageHeight = img.getAttribute('height') ?? undefined
    r.imageAlt = img.getAttribute('alt') ?? undefined
  }
  const inp = uno('swal-input')
  if (inp) {
    r.input = inp.getAttribute('type') ?? 'text'
    const map: [string, string][] = [
      ['label', 'inputLabel'],
      ['placeholder', 'inputPlaceholder'],
      ['value', 'inputValue'],
    ]
    for (const [a, k] of map) if (inp.hasAttribute(a)) r[k] = inp.getAttribute(a)
    const opts = [...inp.querySelectorAll('swal-input-option')]
    if (opts.length) r.inputOptions = Object.fromEntries(opts.map((o) => [o.getAttribute('value') ?? '', o.textContent?.trim() ?? '']))
  }
  for (const b of c.querySelectorAll('swal-button')) {
    const tipo = b.getAttribute('type')
    if (tipo !== 'confirm' && tipo !== 'cancel' && tipo !== 'deny') continue
    r[`show${tipo[0]!.toUpperCase()}${tipo.slice(1)}Button`] = true
    if (b.textContent?.trim()) r[`${tipo}ButtonText`] = b.textContent.trim()
    const aria = b.getAttribute('aria-label')
    if (aria) r[`${tipo}ButtonAriaLabel`] = aria
  }
  // swal-function-param (código en atributos) no se acepta: sería evaluar texto.
  for (const p of c.querySelectorAll('swal-param')) {
    const n = p.getAttribute('name')
    if (n) r[n] = valorParam(p.getAttribute('value') ?? '')
  }
  return r as SweetAlertOptions
}

// ── Toasts ──────────────────────────────────────────────────────────────────
const POSICION: Record<string, ToastPosition> = {
  top: 'top-center',
  'top-start': 'top-left',
  'top-end': 'top-right',
  center: 'top-center',
  'center-start': 'top-left',
  'center-end': 'top-right',
  bottom: 'bottom-center',
  'bottom-start': 'bottom-left',
  'bottom-end': 'bottom-right',
}

function fireToast(o: SweetAlertOptions): Promise<SweetAlertResult> {
  const titulo = o.title ?? o.titleText
  const texto = o.text ?? (typeof o.html === 'string' ? textoPlano(o.html) : o.html?.textContent?.trim())
  if (o.position) toast.configure({ position: POSICION[o.position] ?? 'top-right' })
  const inicio = Date.now()
  return new Promise((resolver) => {
    toast({
      type: o.icon === 'question' ? 'info' : (o.icon ?? 'default'),
      title: texto ? titulo : undefined,
      message: texto ?? titulo ?? '',
      duration: o.timer ?? 0,
      onClose: () => {
        const porTiempo = !!o.timer && Date.now() - inicio >= o.timer - 100
        resolver({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: porTiempo ? 'timer' : 'close' })
        o.didClose?.()
      },
    })
  })
}

// ── Campo (input) ───────────────────────────────────────────────────────────
interface Campo {
  el: Node
  leer: () => unknown
  enfocar: () => void
  input: () => HTMLElement | null
  mensajeInvalido: () => string | null
  desactivar: (si: boolean) => void
}

async function crearCampo(o: SweetAlertOptions): Promise<Campo | null> {
  if (!o.input) return null
  const id = uid('sw')
  const tipo = o.input
  const atributos = o.inputAttributes ?? {}
  const opcionesBrutas = o.inputOptions ? await o.inputOptions : undefined
  const opciones = opcionesBrutas ? [...(opcionesBrutas instanceof Map ? opcionesBrutas : Object.entries(opcionesBrutas))] : []
  const etiqueta = o.inputLabel ? h('label', { for: id }, o.inputLabel) : null
  const nombreAccesible = o.inputLabel ? null : (o.title ?? o.titleText ?? o.inputPlaceholder ?? null)

  if (tipo === 'radio') {
    const nombre = uid('swr')
    const radios = opciones.map(([v, l]) =>
      h(
        'label',
        { class: 'check' },
        h('input', { type: 'radio', name: nombre, value: v, checked: String(o.inputValue ?? '') === v }),
        h('span', null, l),
      ),
    )
    const grupo = css(h('div', { role: 'radiogroup', 'aria-label': o.inputLabel ?? nombreAccesible }, ...radios), {
      display: 'grid',
      gap: '8px',
    })
    const sel = () => grupo.querySelector<HTMLInputElement>('input:checked')
    return {
      el: grupo,
      leer: () => sel()?.value ?? null,
      enfocar: () => (sel() ?? grupo.querySelector<HTMLInputElement>('input'))?.focus(),
      input: () => grupo,
      mensajeInvalido: () => null,
      desactivar: (si) => grupo.querySelectorAll('input').forEach((r) => (r.disabled = si)),
    }
  }
  if (tipo === 'checkbox') {
    const cb = h('input', { type: 'checkbox', id, checked: !!o.inputValue && o.inputValue !== '0' })
    const el = css(h('label', { class: 'check' }, cb, h('span', null, o.inputPlaceholder ?? o.inputLabel ?? '')), {
      display: 'flex',
      gap: '10px',
      'align-items': 'center',
    })
    return {
      el,
      leer: () => (cb.checked ? 1 : 0),
      enfocar: () => cb.focus(),
      input: () => cb,
      mensajeInvalido: () => null,
      desactivar: (si) => (cb.disabled = si),
    }
  }

  let campo: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  const comunes = { id, class: 'input', placeholder: tipo === 'select' ? null : o.inputPlaceholder, 'aria-label': nombreAccesible }
  if (tipo === 'textarea') campo = h('textarea', { ...comunes, rows: 4 })
  else if (tipo === 'select') {
    campo = h(
      'select',
      comunes,
      o.inputPlaceholder ? h('option', { value: '', disabled: true, selected: true }, o.inputPlaceholder) : null,
      ...opciones.map(([v, l]) => h('option', { value: v }, l)),
    )
  } else campo = h('input', { ...comunes, type: tipo })
  for (const [k, v] of Object.entries(atributos)) campo.setAttribute(k, v)
  // Los de tipo file no aceptan asignar value (solo la cadena vacía).
  if (o.inputValue !== undefined && o.inputValue !== null && tipo !== 'file') campo.value = String(o.inputValue)
  // range: muestra el valor actual junto al control, como SweetAlert2.
  let salida: HTMLOutputElement | null = null
  if (tipo === 'range') {
    salida = h('output', { class: 'swal-range-out', for: id }, campo.value)
    campo.addEventListener('input', () => (salida!.textContent = campo.value))
  }
  const el = h('div', { class: tipo === 'range' ? 'field swal-range' : 'field' }, etiqueta, campo, salida)
  return {
    el,
    leer: () => {
      if (tipo === 'file') {
        const f = (campo as HTMLInputElement).files
        if (!f?.length) return null
        return campo.hasAttribute('multiple') ? f : f[0]
      }
      return campo.value
    },
    enfocar: () => campo.focus(),
    input: () => campo,
    desactivar: (si) => (campo.disabled = si),
    mensajeInvalido: () => {
      const v = campo.value
      if (tipo === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return o.validationMessage ?? 'Correo no válido.'
      if (tipo === 'url' && v) {
        try {
          new URL(v)
        } catch {
          return o.validationMessage ?? 'Dirección web no válida.'
        }
      }
      if ('checkValidity' in campo && !campo.checkValidity()) return o.validationMessage ?? campo.validationMessage
      return null
    },
  }
}

/** Valor del campo como lo entrega SweetAlert2: los textos se recortan salvo `inputAutoTrim: false`. */
const leerCampo = (o: SweetAlertOptions, campo: Campo): unknown => {
  const v = campo.leer()
  const crudo = o.input === 'select' || o.input === 'radio' || o.input === 'checkbox' || o.input === 'file'
  return typeof v === 'string' && !crudo && o.inputAutoTrim !== false ? v.trim() : v
}

// ── Piezas que se pintan fuera del motor (imagen, pasos, icono propio, botones) ─────
const CSS_SWAL = `.check{display:flex;gap:10px;align-items:center;cursor:pointer}.check input{width:18px;height:18px;margin:0;accent-color:var(--_accent)}
.swal-img{display:block;max-width:100%;height:auto;margin:0 0 12px;border-radius:var(--_control-radius)}.head.centered .swal-img{margin-inline:auto}
.swal-steps{list-style:none;display:flex;align-items:center;margin:0 0 14px;padding:0}.head.centered .swal-steps{justify-content:center}
.swal-step{display:flex;align-items:center}
.swal-dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:600 12px/1 var(--_font);background:var(--_surface);color:var(--_muted);border:1px solid var(--_border)}
.swal-step[aria-current=step] .swal-dot,.swal-step.is-done .swal-dot{background:var(--_accent);color:var(--_accent-fg);border-color:var(--_accent)}
.swal-line{width:var(--swal-d,2.5em);height:2px;background:var(--_border)}.swal-step.is-done .swal-line{background:var(--_accent)}
.swal-range{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center}.swal-range label{grid-column:1/-1}.swal-range .input{padding:0;accent-color:var(--_accent)}
.swal-range-out{font:600 14px/1 var(--_font);color:var(--_fg)}
.head.drag{cursor:move;touch-action:none;user-select:none}`

/** Reconstruye la cabecera (icono, imagen, pasos, título, texto, html) y el pie con las opciones actuales. */
function pintarCabecera(e: Entrada): void {
  const { ctx, o } = e
  const panel = panelDe(ctx)
  const titulo = o.title ?? o.titleText
  const ic = o.icon && ICONOS.includes(o.icon) ? o.icon : undefined
  const nBotones = [o.showConfirmButton !== false, !!o.showDenyButton, !!o.showCancelButton].filter(Boolean).length
  const centrado = !!ic && nBotones <= 1
  const cuerpo = h('div')
  if (o.imageUrl) {
    const img = h('img', { class: 'swal-img', src: o.imageUrl, alt: o.imageAlt ?? '' })
    css(img, {
      ...(o.imageWidth !== undefined ? { width: DIM(o.imageWidth)! } : {}),
      ...(o.imageHeight !== undefined ? { height: DIM(o.imageHeight)! } : {}),
    })
    cuerpo.appendChild(img)
  }
  if (o.progressSteps?.length) {
    const actual = o.currentProgressStep ?? 0
    const lista = h(
      'ol',
      { class: 'swal-steps', 'aria-label': `${actual + 1} / ${o.progressSteps.length}` },
      ...o.progressSteps.flatMap((t, i) => [
        h(
          'li',
          { class: `swal-step${i < actual ? ' is-done' : ''}`, 'aria-current': i === actual ? 'step' : null },
          h('span', { class: 'swal-dot' }, t),
          i < o.progressSteps!.length - 1 ? h('span', { class: 'swal-line', 'aria-hidden': 'true' }) : null,
        ),
      ]),
    )
    if (o.progressStepsDistance !== undefined) lista.style.setProperty('--swal-d', DIM(o.progressStepsDistance)!)
    cuerpo.appendChild(lista)
  }
  if (titulo) cuerpo.appendChild(h('h2', { class: 'title', id: e.tituloId }, titulo))
  if (o.text) cuerpo.appendChild(h('p', { class: 'text' }, o.text))
  if (o.html !== undefined) {
    const caja = h('div', { class: 'text html' })
    if (typeof o.html === 'string') caja.innerHTML = o.html
    else caja.appendChild(o.html)
    cuerpo.appendChild(caja)
  }
  const iconoEl = ic ? crearIcono(ic) : null
  if (iconoEl && o.iconHtml) iconoEl.innerHTML = o.iconHtml
  const previa = panel.querySelector('.head')
  const nueva = h('header', { class: `${centrado ? 'head centered' : 'head'}${o.draggable ? ' drag' : ''}` }, iconoEl, cuerpo)
  if (!iconoEl && !cuerpo.childNodes.length) {
    previa?.remove()
  } else if (previa) previa.replaceWith(nueva)
  else panel.insertBefore(nueva, panel.querySelector('.body'))
  panel.querySelector('.foot')?.classList.toggle('plain', centrado)
  // Pie de página
  const body = panel.querySelector('.body')!
  const nota = body.querySelector('.note')
  if (o.footer) {
    if (nota) nota.textContent = textoPlano(o.footer)
    else body.appendChild(h('p', { class: 'note' }, textoPlano(o.footer)))
  } else nota?.remove()
  panel.setAttribute('aria-labelledby', titulo ? e.tituloId : '')
  if (!titulo) panel.removeAttribute('aria-labelledby')
  ctx.dialog.setAttribute('aria-label', titulo || o.text?.slice(0, 120) || labels().info)
}

function pintarCerrar(e: Entrada): void {
  const { ctx, o } = e
  const panel = panelDe(ctx)
  let x = panel.querySelector<HTMLButtonElement>('.x')
  if (o.showCloseButton) {
    if (!x) {
      x = h('button', { type: 'button', class: 'x', onclick: () => ctx.close('close') }, closeIcon())
      panel.appendChild(x)
      panel.classList.add('has-x')
    }
    x.setAttribute('aria-label', o.closeButtonAriaLabel ?? labels().close)
    if (o.closeButtonHtml) x.innerHTML = o.closeButtonHtml
  } else if (x) {
    x.remove()
    panel.classList.remove('has-x')
  }
}

function construirBotones(e: Entrada): ButtonSpec[] {
  const { o } = e
  const textoConfirmar = o.confirmButtonText ?? labels().ok
  const peligro = o.danger ?? (!!o.showCancelButton && PELIGRO.test(textoConfirmar))
  const botones: ButtonSpec[] = []
  if (o.showCancelButton)
    botones.push({
      id: 'cancel',
      role: 'cancel',
      text: o.cancelButtonText ?? labels().cancel,
      variant: peligro || o.showDenyButton ? 'secondary' : 'cancel',
    })
  if (o.showDenyButton) {
    botones.push({
      id: 'deny',
      text: o.denyButtonText ?? labels().no,
      variant: 'cancel',
      onClick: async (ctx) => {
        const v = o.returnInputValueOnDeny && e.campo ? leerCampo(o, e.campo) : false
        if (!o.preDeny) return ctx.close('deny', v)
        ctx.setLoading(true)
        try {
          const r = await o.preDeny(v)
          ctx.setLoading(false)
          if (r === false) return false
          ctx.close('deny', r === undefined || r === true ? v : r)
        } catch (err) {
          ctx.setLoading(false)
          ctx.setError(err instanceof Error ? err.message : String(err))
          return false
        }
      },
    })
  }
  if (o.showConfirmButton !== false)
    botones.push({ id: 'confirm', role: 'confirm', text: textoConfirmar, variant: peligro ? 'danger' : 'primary' })
  // El orden propio es Cancelar, Denegar, Confirmar; `reverseButtons` pone el principal primero.
  return o.reverseButtons ? botones.reverse() : botones
}

function aplicarBotones(e: Entrada): void {
  e.ctx.setButtons(construirBotones(e))
  etiquetarBotones(e)
}

function etiquetarBotones(e: Entrada): void {
  const { ctx, o } = e
  const aria: [string, string | undefined][] = [
    ['confirm', o.confirmButtonAriaLabel],
    ['deny', o.denyButtonAriaLabel],
    ['cancel', o.cancelButtonAriaLabel],
  ]
  for (const [id, texto] of aria) if (texto) ctx.button(id)?.setAttribute('aria-label', texto)
  if (e.botonesOff) for (const b of ctx.root.querySelectorAll<HTMLButtonElement>('.foot button')) b.disabled = true
}

/** `draggable`: se arrastra el panel desde la cabecera con el mouse o el dedo. */
function hacerArrastrable(panel: HTMLElement): void {
  let ox = 0
  let oy = 0
  let sx = 0
  let sy = 0
  let activo = false
  panel.addEventListener('pointerdown', (ev) => {
    const t = ev.target as Element
    if (ev.button !== 0 || !t.closest('.head') || t.closest('button,a,input,select,textarea')) return
    activo = true
    sx = ev.clientX - ox
    sy = ev.clientY - oy
    panel.setPointerCapture(ev.pointerId)
  })
  panel.addEventListener('pointermove', (ev) => {
    if (!activo) return
    ox = ev.clientX - sx
    oy = ev.clientY - sy
    panel.style.setProperty('translate', `${ox}px ${oy}px`)
  })
  const soltar = (ev: PointerEvent) => {
    activo = false
    if (panel.hasPointerCapture(ev.pointerId)) panel.releasePointerCapture(ev.pointerId)
  }
  panel.addEventListener('pointerup', soltar)
  panel.addEventListener('pointercancel', soltar)
}

const completar = (r: Partial<SweetAlertResult>): SweetAlertResult => ({
  isConfirmed: !!r.isConfirmed,
  isDenied: !!r.isDenied,
  isDismissed: r.isDismissed ?? !(r.isConfirmed || r.isDenied),
  ...('value' in r ? { value: r.value } : {}),
  ...(r.dismiss ? { dismiss: r.dismiss } : {}),
})

// ── fire ────────────────────────────────────────────────────────────────────
async function fireCon(defaults: SweetAlertOptions, args: unknown[]): Promise<SweetAlertResult> {
  const dado = normalizar(args)
  const plantilla = dado.template ?? defaults.template
  const o: SweetAlertOptions = { ...defaults, ...(plantilla ? leerPlantilla(plantilla) : {}), ...dado }
  if (o.toast) return fireToast(o)

  const titulo = o.title ?? o.titleText
  const textoConfirmar = o.confirmButtonText ?? labels().ok
  const peligro = o.danger ?? (!!o.showCancelButton && PELIGRO.test(textoConfirmar))
  const campo = await crearCampo(o)
  const e: Entrada = {
    ctx: undefined as unknown as DialogContext,
    o,
    campo,
    input: () => campo?.input() ?? null,
    botonesOff: false,
    inputOff: false,
    tituloId: '',
  }

  const ancho =
    typeof o.width === 'number' ? o.width : typeof o.width === 'string' && /^\d+(px)?$/.test(o.width) ? parseInt(o.width, 10) : undefined
  const enfoque =
    campo && o.inputAutoFocus !== false ? 'first-field' : o.focusCancel || peligro ? 'cancel' : o.focusDeny ? '[data-id=deny]' : 'confirm'
  const objetivo = typeof o.target === 'string' ? document.querySelector(o.target) : o.target
  const esquema = o.theme === 'dark' || o.theme === 'light' || o.theme === 'auto' ? o.theme : undefined

  const r = await openDialog<unknown>({
    role: campo ? 'dialog' : 'alertdialog',
    title: titulo,
    text: o.text,
    html: o.html,
    icon: o.icon && ICONOS.includes(o.icon) ? o.icon : undefined,
    footnote: o.footer ? textoPlano(o.footer) : undefined,
    size: ancho,
    timer: o.timer,
    timerProgress: !!o.timerProgressBar,
    scheme: esquema,
    target: objetivo ?? undefined,
    allowEnter: o.allowEnterKey,
    buttons: construirBotones(e),
    initialFocus: enfoque,
    dismissible: {
      escape: valor(o.allowEscapeKey, true),
      backdrop: valor(o.allowOutsideClick, true),
      closeButton: !!o.showCloseButton,
    },
    render: () => (campo ? h('div', null, campo.el) : null),
    collect: async (ctx) => {
      if (!campo) return true
      const v = leerCampo(o, campo)
      const nativo = campo.mensajeInvalido()
      const propio = !nativo && o.inputValidator ? await o.inputValidator(v, o.validationMessage) : null
      const msg = nativo || propio || null
      ctx.setError(msg)
      if (msg) {
        campo.enfocar()
        return INVALID
      }
      return v
    },
    preConfirm: o.preConfirm
      ? async (v) => {
          const r = await o.preConfirm!(v)
          return r === undefined ? v : r
        }
      : undefined,
    moduleCss: CSS_SWAL,
    onOpen: (ctx) => {
      e.ctx = ctx
      pila.push(e)
      const panel = panelDe(ctx)
      e.tituloId = panel.getAttribute('aria-labelledby') ?? uid('t')
      // Lo que el motor no pinta: imagen, pasos, icono propio, etiquetas de los botones.
      if (o.imageUrl || o.progressSteps?.length || o.iconHtml || o.draggable) pintarCabecera(e)
      pintarCerrar(e)
      etiquetarBotones(e)
      if (o.draggable) hacerArrastrable(panel)
      o.willOpen?.(panel)
      o.didRender?.(panel)
      o.didOpen?.(panel)
    },
    onClosing: (ctx) => {
      try {
        o.willClose?.(panelDe(ctx))
      } catch (err) {
        console.error(err)
      }
    },
    onClose: () => {
      const i = pila.indexOf(e)
      if (i >= 0) pila.splice(i, 1)
    },
  })
  try {
    o.didClose?.()
    o.didDestroy?.()
  } catch (err) {
    console.error(err)
  }
  if (e.forzado) return e.forzado
  if (r.confirmed) return { isConfirmed: true, isDenied: false, isDismissed: false, value: r.value }
  if (r.reason === 'deny') return { isConfirmed: false, isDenied: true, isDismissed: false, value: r.value ?? false }
  return { isConfirmed: false, isDenied: false, isDismissed: true, dismiss: RAZON[r.reason] }
}

const PARAMS_ACTUALIZABLES = [
  'title',
  'titleText',
  'text',
  'html',
  'icon',
  'iconHtml',
  'footer',
  'imageUrl',
  'imageWidth',
  'imageHeight',
  'imageAlt',
  'progressSteps',
  'currentProgressStep',
  'progressStepsDistance',
  'showConfirmButton',
  'showDenyButton',
  'showCancelButton',
  'showCloseButton',
  'confirmButtonText',
  'denyButtonText',
  'cancelButtonText',
  'confirmButtonAriaLabel',
  'denyButtonAriaLabel',
  'cancelButtonAriaLabel',
  'closeButtonAriaLabel',
  'closeButtonHtml',
  'reverseButtons',
  'draggable',
]

function actualizar(nuevas: SweetAlertOptions): void {
  const e = actual()
  if (!e) return
  for (const k of Object.keys(nuevas)) {
    if (!PARAMS_ACTUALIZABLES.includes(k)) console.warn(`nexus-dialogs/swal: «${k}» no se puede cambiar con Swal.update().`)
    else (e.o as Record<string, unknown>)[k] = nuevas[k]
  }
  if ('title' in nuevas && !('titleText' in nuevas)) delete e.o.titleText
  pintarCabecera(e)
  pintarCerrar(e)
  aplicarBotones(e)
}

function crear(defaults: SweetAlertOptions) {
  const t = () => actual()?.ctx.timer
  return {
    /** Abre una alerta. `Swal.fire(título, html, icono)` o `Swal.fire({ … })`. */
    fire: (...args: [SweetAlertOptions] | [string?, string?, SweetAlertIcon?]): Promise<SweetAlertResult> => fireCon(defaults, args),
    /** Instancia con opciones por omisión: `const Toast = Swal.mixin({ toast: true, timer: 3000 })`. */
    mixin: (mas: SweetAlertOptions) => crear({ ...defaults, ...mas }),
    /** Cierra la alerta. Con un resultado, `fire()` resuelve con él: `Swal.close({ isConfirmed: true, value })`. */
    close: (resultado?: Partial<SweetAlertResult>) => {
      const e = actual()
      if (!e) return
      e.forzado = resultado ? completar(resultado) : undefined
      e.ctx.close('program', resultado?.value, !!resultado?.isConfirmed)
    },
    isVisible: () => dialog.isOpen(),
    isLoading: () => !!actual()?.ctx.root.querySelector('.panel[aria-busy=true]'),
    showLoading: () => actual()?.ctx.setLoading(true),
    hideLoading: () => actual()?.ctx.setLoading(false),
    showValidationMessage: (mensaje: string) => actual()?.ctx.setError(mensaje),
    resetValidationMessage: () => actual()?.ctx.setError(null),
    /** Cambia lo que se ve de la alerta abierta (título, texto, html, icono, imagen, pasos, botones…). */
    update: actualizar,
    // Piezas. El «popup» es el panel (dentro del Shadow DOM): `querySelector` sobre él funciona como en SweetAlert2.
    getContainer: () => actual()?.ctx.dialog ?? null,
    getPopup: () => (actual() ? panelDe(actual()!.ctx) : null),
    getTitle: () => buscar('.title'),
    getHtmlContainer: () => buscar('.html'),
    getIcon: () => buscar('.icon'),
    getIconContent: () => buscar('.icon svg'),
    getImage: () => buscar('.swal-img'),
    getCloseButton: () => buscar('.x'),
    getActions: () => buscar('.foot'),
    getFooter: () => buscar('.note'),
    getTimerProgressBar: () => buscar('.timer'),
    getProgressSteps: () => buscar('.swal-steps'),
    getValidationMessage: () => buscar('.err'),
    getInputLabel: () => buscar('.body label'),
    getFocusableElements: () => (actual() ? focusables(panelDe(actual()!.ctx)) : []),
    getInput: () => actual()?.input() ?? null,
    getConfirmButton: () => actual()?.ctx.button('confirm') ?? null,
    getCancelButton: () => actual()?.ctx.button('cancel') ?? null,
    getDenyButton: () => actual()?.ctx.button('deny') ?? null,
    clickConfirm: () => actual()?.ctx.button('confirm')?.click(),
    clickCancel: () => actual()?.ctx.button('cancel')?.click(),
    clickDeny: () => actual()?.ctx.button('deny')?.click(),
    enableButtons: () => {
      const e = actual()
      if (!e) return
      e.botonesOff = false
      e.ctx.setLoading(false)
    },
    disableButtons: () => {
      const e = actual()
      if (!e) return
      e.botonesOff = true
      for (const b of e.ctx.root.querySelectorAll<HTMLButtonElement>('.foot button')) b.disabled = true
    },
    enableInput: () => {
      const e = actual()
      if (e?.campo) {
        e.inputOff = false
        e.campo.desactivar(false)
      }
    },
    disableInput: () => {
      const e = actual()
      if (e?.campo) {
        e.inputOff = true
        e.campo.desactivar(true)
      }
    },
    // Temporizador (milisegundos). Devuelven `undefined` si la alerta no tiene `timer`.
    getTimerLeft: () => t()?.left(),
    isTimerRunning: () => t()?.running(),
    stopTimer: () => t()?.stop(),
    resumeTimer: () => t()?.resume(),
    toggleTimer: () => {
      const c = t()
      if (c) return c.running() ? c.stop() : c.resume()
    },
    increaseTimer: (ms: number) => t()?.increase(ms),
    DismissReason,
  }
}

/** Objeto compatible con `Swal` de SweetAlert2. */
export const Swal = crear({})
export default Swal
