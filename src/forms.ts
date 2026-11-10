/**
 * Formularios y asistentes dentro de un diálogo.
 *
 * ```ts
 * import { form, wizard } from 'nexus-dialogs/forms'
 * const r = await form<{ nombre: string; correo: string }>({
 *   title: 'Nuevo cliente',
 *   fields: [
 *     { name: 'nombre', label: 'Nombre', required: true },
 *     { name: 'correo', label: 'Correo', type: 'email', required: true },
 *   ],
 *   submitText: 'Crear cliente',
 *   preConfirm: (v) => api.crear(v), // async: muestra «Procesando…»; si lanza, enseña el error
 * })
 * if (r.confirmed) r.value
 * ```
 */
import { INVALID, labels, openDialog } from 'nexus-dialogs'
import type { ButtonSpec, DialogContext, DialogOptions, DialogResult, Labels } from 'nexus-dialogs'
import { h, uid } from './core/dom'
import { isCLABE, isCURP, isNSS, isPostalCode, isRFC } from './mx'
import { CAMPOS, FIELDS_CSS, type CustomControl, type NestedFieldSet } from './fields'
export { defaultDatePresets } from './fields'

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'password'
  | 'number'
  | 'date'
  | 'time'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'segmented'
  | 'checkbox'
  | 'switch'
  | 'money'
  | 'rfc'
  | 'curp'
  | 'nss'
  | 'clabe'
  | 'postal'
  | 'combobox'
  | 'file'
  | 'daterange'
  | 'otp'
  | 'items'

export type Option = string | { value: string; label: string; disabled?: boolean; description?: string; group?: string }
type Msg = string | void | null | undefined

export interface Field {
  /** Clave en el objeto de valores. */
  name: string
  label: string
  /** Por omisión 'text'. money: importe con separador de miles. México: rfc, curp, nss, clabe, postal (con dígito verificador). */
  type?: FieldType
  value?: unknown
  placeholder?: string
  help?: string
  required?: boolean
  /** select, radio y segmented. */
  options?: Option[]
  min?: number | string
  max?: number | string
  step?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp | string
  patternMessage?: string
  /** Validación propia: devuelve el mensaje de error. Puede ser async (por ejemplo, «¿ya existe este RFC?»). */
  validate?: (value: any, values: Record<string, unknown>) => Msg | Promise<Msg>
  autocomplete?: string
  inputmode?: string
  /** Con columns: 2, ocupa las dos columnas. */
  span?: 1 | 2
  /** Campo condicional: se muestra solo si devuelve true. Los campos ocultos no se validan ni se envían. */
  visible?: (values: Record<string, unknown>) => boolean
  disabled?: boolean
  /** money: código de moneda (por omisión MXN) y locale (por omisión es-MX). */
  currency?: string
  locale?: string

  // ── combobox ──
  /** combobox y file: permitir varios. */
  multiple?: boolean
  /** combobox: busca en tu API mientras el usuario escribe (con espera de 250 ms). Sin esto filtra `options`. */
  search?: (query: string) => Promise<Option[]> | Option[]
  /** combobox: ofrecer «Crear «texto»» cuando no hay coincidencia exacta. Con función, crea el registro y devuelve la opción. */
  creatable?: boolean | ((text: string) => Option | Promise<Option>)
  /** combobox múltiple: máximo de elementos. */
  maxItems?: number

  // ── file ──
  /** Tipos aceptados, como en <input accept>: '.pdf,.xml,image/*'. */
  accept?: string
  /** Peso máximo por archivo en bytes (5 * 1024 * 1024 = 5 MB). */
  maxSize?: number
  /** Máximo de archivos (con multiple). */
  maxFiles?: number
  /** Sube cada archivo al agregarlo, con progreso. El valor del campo pasa a ser lo que devuelva (id, URL…). */
  upload?: (file: File, progress: (percent: number) => void) => Promise<unknown>

  // ── daterange ──
  /** Atajos («Quincena actual», «Mes pasado»…). false los oculta; un arreglo pone los tuyos. */
  presets?: false | DatePreset[]
  /** Máximo de días del rango. */
  maxDays?: number

  // ── otp ──
  /** Dígitos del código. Por omisión 6. */
  length?: number
  /** Al completar el código, pulsa el botón principal. Por omisión true. */
  autoSubmit?: boolean

  // ── items (filas repetibles) ──
  /** Columnas de cada fila. */
  fields?: Field[]
  /** Mínimo de filas (por omisión 1 si es required, si no 0) y máximo. */
  minRows?: number
  maxRows?: number
  /** Texto del botón para agregar una fila. */
  addText?: string
  /** Totales bajo la tabla, se recalculan al escribir: (filas) => [{ label: 'Total', value: '$ 1,000.00' }]. */
  totals?: (rows: Record<string, any>[]) => { label: string; value: string }[]
}

export interface DatePreset {
  label: string
  /** Devuelve [desde, hasta]. */
  range: () => [Date, Date]
}

interface Control {
  f: Field
  wrap: HTMLElement
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  group: HTMLInputElement[]
  msg: HTMLElement
  tocado: boolean
  /** Valor al abrir: salir del campo sin cambiarlo no muestra errores (así el botón no se mueve bajo el clic). */
  inicial?: string
  custom?: CustomControl
}

const opcion = (o: Option) => (typeof o === 'string' ? { value: o, label: o, disabled: false } : { disabled: false, ...o })
const vacio = (v: unknown) =>
  v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v)) || (Array.isArray(v) && !v.length)
/** Tipos mexicanos: largo máximo, si van en mayúsculas, teclado numérico y su validador. */
const MX: Record<string, { max: number; upper?: boolean; numeric?: boolean; ok: (v: string) => boolean; msg: keyof Labels }> = {
  rfc: { max: 13, upper: true, ok: isRFC, msg: 'invalidRfc' },
  curp: { max: 18, upper: true, ok: isCURP, msg: 'invalidCurp' },
  nss: { max: 11, numeric: true, ok: isNSS, msg: 'invalidNss' },
  clabe: { max: 18, numeric: true, ok: isCLABE, msg: 'invalidClabe' },
  postal: { max: 5, numeric: true, ok: isPostalCode, msg: 'invalidPostal' },
}

function numeroDe(texto: string): number | null {
  const limpio = texto.replace(/[^\d.-]/g, '')
  if (!limpio || limpio === '-' || limpio === '.') return null
  const n = Number(limpio)
  return Number.isFinite(n) ? n : null
}

/** Un conjunto de campos: dibuja, lee, valida y muestra errores. Lo usan form() y cada paso de wizard(). */
/** Para comparar valores: los File se comparan por nombre, tamaño y fecha. */
const serializable = (_k: string, v: unknown) =>
  typeof File !== 'undefined' && v instanceof File ? `${v.name}:${v.size}:${v.lastModified}` : v

class FieldSet {
  readonly el: HTMLElement
  private controles: Control[] = []
  private inicial = ''
  private alCambiar: () => void

  constructor(
    fields: Field[],
    valores: Record<string, unknown>,
    private columns: 1 | 2 = 1,
    alCambiar: () => void = () => {},
  ) {
    this.alCambiar = alCambiar
    this.el = h('div', { class: `grid cols-${columns}` })
    for (const f of fields) this.controles.push(this.crear(f, valores[f.name] ?? f.value))
    this.actualizarVisibles()
    this.inicial = JSON.stringify(this.values(), serializable)
  }

  private crear(f: Field, valor: unknown): Control {
    const L = labels()
    const id = uid('ff')
    const msgId = uid('fe')
    const helpId = uid('fh')
    const tipo = f.type ?? 'text'
    const msg = h('div', { class: 'msg', id: msgId })
    const ayuda = f.help ? h('div', { class: 'help', id: helpId }) : null
    if (ayuda) ayuda.textContent = f.help!
    const describe = [f.help ? helpId : '', msgId].filter(Boolean).join(' ')
    const c: Control = { f, wrap: h('div'), input: null, group: [], msg, tocado: false }
    const requerido = f.required ? 'true' : null
    const etiqueta = (forId: string | null) =>
      h('label', { for: forId }, f.label, f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null)

    const fabrica = CAMPOS[tipo]
    if (fabrica) {
      const custom = fabrica(
        {
          id,
          describedBy: describe,
          field: f,
          required: !!f.required,
          nested: (campos, valores, alCambiar) => {
            const fs = new FieldSet(campos, valores, 1, alCambiar)
            return fs as NestedFieldSet
          },
        },
        valor,
      )
      c.custom = custom
      c.wrap = custom.group
        ? h(
            'fieldset',
            { class: `field ${tipo}`, 'aria-describedby': describe },
            h('legend', null, f.label, f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
            custom.el,
            ayuda,
            msg,
          )
        : h('div', { class: `field ${tipo}` }, etiqueta(id), custom.el, ayuda, msg)
    } else if (tipo === 'radio' || tipo === 'segmented') {
      const nombre = uid('fr')
      const ops = (f.options ?? []).map(opcion)
      const items = ops.map((o) => {
        const r = h('input', {
          type: 'radio',
          name: nombre,
          value: o.value,
          checked: String(valor ?? '') === o.value,
          disabled: f.disabled || o.disabled,
          'aria-describedby': describe,
        })
        c.group.push(r)
        return h('label', { class: tipo === 'segmented' ? 'seg-item' : 'check' }, r, h('span', null, o.label))
      })
      c.wrap = h(
        'fieldset',
        // radiogroup admite aria-required (fieldset no).
        { class: `field ${tipo}`, role: 'radiogroup', 'aria-required': requerido },
        h('legend', null, f.label, f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
        h('div', { class: tipo === 'segmented' ? 'seg' : 'options' }, ...items),
        ayuda,
        msg,
      )
    } else if (tipo === 'checkbox' || tipo === 'switch') {
      const cb = h('input', {
        type: 'checkbox',
        id,
        role: tipo === 'switch' ? 'switch' : null,
        checked: !!valor,
        disabled: f.disabled,
        'aria-describedby': describe,
        'aria-required': requerido,
      })
      c.input = cb
      c.wrap = h(
        'div',
        { class: `field ${tipo}` },
        h(
          'label',
          { class: tipo === 'switch' ? 'toggle' : 'check' },
          cb,
          tipo === 'switch' ? h('span', { class: 'track', 'aria-hidden': 'true' }) : null,
          h('span', null, f.label),
        ),
        ayuda,
        msg,
      )
    } else {
      const comunes = {
        id,
        class: 'input',
        name: f.name,
        placeholder: f.placeholder,
        disabled: f.disabled,
        autocomplete: f.autocomplete ?? (tipo === 'postal' ? 'postal-code' : MX[tipo] ? 'off' : null),
        inputmode: f.inputmode ?? (tipo === 'money' || tipo === 'number' ? 'decimal' : MX[tipo]?.numeric ? 'numeric' : null),
        'aria-describedby': describe,
        'aria-required': requerido,
        minlength: f.minLength,
        maxlength: f.maxLength ?? MX[tipo]?.max ?? null,
      }
      let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      if (tipo === 'textarea') input = h('textarea', { ...comunes, rows: 3 })
      else if (tipo === 'select') {
        input = h(
          'select',
          comunes,
          h('option', { value: '' }, f.placeholder ?? L.select),
          ...(f.options ?? []).map(opcion).map((o) => h('option', { value: o.value, disabled: o.disabled }, o.label)),
        )
      } else {
        const html: Record<string, string> = { money: 'text', number: 'number' }
        input = h('input', {
          ...comunes,
          type: html[tipo] ?? (MX[tipo] ? 'text' : tipo),
          min: f.min,
          max: f.max,
          step: f.step ?? (tipo === 'number' ? 'any' : null),
          spellcheck: MX[tipo] ? 'false' : null,
        })
      }
      input.value = vacio(valor) ? '' : tipo === 'money' ? this.dinero(f, Number(valor)) : String(valor)
      if (MX[tipo]?.upper) input.addEventListener('input', () => ((input as HTMLInputElement).value = input.value.toUpperCase()))
      if (tipo === 'money') {
        input.addEventListener('focus', () => {
          const n = numeroDe(input.value)
          input.value = n === null ? '' : String(n)
        })
        input.addEventListener('blur', () => {
          const n = numeroDe(input.value)
          if (n !== null) input.value = this.dinero(f, n)
        })
      }
      c.input = input
      const control =
        tipo === 'money'
          ? h('div', { class: 'affix' }, h('span', { 'aria-hidden': 'true' }, '$'), input, h('span', { class: 'cur' }, f.currency ?? 'MXN'))
          : input
      c.wrap = h('div', { class: 'field' }, etiqueta(id), control, ayuda, msg)
    }
    if (f.span === 2 && this.columns === 2) c.wrap.classList.add('span-2')

    c.inicial = JSON.stringify(this.valorDe(c), serializable)
    const al = async (ev: Event) => {
      if (ev.type === 'change') c.tocado = true
      else if (ev.type === 'focusout' && JSON.stringify(this.valorDe(c), serializable) !== c.inicial) c.tocado = true
      // Primero lo que no espera: mostrar u ocultar campos condicionales. Luego la validación (puede ser async).
      this.actualizarVisibles()
      this.alCambiar()
      if (c.tocado && (!c.custom?.lazy || c.wrap.classList.contains('invalid'))) this.mostrar(c, await this.validarUno(c))
    }
    c.wrap.addEventListener('input', al)
    c.wrap.addEventListener('change', al)
    c.wrap.addEventListener('focusout', al)
    this.el.appendChild(c.wrap)
    return c
  }

  private dinero(f: Field, n: number): string {
    return n.toLocaleString(f.locale ?? 'es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  private valorDe(c: Control): unknown {
    const t = c.f.type ?? 'text'
    if (c.custom) return c.custom.value()
    if (c.group.length) return c.group.find((r) => r.checked)?.value ?? ''
    const i = c.input!
    if (t === 'checkbox' || t === 'switch') return (i as HTMLInputElement).checked
    if (t === 'number' || t === 'money') return numeroDe(i.value)
    return i.value.trim()
  }

  private visible(c: Control, valores: Record<string, unknown>): boolean {
    try {
      return c.f.visible ? c.f.visible(valores) : true
    } catch {
      return true
    }
  }

  private actualizarVisibles(): void {
    const todos = this.todos()
    for (const c of this.controles) c.wrap.hidden = !this.visible(c, todos)
  }

  private todos(): Record<string, unknown> {
    const v: Record<string, unknown> = {}
    for (const c of this.controles) v[c.f.name] = this.valorDe(c)
    return v
  }

  /** Valores de los campos visibles. */
  values(): Record<string, unknown> {
    const v: Record<string, unknown> = {}
    for (const c of this.controles) if (!c.wrap.hidden) v[c.f.name] = this.valorDe(c)
    return v
  }

  /** ¿Cambió algo desde que se abrió? */
  dirty(): boolean {
    return JSON.stringify(this.values(), serializable) !== this.inicial
  }

  private async validarUno(c: Control, extra: Record<string, unknown> = {}): Promise<string | null> {
    if (c.wrap.hidden) return null
    const L: Labels = labels()
    const f = c.f
    const t = f.type ?? 'text'
    const v = this.valorDe(c)
    if (f.required && (vacio(v) || v === false)) return L.required
    if (c.custom) {
      // Siempre: un archivo que se sigue subiendo bloquea el envío aunque el campo sea opcional.
      const propio = await c.custom.validate?.()
      if (propio) return propio
    } else if (!vacio(v) && typeof v === 'string') {
      if (t === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return L.invalidEmail
      if (t === 'url') {
        try {
          new URL(v)
        } catch {
          return L.invalidUrl
        }
      }
      if (MX[t] && !MX[t].ok(v)) return L[MX[t].msg] as string
      if (f.minLength && v.length < f.minLength) return L.minLength.replace('{0}', String(f.minLength))
      if (f.maxLength && v.length > f.maxLength) return L.maxLength.replace('{0}', String(f.maxLength))
      if (f.pattern && !(typeof f.pattern === 'string' ? new RegExp(`^(?:${f.pattern})$`) : f.pattern).test(v))
        return f.patternMessage ?? L.pattern
    }
    if (typeof v === 'number' && !c.custom) {
      if (f.min !== undefined && v < Number(f.min)) return L.min.replace('{0}', String(f.min))
      if (f.max !== undefined && v > Number(f.max)) return L.max.replace('{0}', String(f.max))
    }
    if (f.validate) {
      try {
        return (await f.validate(v, { ...this.values(), ...extra })) || null
      } catch (e) {
        return e instanceof Error ? e.message : String(e)
      }
    }
    return null
  }

  private mostrar(c: Control, error: string | null): void {
    c.msg.textContent = error ?? ''
    const invalido = String(!!error)
    c.custom?.invalid(!!error)
    if (c.input) c.input.setAttribute('aria-invalid', invalido)
    for (const r of c.group) r.setAttribute('aria-invalid', invalido)
    c.wrap.classList.toggle('invalid', !!error)
  }

  /** Valida todo. `extra` son errores de un validate() global (por nombre de campo). Devuelve los campos con error. */
  async validate(extra: Record<string, string> = {}): Promise<{ label: string; focus: () => void }[]> {
    const errores: { label: string; focus: () => void }[] = []
    for (const c of this.controles) {
      c.tocado = true
      const e = extra[c.f.name] || (await this.validarUno(c))
      this.mostrar(c, e)
      if (e) errores.push({ label: `${c.f.label}: ${e}`, focus: () => (c.custom ? c.custom.focus() : (c.input ?? c.group[0])?.focus()) })
    }
    return errores
  }

  /** Texto legible de cada valor (para la revisión del asistente). */
  summary(): { label: string; value: string }[] {
    const L = labels()
    return this.controles
      .filter((c) => !c.wrap.hidden)
      .map((c) => {
        const v = this.valorDe(c)
        const t = c.f.type ?? 'text'
        let s: string
        if (c.custom) s = vacio(v) ? '—' : (c.custom.summary?.() ?? String(v))
        else if (typeof v === 'boolean') s = v ? L.yes : L.no
        else if (vacio(v)) s = '—'
        else if (t === 'money') s = `$ ${this.dinero(c.f, v as number)} ${c.f.currency ?? 'MXN'}`
        else if (t === 'password') s = '••••••'
        else if (c.f.options) s = (c.f.options.map(opcion).find((o) => o.value === v)?.label ?? String(v)) as string
        else s = String(v)
        return { label: c.f.label, value: s }
      })
  }

  focusFirst(): void {
    const c = this.controles.find((x) => !x.wrap.hidden && !x.f.disabled)
    if (c?.custom) return c.custom.focus()
    ;(c?.input ?? c?.group.find((r) => r.checked) ?? c?.group[0])?.focus()
  }
}

/** Resumen de errores arriba del formulario, con enlaces a cada campo. */
function resumen(): { el: HTMLElement; set: (errores: { label: string; focus: () => void }[]) => void } {
  const el = h('div', { class: 'summary', tabindex: '-1', hidden: true })
  return {
    el,
    set(errores) {
      el.hidden = !errores.length
      if (!errores.length) return el.replaceChildren()
      el.replaceChildren(
        h('p', null, labels().errorSummary.replace('{0}', String(errores.length))),
        h(
          'ul',
          null,
          ...errores.map((e) => h('li', null, h('a', { href: '#', onclick: (ev: Event) => (ev.preventDefault(), e.focus()) }, e.label))),
        ),
      )
      el.focus()
    },
  }
}

const descartar = async (): Promise<boolean> => {
  const L = labels()
  const r = await openDialog({
    role: 'alertdialog',
    title: L.discardTitle,
    text: L.discardText,
    size: 'sm',
    initialFocus: 'cancel',
    buttons: [
      { id: 'keep', role: 'cancel', text: L.keepEditing, variant: 'secondary' },
      { id: 'discard', role: 'confirm', text: L.discard, variant: 'cancel' },
    ],
  })
  return r.confirmed
}

export interface FormOptions<T> extends Omit<DialogOptions<T>, 'requireText'> {
  fields: Field[]
  /** Valores iniciales (por nombre). También puedes poner `value` en cada campo. */
  values?: Partial<T>
  /** 1 o 2 columnas. En celular siempre 1. */
  columns?: 1 | 2
  /** Validación entre campos: devuelve { campo: 'mensaje' }. Puede ser async. */
  validate?: (values: T) => Record<string, string> | void | Promise<Record<string, string> | void>
  /** Texto del botón principal. Por omisión «Guardar». */
  submitText?: string
  /** Preguntar antes de cerrar si hay cambios sin guardar. Por omisión true. */
  confirmDiscard?: boolean
}

/** Formulario en un diálogo. Resuelve con los valores al confirmar (y después de `preConfirm`, si lo hay). */
export function form<T extends Record<string, unknown> = Record<string, unknown>>(o: FormOptions<T>): Promise<DialogResult<T>> {
  const L = labels()
  let campos!: FieldSet
  const errores = resumen()
  return openDialog<T>({
    role: 'dialog',
    initialFocus: 'first-field',
    dismissible: { backdrop: false },
    size: o.columns === 2 ? 'lg' : 'md',
    ...o,
    moduleCss: FORM_CSS + FIELDS_CSS,
    buttons: o.buttons ?? [
      { id: 'cancel', role: 'cancel', text: o.cancelText ?? L.cancel },
      { id: 'confirm', role: 'confirm', text: o.submitText ?? o.confirmText ?? L.submit, variant: o.danger ? 'danger' : 'primary' },
    ],
    render: () => {
      campos = new FieldSet(o.fields, (o.values ?? {}) as Record<string, unknown>, o.columns ?? 1)
      return h('div', { class: 'form' }, errores.el, campos.el)
    },
    collect: async () => {
      const valores = campos.values() as T
      const globales = (await o.validate?.(valores)) || {}
      const mal = await campos.validate(globales)
      errores.set(mal)
      return mal.length ? INVALID : valores
    },
    beforeClose: async (reason, ctx) => {
      if (o.beforeClose && !(await o.beforeClose(reason, ctx))) return false
      return o.confirmDiscard === false || !campos.dirty() || descartar()
    },
  })
}

export interface WizardStep {
  title: string
  description?: string
  fields: Field[]
  columns?: 1 | 2
  /** Validación del paso completo (entre campos). */
  validate?: (values: Record<string, unknown>) => Record<string, string> | void | Promise<Record<string, string> | void>
}

export interface WizardOptions<T> extends Omit<DialogOptions<T>, 'requireText'> {
  steps: WizardStep[]
  values?: Partial<T>
  /** Paso final de revisión con «Editar» por sección. true usa el título «Revisar»; un texto lo cambia. */
  review?: boolean | string
  submitText?: string
  nextText?: string
  backText?: string
  confirmDiscard?: boolean
  onStepChange?: (index: number, values: Partial<T>) => void
}

/** Asistente de varios pasos. Cada paso valida antes de avanzar; «Atrás» nunca pierde datos. */
export function wizard<T extends Record<string, unknown> = Record<string, unknown>>(o: WizardOptions<T>): Promise<DialogResult<T>> {
  const L = labels()
  const pasos: FieldSet[] = []
  const conRevision = !!o.review
  const total = o.steps.length + (conRevision ? 1 : 0)
  let actual = 0
  let ctxRef: DialogContext
  const errores = resumen()
  const lista = h('ol', { class: 'stepper' })
  const encabezado = h('h3', { class: 'step-title', tabindex: '-1' })
  const contador = h('p', { class: 'step-count' })
  const descripcion = h('p', { class: 'step-desc' })
  const contenedor = h('div', { class: 'steps' })
  const revision = h('div', { class: 'review', hidden: true })

  const titulos = [...o.steps.map((s) => s.title), ...(conRevision ? [typeof o.review === 'string' ? o.review : L.review] : [])]
  const valores = (): T => Object.assign({}, ...pasos.map((p) => p.values())) as T

  const botones = (): ButtonSpec[] => {
    const ultimo = actual === total - 1
    return [
      { id: 'cancel', role: 'cancel', text: o.cancelText ?? L.cancel },
      { id: 'back', role: 'custom', text: o.backText ?? L.back, variant: 'secondary', hidden: actual === 0 },
      ultimo
        ? { id: 'confirm', role: 'confirm', text: o.submitText ?? o.confirmText ?? L.submit, variant: 'primary' }
        : { id: 'next', role: 'custom', text: o.nextText ?? L.next, variant: 'primary' },
    ]
  }

  const dibujarRevision = () => {
    revision.replaceChildren(
      ...pasos.map((p, i) =>
        h(
          'section',
          null,
          h(
            'div',
            { class: 'rev-head' },
            h('h4', null, o.steps[i].title),
            h('button', { type: 'button', class: 'link', onclick: () => ir(i), 'aria-label': `${L.edit}: ${o.steps[i].title}` }, L.edit),
          ),
          h('dl', null, ...p.summary().flatMap((s) => [h('dt', null, s.label), h('dd', null, s.value)])),
        ),
      ),
    )
  }

  function ir(i: number, enfocar = true): void {
    actual = i
    errores.set([])
    pasos.forEach((p, k) => (p.el.hidden = k !== i))
    revision.hidden = !(conRevision && i === o.steps.length)
    if (!revision.hidden) dibujarRevision()
    ;[...lista.children].forEach((li, k) => {
      li.className = k < i ? 'done' : k === i ? 'current' : ''
      if (k === i) li.setAttribute('aria-current', 'step')
      else li.removeAttribute('aria-current')
    })
    encabezado.textContent = titulos[i]
    contador.textContent = L.step.replace('{0}', String(i + 1)).replace('{1}', String(total))
    descripcion.textContent = o.steps[i]?.description ?? ''
    descripcion.hidden = !descripcion.textContent
    ctxRef?.setButtons(botones())
    if (enfocar) encabezado.focus({ preventScroll: true })
    try {
      o.onStepChange?.(i, valores())
    } catch (e) {
      console.error(e)
    }
  }

  const validarPaso = async (i: number): Promise<boolean> => {
    const extra = (await o.steps[i].validate?.(pasos[i].values())) || {}
    const mal = await pasos[i].validate(extra)
    errores.set(mal)
    return !mal.length
  }

  return openDialog<T>({
    role: 'dialog',
    dismissible: { backdrop: false },
    size: 'lg',
    initialFocus: 'first-field',
    ...o,
    moduleCss: FORM_CSS + FIELDS_CSS,
    buttons: [],
    render: (ctx) => {
      ctxRef = ctx
      titulos.forEach((t, i) =>
        lista.appendChild(h('li', null, h('span', { class: 'num', 'aria-hidden': 'true' }, String(i + 1)), h('span', null, t))),
      )
      o.steps.forEach((s) => {
        const p = new FieldSet(s.fields, (o.values ?? {}) as Record<string, unknown>, s.columns ?? 1)
        pasos.push(p)
        contenedor.appendChild(p.el)
      })
      ir(0, false)
      return h(
        'div',
        { class: 'form' },
        lista,
        h('div', { class: 'step-head' }, contador, encabezado, descripcion),
        errores.el,
        contenedor,
        revision,
      )
    },
    onOpen: (ctx) => {
      ctx.setButtons(botones())
      pasos[0]?.focusFirst()
      o.onOpen?.(ctx)
    },
    onAction: async (b) => {
      if (b.id === 'back') {
        if (actual > 0) ir(actual - 1)
        return true
      }
      if (b.id === 'next') {
        if (actual < o.steps.length && !(await validarPaso(actual))) return true
        ir(actual + 1)
        return true
      }
      return false
    },
    collect: async () => {
      for (let i = 0; i < o.steps.length; i++) {
        if (!(await validarPaso(i))) {
          if (actual !== i) {
            ir(i)
            await validarPaso(i)
          }
          return INVALID
        }
      }
      return valores()
    },
    beforeClose: async (reason, ctx) => {
      if (o.beforeClose && !(await o.beforeClose(reason, ctx))) return false
      return o.confirmDiscard === false || !pasos.some((p) => p.dirty()) || descartar()
    },
  })
}

const FORM_CSS = `
.grid{display:grid;gap:16px}
.cols-2{grid-template-columns:1fr 1fr}
.span-2{grid-column:1/-1}
.narrow .cols-2{grid-template-columns:1fr}
.field[hidden],[hidden]{display:none!important}
fieldset.field{border:0;margin:0;padding:0;min-width:0}
legend{font-size:14px;font-weight:600;padding:0;margin-bottom:8px}
.req{color:var(--_error)}
select.input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);
  background-position:calc(100% - 18px) 19px,calc(100% - 13px) 19px;background-size:5px 5px;background-repeat:no-repeat;padding-right:36px}
.options{display:grid;gap:8px}
.check{display:flex;gap:10px;align-items:center;font-size:15px;cursor:pointer}
.check input{width:18px;height:18px;margin:0;accent-color:var(--_accent)}
.toggle{display:flex;gap:12px;align-items:center;cursor:pointer;font-size:15px}
.toggle input{position:absolute;opacity:0;width:44px;height:26px;margin:0}
.track{flex:none;position:relative;width:44px;height:26px;border-radius:999px;background:var(--_border);transition:background .15s}
.track::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .15s}
.toggle input:checked+.track{background:var(--_accent)}
.toggle input:checked+.track::after{transform:translateX(18px)}
.toggle input:focus-visible+.track,.seg-item input:focus-visible+span{outline:3px solid var(--_focus);outline-offset:2px}
.seg{display:flex;border:1px solid var(--_border);border-radius:var(--_control-radius);overflow:hidden}
.seg-item{flex:1;position:relative}
.seg-item input{position:absolute;opacity:0;inset:0;margin:0}
.seg-item span{display:flex;align-items:center;justify-content:center;height:42px;padding:0 10px;font-size:14px;font-weight:600;cursor:pointer;text-align:center}
.seg-item+.seg-item span{border-left:1px solid var(--_border)}
.seg-item input:checked+span{background:var(--_accent);color:var(--_accent-fg)}
.affix{display:flex;align-items:center;border:1px solid var(--_border);border-radius:var(--_control-radius);background:var(--_bg);padding:0 12px;gap:8px}
.affix:focus-within{outline:3px solid var(--_focus);border-color:var(--_accent)}
.affix span{color:var(--_muted)}
.affix .input{border:0;padding:0;outline:none!important;text-align:right;font-variant-numeric:tabular-nums}
.invalid>.affix{border:2px solid var(--_error)}
.summary{margin:0 0 16px;padding:12px 14px;border-radius:var(--_control-radius);border:1px solid color-mix(in srgb,var(--_error) 35%,transparent);
  background:color-mix(in srgb,var(--_error) 8%,transparent);font-size:14px}
.summary:focus{outline:3px solid var(--_focus)}
.summary p{margin:0 0 4px;font-weight:700;color:var(--_error)}
.summary ul{margin:0;padding-left:20px}
.summary li{margin:2px 0}
.summary a{color:var(--_error);display:block;min-height:24px;line-height:24px}
.stepper{list-style:none;margin:0 0 18px;padding:0;display:flex;gap:18px;font-size:13px;color:var(--_muted)}
.stepper li{flex:0 1 auto;display:flex;gap:8px;align-items:center;min-width:0}
.stepper li span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stepper .num{flex:none;width:24px;height:24px;border-radius:50%;background:var(--_line);color:var(--_muted);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
.stepper .current{color:var(--_fg);font-weight:700}
.stepper .current .num{background:var(--_accent);color:var(--_accent-fg)}
.stepper .done .num{background:var(--_success);color:#fff}
.narrow .stepper li:not(.current) span:last-child{display:none}
.step-head{margin-bottom:14px}
.step-count{margin:0;font-size:13px;color:var(--_muted)}
.step-title{margin:2px 0 0;font:700 17px/1.3 var(--_title-font)}
.step-title:focus{outline:none}
.step-desc{margin:4px 0 0;color:var(--_muted);font-size:14px}
.review{display:grid;gap:14px}
.review section{border:1px solid var(--_line);border-radius:12px;padding:12px 14px}
.rev-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.rev-head h4{margin:0;font-size:15px}
.review dl{margin:0;display:grid;grid-template-columns:minmax(120px,auto) 1fr;gap:4px 14px;font-size:14px}
.review dt{color:var(--_muted)}
.review dd{margin:0;overflow-wrap:anywhere}
.link{border:0;background:transparent;color:var(--_accent);font:600 14px var(--_font);cursor:pointer;padding:6px 8px;border-radius:8px}
.link:focus-visible{outline:3px solid var(--_focus)}
`
