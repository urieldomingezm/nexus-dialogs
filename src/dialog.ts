import { labels } from './config'
import { h, uid } from './core/dom'
import { closeTop, INVALID, openCount, openDialog } from './core/engine'
import type { DialogContext, DialogOptions, DialogResult, IconName } from './types'

/** Opciones completas o, como atajo, solo el título (el segundo argumento es el texto). */
export type DialogInput<T> = DialogOptions<T> | string

const normalizar = <T>(a: DialogInput<T>, text?: string): DialogOptions<T> => (typeof a === 'string' ? { title: a, text } : a)

/** Aviso con un solo botón. `await dialog.alert('Guardado')` */
export function alert(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>> {
  const o = normalizar(opciones, text)
  const L = labels()
  return openDialog<true>({
    role: 'alertdialog',
    initialFocus: 'confirm',
    ...o,
    buttons: o.buttons ?? [
      ...(o.showCancel ? [{ id: 'cancel', role: 'cancel' as const, text: o.cancelText ?? L.cancel }] : []),
      { id: 'confirm', role: 'confirm', text: o.confirmText ?? L.ok, variant: o.danger ? 'danger' : 'primary' },
    ],
  })
}

/** Pregunta Sí/No. `if ((await dialog.confirm({ title: '¿Eliminar?', danger: true })).confirmed) …` */
export function confirm(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>> {
  const o = normalizar(opciones, text)
  return openDialog<true>({ role: 'alertdialog', icon: o.danger ? undefined : o.icon, ...o })
}

const conIcono =
  (icon: IconName) =>
  (opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>> =>
    alert({ icon, ...normalizar(opciones, text) })

export interface PromptOptions extends DialogOptions<string> {
  /** Etiqueta visible del campo. Si falta, se usa el título como nombre accesible. */
  label?: string
  input?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select'
  value?: string
  placeholder?: string
  help?: string
  /** Para input: 'select'. */
  options?: (string | { value: string; label: string })[]
  /** Por omisión true. */
  required?: boolean
  maxLength?: number
  autocomplete?: string
  inputmode?: string
  /** Devuelve un mensaje para mostrarlo como error; nada si es válido. Puede ser async. */
  validate?: (value: string) => string | void | null | undefined | Promise<string | void | null | undefined>
}

/** Pide un dato. `const r = await dialog.prompt({ title: 'Nombre del área', label: 'Nombre' }); if (r.confirmed) r.value` */
export function prompt(opciones: PromptOptions): Promise<DialogResult<string>> {
  const o = opciones
  const L = labels()
  let campo!: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  let msg!: HTMLElement
  const msgId = uid('e')
  const helpId = uid('h')
  const id = uid('f')

  const mostrar = (texto: string | null): void => {
    msg.textContent = texto ?? ''
    campo.setAttribute('aria-invalid', String(!!texto))
  }

  const validar = async (): Promise<string | null> => {
    const v = campo.value
    if ((o.required ?? true) && !v.trim()) return L.required
    if (v && o.input === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return L.invalidEmail
    if (v && o.input === 'url') {
      try {
        new URL(v)
      } catch {
        return L.invalidUrl
      }
    }
    const r = await o.validate?.(v)
    return r || null
  }

  const render = (_ctx: DialogContext): Node => {
    const comunes = {
      id,
      class: 'input',
      name: 'value',
      placeholder: o.placeholder,
      maxlength: o.maxLength,
      autocomplete: o.autocomplete ?? 'off',
      inputmode: o.inputmode,
      'aria-label': o.label ? null : o.title,
      'aria-describedby': [msgId, o.help ? helpId : ''].filter(Boolean).join(' '),
      'aria-required': (o.required ?? true) ? 'true' : null,
    }
    if (o.input === 'textarea') campo = h('textarea', { ...comunes, rows: 4 })
    else if (o.input === 'select') {
      campo = h(
        'select',
        comunes,
        h('option', { value: '' }, o.placeholder ?? L.select),
        ...(o.options ?? []).map((op) =>
          typeof op === 'string' ? h('option', { value: op }, op) : h('option', { value: op.value }, op.label),
        ),
      )
    } else campo = h('input', { ...comunes, type: o.input ?? 'text' })
    campo.value = o.value ?? ''
    msg = h('div', { class: 'msg', id: msgId })
    campo.addEventListener('input', () => campo.getAttribute('aria-invalid') === 'true' && void validar().then(mostrar))
    return h(
      'div',
      { class: 'field' },
      o.label ? h('label', { for: id }, o.label) : null,
      campo,
      o.help ? h('div', { class: 'help', id: helpId }, o.help) : null,
      msg,
    )
  }

  return openDialog<string>({
    role: 'dialog',
    initialFocus: 'first-field',
    ...o,
    render,
    collect: async () => {
      const e = await validar()
      mostrar(e)
      if (e) {
        campo.focus()
        return INVALID
      }
      return campo.value
    },
  })
}

/** Diálogo libre: tus botones, tu contenido. */
export const open = <T = unknown>(
  opciones: DialogOptions<T> & { render?: (ctx: DialogContext) => Node | null | void },
): Promise<DialogResult<T>> => openDialog<T>(opciones)

/** API agrupada: `dialog.alert`, `dialog.confirm`, `dialog.prompt`, `dialog.success`… */
export const dialog = {
  alert,
  confirm,
  prompt,
  open,
  success: conIcono('success'),
  error: conIcono('error'),
  warning: conIcono('warning'),
  info: conIcono('info'),
  /** Cierra el diálogo de arriba (reason 'program'). */
  close: (value?: unknown) => closeTop(value),
  /** Cierra todos los diálogos de nexus-dialogs. */
  closeAll: () => closeTop(undefined, true),
  /** ¿Hay algún diálogo de nexus-dialogs abierto? */
  isOpen: () => openCount() > 0,
}
