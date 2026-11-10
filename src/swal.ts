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
import { css, h, uid } from './core/dom'

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
  /** Extra de nexus-dialogs: botón principal rojo y foco en Cancelar. Se activa solo si el texto del botón dice eliminar/borrar/delete. */
  danger?: boolean
  /** Se aceptan (y se ignoran) el resto de opciones de SweetAlert2: colores, customClass, backdrop, etc. */
  [otra: string]: unknown
}

// ── Estado del diálogo abierto (para los métodos estáticos) ─────────────────
const pila: { ctx: DialogContext; input: () => HTMLElement | null }[] = []
const actual = () => pila[pila.length - 1]

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
    }
  }
  if (tipo === 'checkbox') {
    const cb = h('input', { type: 'checkbox', id, checked: !!o.inputValue && o.inputValue !== '0' })
    const el = css(h('label', { class: 'check' }, cb, h('span', null, o.inputPlaceholder ?? o.inputLabel ?? '')), {
      display: 'flex',
      gap: '10px',
      'align-items': 'center',
    })
    return { el, leer: () => (cb.checked ? 1 : 0), enfocar: () => cb.focus(), input: () => cb, mensajeInvalido: () => null }
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
  if (o.inputValue !== undefined && o.inputValue !== null) campo.value = String(o.inputValue)
  const el = h('div', { class: 'field' }, etiqueta, campo)
  return {
    el,
    leer: () => campo.value,
    enfocar: () => campo.focus(),
    input: () => campo,
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

// ── fire ────────────────────────────────────────────────────────────────────
async function fireCon(defaults: SweetAlertOptions, args: unknown[]): Promise<SweetAlertResult> {
  const o: SweetAlertOptions = { ...defaults, ...normalizar(args) }
  if (o.toast) return fireToast(o)

  const titulo = o.title ?? o.titleText
  const confirmar = o.showConfirmButton !== false
  const textoConfirmar = o.confirmButtonText ?? labels().ok
  const peligro = o.danger ?? (!!o.showCancelButton && PELIGRO.test(textoConfirmar))
  const campo = await crearCampo(o)
  const html = o.html instanceof HTMLElement ? o.html : undefined

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
        if (!o.preDeny) return ctx.close('deny', false)
        ctx.setLoading(true)
        try {
          const r = await o.preDeny(campo?.leer() ?? false)
          ctx.setLoading(false)
          if (r === false) return false
          ctx.close('deny', r === undefined || r === true ? false : r)
        } catch (e) {
          ctx.setLoading(false)
          ctx.setError(e instanceof Error ? e.message : String(e))
          return false
        }
      },
    })
  }
  if (confirmar) botones.push({ id: 'confirm', role: 'confirm', text: textoConfirmar, variant: peligro ? 'danger' : 'primary' })

  const ancho =
    typeof o.width === 'number' ? o.width : typeof o.width === 'string' && /^\d+(px)?$/.test(o.width) ? parseInt(o.width, 10) : undefined
  const enfoque = campo ? 'first-field' : o.focusCancel || peligro ? 'cancel' : o.focusDeny ? '[data-id=deny]' : 'confirm'

  let entrada: (typeof pila)[number] | undefined
  const r = await openDialog<unknown>({
    role: campo ? 'dialog' : 'alertdialog',
    title: titulo,
    text: o.text,
    html: typeof o.html === 'string' ? o.html : undefined,
    icon: o.icon && ICONOS.includes(o.icon) ? o.icon : undefined,
    footnote: o.footer ? textoPlano(o.footer) : undefined,
    size: ancho,
    timer: o.timer,
    timerProgress: !!o.timerProgressBar,
    buttons: botones,
    initialFocus: enfoque,
    dismissible: {
      escape: valor(o.allowEscapeKey, true),
      backdrop: valor(o.allowOutsideClick, true),
      closeButton: !!o.showCloseButton,
    },
    render: () => {
      const cont = h('div')
      if (html) cont.appendChild(html)
      if (campo) cont.appendChild(campo.el)
      return cont.childNodes.length ? cont : null
    },
    collect: async (ctx) => {
      if (!campo) return true
      const v = campo.leer()
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
    moduleCss:
      '.check{display:flex;gap:10px;align-items:center;cursor:pointer}.check input{width:18px;height:18px;margin:0;accent-color:var(--_accent)}',
    onOpen: (ctx) => {
      entrada = { ctx, input: () => campo?.input() ?? null }
      pila.push(entrada)
      const popup = ctx.dialog
      o.willOpen?.(popup)
      o.didRender?.(popup)
      o.didOpen?.(popup)
    },
    onClose: () => {
      const i = entrada ? pila.indexOf(entrada) : -1
      if (i >= 0) pila.splice(i, 1)
    },
  })
  try {
    o.willClose?.(document.body)
    o.didClose?.()
  } catch (e) {
    console.error(e)
  }
  if (r.confirmed) return { isConfirmed: true, isDenied: false, isDismissed: false, value: r.value }
  if (r.reason === 'deny') return { isConfirmed: false, isDenied: true, isDismissed: false, value: r.value ?? false }
  return { isConfirmed: false, isDenied: false, isDismissed: true, dismiss: RAZON[r.reason] }
}

function crear(defaults: SweetAlertOptions) {
  return {
    /** Abre una alerta. `Swal.fire(título, html, icono)` o `Swal.fire({ … })`. */
    fire: (...args: [SweetAlertOptions] | [string?, string?, SweetAlertIcon?]): Promise<SweetAlertResult> => fireCon(defaults, args),
    /** Instancia con opciones por omisión: `const Toast = Swal.mixin({ toast: true, timer: 3000 })`. */
    mixin: (mas: SweetAlertOptions) => crear({ ...defaults, ...mas }),
    close: (_result?: Partial<SweetAlertResult>) => dialog.close(),
    isVisible: () => dialog.isOpen(),
    isLoading: () => !!actual()?.ctx.root.querySelector('.panel[aria-busy=true]'),
    showLoading: () => actual()?.ctx.setLoading(true),
    hideLoading: () => actual()?.ctx.setLoading(false),
    showValidationMessage: (mensaje: string) => actual()?.ctx.setError(mensaje),
    resetValidationMessage: () => actual()?.ctx.setError(null),
    update: (o: Pick<SweetAlertOptions, 'title' | 'titleText'>) => {
      const t = o.title ?? o.titleText
      if (t) actual()?.ctx.setTitle(t)
    },
    getPopup: () => actual()?.ctx.dialog ?? null,
    getInput: () => actual()?.input() ?? null,
    getConfirmButton: () => actual()?.ctx.button('confirm') ?? null,
    getCancelButton: () => actual()?.ctx.button('cancel') ?? null,
    getDenyButton: () => actual()?.ctx.button('deny') ?? null,
    clickConfirm: () => actual()?.ctx.button('confirm')?.click(),
    clickCancel: () => actual()?.ctx.button('cancel')?.click(),
    clickDeny: () => actual()?.ctx.button('deny')?.click(),
    DismissReason,
  }
}

/** Objeto compatible con `Swal` de SweetAlert2. */
export const Swal = crear({})
export default Swal
