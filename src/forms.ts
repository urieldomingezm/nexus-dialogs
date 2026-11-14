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
import { INVALID, labels, language, openDialog } from 'nexus-dialogs'
import type { ButtonSpec, DialogContext, DialogOptions, DialogResult, Labels } from 'nexus-dialogs'
import { h, uid } from './core/dom'
import { isCLABE, isCURP, isNSS, isPostalCode, isRFC } from './mx'
import { CAMPOS, FIELDS_CSS, type CustomControl, type NestedFieldSet, type PhoneCountry, type PostalLookup } from './fields'
export { defaultDatePresets, DEFAULT_COUNTRIES, formatPhone } from './fields'
export type { Address, PhoneCountry, PostalLookup, CustomControl, FieldContext, FieldFactory } from './fields'
export { registerField } from './fields'

/**
 * Condición declarativa (sirve en JSON): `{ field: 'tipo', equals: 'empresa' }`, `{ field: 'pais', in: ['MX', 'US'] }`,
 * `{ field: 'rfc', filled: true }`, `{ all: [...] }`, `{ any: [...] }`, `{ not: ... }`.
 */
export type Condition =
  | { field: string; equals?: unknown; notEquals?: unknown; in?: unknown[]; filled?: boolean }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }

/** Evalúa una condición contra los valores. */
export function matches(c: Condition, v: Record<string, unknown>): boolean {
  if ('all' in c) return c.all.every((x) => matches(x, v))
  if ('any' in c) return c.any.some((x) => matches(x, v))
  if ('not' in c) return !matches(c.not, v)
  const x = v[c.field]
  if ('equals' in c) return x === c.equals
  if ('notEquals' in c) return x !== c.notEquals
  if (c.in) return c.in.includes(x)
  if (c.filled !== undefined) return c.filled === !(vacio(x) || x === false)
  return !(vacio(x) || x === false)
}

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
  | 'phone'
  | 'address'
  | 'signature'
  /** Un tipo propio registrado con `registerField`. */
  | (string & {})

/**
 * Columnas del formulario. `1` o `2` fijas (en pantallas angostas `2` se queda en dos columnas mientras quepan
 * campos de ~9 rem; si no, baja a una). `'auto'` reparte los campos en tantas columnas como quepan (2 en un
 * teléfono, 3 en escritorio), y los campos largos (textarea, radio, firma…) ocupan toda la fila.
 */
export type FormColumns = 1 | 2 | 'auto'

export type Option = string | { value: string; label: string; disabled?: boolean; description?: string; group?: string; avatar?: string }
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
  /** Con columns: 2 o 'auto', ocupa toda la fila. */
  span?: 1 | 2
  /** Igual que `visible`, pero declarativo (sirve en JSON). */
  visibleIf?: Condition
  /** phone: ladas a elegir (por omisión México, EE. UU., España y Latinoamérica). */
  countries?: PhoneCountry[]
  /** phone: lada inicial. Por omisión '+52'. */
  dialCode?: string
  /** address: busca estado, municipio y colonias por código postal (tu API o SEPOMEX). null si no existe. */
  lookupPostalCode?: (postalCode: string) => Promise<PostalLookup | null> | PostalLookup | null
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
  /** combobox: mostrar avatar con iniciales (o la foto de `avatar` en cada opción). */
  avatars?: boolean

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
  /** Máximo de días del rango (con `periods`, el total entre todos los periodos). */
  maxDays?: number
  /**
   * daterange: en vez de un solo rango, el usuario arma una lista de periodos con un calendario siempre visible: rangos («17 al 19 nov»)
   * y días sueltos no corridos («25 nov»). Sin atajos ni cajas de texto. Valor: `{ from, to }[]` (un día suelto trae from = to) o null.
   */
  periods?: boolean
  /** date y daterange: calendario en la pantalla y fechas escritas como dd/mm/aaaa (sin el selector del navegador). */
  calendar?: boolean
  /**
   * daterange: cuenta y muestra los días hábiles («8 días hábiles»); `maxDays` pasa a contar solo hábiles y el calendario marca
   * fines de semana y festivos. true = sin sábados, domingos ni los festivos de ley de México; 'custom' = solo los de `holidays`.
   */
  businessDays?: boolean | 'custom'
  /** Festivos propios de la empresa, como AAAA-MM-DD (se suman a los de ley). */
  holidays?: string[]

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
  /** Se incrementa con cada validación: una respuesta asíncrona vieja no debe pisar a la más reciente. */
  seq: number
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
    private columns: FormColumns = 1,
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
    const c: Control = { f, wrap: h('div'), input: null, group: [], msg, tocado: false, seq: 0 }
    const requerido = f.required ? 'true' : null
    const etiqueta = (forId: string | null) =>
      h('label', { for: forId }, f.label, f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null)

    const fabrica = tipo === 'date' && f.calendar ? CAMPOS.datecal : CAMPOS[tipo]
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
    if (this.columns !== 1 && (f.span === 2 || (this.columns === 'auto' && f.span !== 1 && FILA_COMPLETA.test(tipo)))) {
      c.wrap.classList.add('span-2')
    }

    c.inicial = JSON.stringify(this.valorDe(c), serializable)
    const al = async (ev: Event) => {
      if (ev.type === 'change') c.tocado = true
      else if (ev.type === 'focusout' && JSON.stringify(this.valorDe(c), serializable) !== c.inicial) c.tocado = true
      // Primero lo que no espera: mostrar u ocultar campos condicionales. Luego la validación (puede ser async).
      this.actualizarVisibles()
      this.alCambiar()
      if (c.tocado && (!c.custom?.lazy || c.wrap.classList.contains('invalid'))) {
        const n = ++c.seq
        const e = await this.validarUno(c)
        if (n === c.seq) this.mostrar(c, e)
      }
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
      return (c.f.visible ? c.f.visible(valores) : true) && (c.f.visibleIf ? matches(c.f.visibleIf, valores) : true)
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
      const n = ++c.seq
      const e = extra[c.f.name] || (await this.validarUno(c))
      if (n === c.seq) this.mostrar(c, e)
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
        else if (t === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
          const [y, m, d] = String(v).split('-').map(Number)
          s = new Date(y, m - 1, d).toLocaleDateString(language() === 'en' ? 'en-US' : 'es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        } else if (c.f.options) s = (c.f.options.map(opcion).find((o) => o.value === v)?.label ?? String(v)) as string
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

// ── Borrador automático ─────────────────────────────────────────────────────

const TXT = {
  es: {
    title: '¿Continuar donde te quedaste?',
    text: 'Guardamos lo que escribiste la última vez.',
    resume: 'Continuar',
    fresh: 'Empezar de nuevo',
  },
  en: { title: 'Pick up where you left off?', text: 'We saved what you typed last time.', resume: 'Continue', fresh: 'Start over' },
}
const PREFIJO = 'nexus-dialogs:draft:'
interface Guardado {
  values: Record<string, unknown>
  step?: number
  at: number
}

/** Guarda en localStorage (sin contraseñas ni archivos) mientras se escribe; se borra al enviar o al descartar. */
class Borrador {
  private timer?: ReturnType<typeof setTimeout>
  private omitir: Set<string>
  constructor(
    private clave: string,
    campos: Field[],
  ) {
    this.omitir = new Set(campos.filter((f) => f.type === 'password' || f.type === 'file').map((f) => f.name))
  }
  leer(): Guardado | null {
    try {
      const g = JSON.parse(localStorage.getItem(PREFIJO + this.clave) ?? 'null') as Guardado | null
      return g && typeof g.values === 'object' ? g : null
    } catch {
      return null
    }
  }
  programar(datos: () => Omit<Guardado, 'at'>): void {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      try {
        const d = datos()
        const values = Object.fromEntries(Object.entries(d.values).filter(([k]) => !this.omitir.has(k)))
        const json = JSON.stringify({ ...d, values, at: Date.now() }, (_k, v) =>
          typeof File !== 'undefined' && v instanceof File ? undefined : v,
        )
        localStorage.setItem(PREFIJO + this.clave, json)
      } catch {}
    }, 300)
  }
  borrar(): void {
    clearTimeout(this.timer)
    try {
      localStorage.removeItem(PREFIJO + this.clave)
    } catch {}
  }
  /** Detiene el guardado pendiente (al cerrar sin borrar). */
  parar(): void {
    clearTimeout(this.timer)
  }
}

/** Si hay borrador, pregunta (o lo usa directo con prompt: false). Devuelve lo que hay que restaurar. */
async function restaurar(b: Borrador | null, preguntar: boolean): Promise<Guardado | null> {
  const g = b?.leer()
  if (!b || !g) return null
  if (!preguntar) return g
  const t = TXT[language() === 'es' ? 'es' : 'en']
  const r = await openDialog({
    role: 'alertdialog',
    title: t.title,
    text: t.text,
    icon: 'info',
    size: 'sm',
    dismissible: { escape: false, backdrop: false },
    buttons: [
      { id: 'fresh', role: 'deny', text: t.fresh, variant: 'secondary' },
      { id: 'resume', role: 'confirm', text: t.resume, variant: 'primary' },
    ],
  })
  if (r.confirmed) return g
  b.borrar()
  return null
}

/** Al terminar: enviado → se borra; cerrado → se queda (salvo que se haya descartado, eso lo borra beforeClose). */
const alTerminar =
  <T>(b: Borrador | null) =>
  (r: DialogResult<T>): DialogResult<T> => {
    if (r.confirmed) b?.borrar()
    else b?.parar()
    return r
  }

interface ConBorrador {
  /** Guarda lo escrito en este navegador (localStorage) y lo ofrece al volver a abrir. Usa una clave por formulario: 'alta-empleado'. */
  draftKey?: string
  /** Preguntar «¿Continuar donde te quedaste?». Con false restaura sin preguntar. Por omisión true. */
  draftPrompt?: boolean
}

export interface FormOptions<T> extends ConBorrador, Omit<DialogOptions<T>, 'requireText'> {
  fields: Field[]
  /** Valores iniciales (por nombre). También puedes poner `value` en cada campo. */
  values?: Partial<T>
  /** 1 o 2 columnas. En celular siempre 1. */
  columns?: FormColumns
  /** Validación entre campos: devuelve { campo: 'mensaje' }. Puede ser async. */
  validate?: (values: T) => Record<string, string> | void | Promise<Record<string, string> | void>
  /** Texto del botón principal. Por omisión «Guardar». */
  submitText?: string
  /** Preguntar antes de cerrar si hay cambios sin guardar. Por omisión true. */
  confirmDiscard?: boolean
}

/** Formulario en un diálogo. Resuelve con los valores al confirmar (y después de `preConfirm`, si lo hay). */
export function form<T extends Record<string, unknown> = Record<string, unknown>>(o: FormOptions<T>): Promise<DialogResult<T>> {
  const b = o.draftKey ? new Borrador(o.draftKey, o.fields) : null
  // Sin borrador guardado se abre en el acto (sin esperar un ciclo).
  return b?.leer() ? restaurar(b, o.draftPrompt !== false).then((g) => abrirForm(o, b, g)) : abrirForm(o, b, null)
}

function abrirForm<T extends Record<string, unknown>>(
  o: FormOptions<T>,
  b: Borrador | null,
  previo: Guardado | null,
): Promise<DialogResult<T>> {
  const L = labels()
  const iniciales = { ...(o.values ?? {}), ...(previo?.values ?? {}) } as Record<string, unknown>
  let campos!: FieldSet
  const errores = resumen()
  return openDialog<T>({
    role: 'dialog',
    initialFocus: 'first-field',
    dismissible: { backdrop: false },
    size: o.columns === 2 || o.columns === 'auto' ? 'lg' : 'md',
    ...o,
    moduleCss: FORM_CSS + FIELDS_CSS,
    buttons: o.buttons ?? [
      { id: 'cancel', role: 'cancel', text: o.cancelText ?? L.cancel },
      { id: 'confirm', role: 'confirm', text: o.submitText ?? o.confirmText ?? L.submit, variant: o.danger ? 'danger' : 'primary' },
    ],
    render: () => {
      campos = new FieldSet(o.fields, iniciales, o.columns ?? 1, () => b?.programar(() => ({ values: campos.values() })))
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
      if (o.confirmDiscard === false || !campos.dirty()) return true
      const si = await descartar()
      if (si) b?.borrar()
      return si
    },
  }).then(alTerminar<T>(b))
}

export interface WizardStep {
  title: string
  description?: string
  fields: Field[]
  columns?: FormColumns
  /** Validación del paso completo (entre campos). */
  validate?: (values: Record<string, unknown>) => Record<string, string> | void | Promise<Record<string, string> | void>
  /** Mostrar el paso solo si se cumple (con los valores de los pasos anteriores). Función o condición declarativa. */
  when?: ((values: Record<string, unknown>) => boolean) | Condition
}

export interface WizardOptions<T> extends ConBorrador, Omit<DialogOptions<T>, 'requireText'> {
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

/** Asistente de varios pasos. Cada paso valida antes de avanzar; «Atrás» nunca pierde datos. Los pasos con `when` aparecen según las respuestas. */
export function wizard<T extends Record<string, unknown> = Record<string, unknown>>(o: WizardOptions<T>): Promise<DialogResult<T>> {
  const b = o.draftKey
    ? new Borrador(
        o.draftKey,
        o.steps.flatMap((s) => s.fields),
      )
    : null
  return b?.leer() ? restaurar(b, o.draftPrompt !== false).then((g) => abrirWizard(o, b, g)) : abrirWizard(o, b, null)
}

function abrirWizard<T extends Record<string, unknown>>(
  o: WizardOptions<T>,
  b: Borrador | null,
  previo: Guardado | null,
): Promise<DialogResult<T>> {
  const L = labels()
  const iniciales = { ...(o.values ?? {}), ...(previo?.values ?? {}) } as Record<string, unknown>
  const pasos: FieldSet[] = []
  const conRevision = !!o.review
  const REV = o.steps.length // índice del paso de revisión
  let actual = 0
  let ctxRef: DialogContext | undefined
  let firmaBotones = ''
  const errores = resumen()
  const lista = h('ol', { class: 'stepper' })
  const encabezado = h('h3', { class: 'step-title', tabindex: '-1' })
  const contador = h('p', { class: 'step-count' })
  const descripcion = h('p', { class: 'step-desc' })
  const contenedor = h('div', { class: 'steps' })
  const revision = h('div', { class: 'review', hidden: true })

  const titulos = [...o.steps.map((s) => s.title), ...(conRevision ? [typeof o.review === 'string' ? o.review : L.review] : [])]

  /** Índices de los pasos que aplican, evaluando en orden con lo contestado antes. */
  const activos = (): number[] => {
    const acc: Record<string, unknown> = {}
    const r: number[] = []
    o.steps.forEach((s, i) => {
      let si = true
      try {
        si = !s.when || (typeof s.when === 'function' ? s.when(acc) : matches(s.when, acc))
      } catch {}
      if (si) {
        r.push(i)
        Object.assign(acc, pasos[i]?.values())
      }
    })
    return r
  }
  const valores = (): T => Object.assign({}, ...activos().map((i) => pasos[i].values())) as T
  /** Orden visible: los pasos activos y luego la revisión. */
  const orden = () => [...activos(), ...(conRevision ? [REV] : [])]

  const botones = (): ButtonSpec[] => {
    const ord = orden()
    const ultimo = ord.indexOf(actual) === ord.length - 1
    return [
      { id: 'cancel', role: 'cancel', text: o.cancelText ?? L.cancel },
      { id: 'back', role: 'custom', text: o.backText ?? L.back, variant: 'secondary', hidden: ord.indexOf(actual) <= 0 },
      ultimo
        ? { id: 'confirm', role: 'confirm', text: o.submitText ?? o.confirmText ?? L.submit, variant: 'primary' }
        : { id: 'next', role: 'custom', text: o.nextText ?? L.next, variant: 'primary' },
    ]
  }

  const dibujarRevision = () => {
    revision.replaceChildren(
      ...activos().map((i) =>
        h(
          'section',
          null,
          h(
            'div',
            { class: 'rev-head' },
            h('h4', null, o.steps[i].title),
            h('button', { type: 'button', class: 'link', onclick: () => ir(i), 'aria-label': `${L.edit}: ${o.steps[i].title}` }, L.edit),
          ),
          h('dl', null, ...pasos[i].summary().flatMap((s) => [h('dt', null, s.label), h('dd', null, s.value)])),
        ),
      ),
    )
  }

  /** Barra de pasos, contador y botones según los pasos que aplican ahora. */
  const pintar = () => {
    const ord = orden()
    const pos = ord.indexOf(actual)
    ;[...lista.children].forEach((li, k) => {
      const j = ord.indexOf(k)
      ;(li as HTMLElement).hidden = j < 0
      li.className = j < 0 ? '' : j < pos ? 'done' : j === pos ? 'current' : ''
      if (k === actual) li.setAttribute('aria-current', 'step')
      else li.removeAttribute('aria-current')
    })
    contador.textContent = L.step.replace('{0}', String(pos + 1)).replace('{1}', String(ord.length))
    const bs = botones()
    const firma = bs.map((x) => `${x.id}${x.hidden ? 0 : 1}`).join()
    if (firma !== firmaBotones) {
      firmaBotones = firma
      ctxRef?.setButtons(bs)
    }
  }

  const guardar = () => b?.programar(() => ({ values: valores(), step: actual }))

  function ir(i: number, enfocar = true): void {
    actual = i
    errores.set([])
    pasos.forEach((p, k) => (p.el.hidden = k !== i))
    revision.hidden = i !== REV
    if (!revision.hidden) dibujarRevision()
    encabezado.textContent = titulos[i]
    descripcion.textContent = o.steps[i]?.description ?? ''
    descripcion.hidden = !descripcion.textContent
    pintar()
    guardar()
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
        const p = new FieldSet(s.fields, iniciales, s.columns ?? 1, () => {
          pintar()
          guardar()
        })
        pasos.push(p)
        contenedor.appendChild(p.el)
      })
      // Al restaurar un borrador, vuelve al paso donde se quedó (si sigue aplicando).
      const ord = orden()
      ir(previo?.step !== undefined && ord.includes(previo.step) ? previo.step : ord[0], false)
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
      firmaBotones = ''
      pintar()
      if (actual === REV) encabezado.focus()
      else pasos[actual]?.focusFirst()
      o.onOpen?.(ctx)
    },
    onAction: async (btn) => {
      const ord = orden()
      const pos = ord.indexOf(actual)
      if (btn.id === 'back') {
        if (pos > 0) ir(ord[pos - 1])
        return true
      }
      if (btn.id === 'next') {
        if (actual !== REV && !(await validarPaso(actual))) return true
        // Recalcula: lo que se contestó en este paso puede activar o quitar los siguientes.
        const nuevo = orden()
        const sig = nuevo[nuevo.indexOf(actual) + 1]
        if (sig !== undefined) ir(sig)
        return true
      }
      return false
    },
    collect: async () => {
      for (const i of activos()) {
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
      if (o.confirmDiscard === false || !pasos.some((p) => p.dirty())) return true
      const si = await descartar()
      if (si) b?.borrar()
      return si
    },
  }).then(alTerminar<T>(b))
}

// ── Formularios desde JSON ──────────────────────────────────────────────────

type Funciones =
  'validate' | 'visible' | 'search' | 'creatable' | 'upload' | 'totals' | 'lookupPostalCode' | 'pattern' | 'fields' | 'presets'
/** Un campo en JSON: lo mismo que `Field`, pero las funciones van por nombre (se buscan en `resolvers`). */
export interface JSONField extends Omit<Field, Funciones> {
  pattern?: string
  validate?: string
  search?: string
  creatable?: boolean | string
  upload?: string
  totals?: string
  lookupPostalCode?: string
  presets?: false
  fields?: JSONField[]
}
export interface JSONStep extends Omit<WizardStep, 'fields' | 'validate' | 'when'> {
  fields: JSONField[]
  when?: Condition
  validate?: string
}
/** Formulario descrito en JSON (por ejemplo, guardado en tu base de datos por empresa). Con `steps` es un asistente. */
export interface FormSchema {
  title: string
  text?: string
  columns?: FormColumns
  size?: 'sm' | 'md' | 'lg' | 'xl'
  submitText?: string
  cancelText?: string
  draftKey?: string
  fields?: JSONField[]
  steps?: JSONStep[]
  review?: boolean | string
  /** Validación entre campos, por nombre. */
  validate?: string
}
export interface FromJSONOptions<T> {
  /** Funciones a las que el JSON se refiere por nombre: { rfcUnico: async (v) => …, buscarClientes: (q) => … }. */
  resolvers?: Record<string, (...args: any[]) => any>
  values?: Partial<T>
  /** Cualquier otra opción de form() o wizard() (preConfirm, onOpen, theme…). */
  options?: Partial<FormOptions<T> & WizardOptions<T>>
}

const TIPOS = new Set<string>(
  'text email tel url password number date time textarea select radio segmented checkbox switch money rfc curp nss clabe postal combobox file daterange otp items phone address signature'.split(
    ' ',
  ),
)

/** Convierte el JSON en campos reales. Lanza un error claro si un tipo no existe o falta un resolver. */
export function fieldsFromJSON(campos: JSONField[], resolvers: Record<string, (...args: any[]) => any> = {}): Field[] {
  const fn = (nombre: string, campo: string) => {
    const r = resolvers[nombre]
    if (typeof r !== 'function') throw new Error(`nexus-dialogs: falta el resolver «${nombre}» (campo «${campo}»)`)
    return r
  }
  return campos.map((c) => {
    if (!c || typeof c.name !== 'string' || typeof c.label !== 'string') throw new Error('nexus-dialogs: cada campo necesita name y label')
    if (c.type && !TIPOS.has(c.type)) throw new Error(`nexus-dialogs: tipo desconocido «${c.type}» (campo «${c.name}»)`)
    const f = { ...c } as unknown as Field
    for (const k of ['validate', 'search', 'upload', 'totals', 'lookupPostalCode'] as const)
      if (typeof c[k] === 'string') (f as any)[k] = fn(c[k] as string, c.name)
    if (typeof c.creatable === 'string') f.creatable = fn(c.creatable, c.name)
    if (c.fields) f.fields = fieldsFromJSON(c.fields, resolvers)
    return f
  })
}

/** Abre un form() o un wizard() (si trae `steps`) a partir de JSON. Acepta el objeto o el texto JSON. */
export function formFromJSON<T extends Record<string, unknown> = Record<string, unknown>>(
  schema: FormSchema | string,
  opts: FromJSONOptions<T> = {},
): Promise<DialogResult<T>> {
  try {
    const sc: FormSchema = typeof schema === 'string' ? JSON.parse(schema) : schema
    const r = opts.resolvers ?? {}
    const global = sc.validate ? r[sc.validate] : undefined
    if (sc.validate && typeof global !== 'function') throw new Error(`nexus-dialogs: falta el resolver «${sc.validate}» (validate)`)
    const comunes = {
      title: sc.title,
      text: sc.text,
      size: sc.size,
      submitText: sc.submitText,
      cancelText: sc.cancelText,
      draftKey: sc.draftKey,
      values: opts.values,
    }
    if (sc.steps) {
      return wizard<T>({
        ...comunes,
        review: sc.review,
        steps: sc.steps.map((p) => {
          const v = p.validate ? r[p.validate] : undefined
          if (p.validate && typeof v !== 'function') throw new Error(`nexus-dialogs: falta el resolver «${p.validate}» (paso «${p.title}»)`)
          return { ...p, fields: fieldsFromJSON(p.fields, r), validate: v as WizardStep['validate'] }
        }),
        ...opts.options,
      } as WizardOptions<T>)
    }
    return form<T>({
      ...comunes,
      columns: sc.columns,
      fields: fieldsFromJSON(sc.fields ?? [], r),
      validate: global as FormOptions<T>['validate'],
      ...opts.options,
    } as FormOptions<T>)
  } catch (e) {
    return Promise.reject(e)
  }
}

/** En columns: 'auto', estos tipos ocupan toda la fila (salvo `span: 1`): son largos por naturaleza. */
const FILA_COMPLETA = /^(textarea|radio|segmented|items|address|signature|file|daterange|otp)$/

const FORM_CSS = `
.grid{display:grid;gap:16px}
.cols-2{grid-template-columns:1fr 1fr}
.cols-auto{grid-template-columns:repeat(auto-fill,minmax(var(--nd-col-min,11rem),1fr))}
.span-2{grid-column:1/-1}
.narrow .cols-2,.narrow .cols-auto{grid-template-columns:repeat(auto-fill,minmax(max(8.75rem,calc((100% - 12px)/2)),1fr));gap:14px 12px}
.field[hidden],[hidden]{display:none!important}
fieldset.field{border:0;margin:0;padding:0;min-width:0}
legend{font-size:14px;font-weight:500;color:var(--_label);padding:0;margin-bottom:6px}
.req{color:var(--_error)}
select.input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--_subtle) 50%),linear-gradient(135deg,var(--_subtle) 50%,transparent 50%);
  background-position:calc(100% - 20px) 19px,calc(100% - 15px) 19px;background-size:5px 5px;background-repeat:no-repeat;padding-inline-end:40px}
:host([dir=rtl]) select.input{background-position:20px 19px,15px 19px}
.options{display:grid;gap:10px}
.check{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:500;color:var(--_label);cursor:pointer}
.check input{width:18px;height:18px;margin:0;accent-color:var(--_accent)}
.toggle{display:flex;gap:12px;align-items:center;cursor:pointer;font-size:14px;font-weight:500;color:var(--_label)}
.toggle input{position:absolute;opacity:0;width:40px;height:22px;margin:0}
.track{flex:none;position:relative;width:40px;height:22px;border-radius:999px;background:var(--_line);transition:background .15s}
.track::after{content:"";position:absolute;top:2px;inset-inline-start:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(16,24,40,.2);transition:transform .15s}
.toggle input:checked+.track{background:var(--_accent)}
.toggle input:checked+.track::after{transform:translateX(18px)}
:host([dir=rtl]) .toggle input:checked+.track::after{transform:translateX(-18px)}
.toggle input:focus-visible+.track,.seg-item input:focus-visible+span{box-shadow:0 0 0 4px var(--_focus)}
/* Segmentado: pastilla gris con la opción elegida en blanco. */
.seg{display:flex;gap:4px;padding:4px;background:var(--_surface);border:1px solid var(--_line);border-radius:var(--_control-radius)}
.seg-item{flex:1;position:relative}
.seg-item input{position:absolute;opacity:0;inset:0;margin:0}
.seg-item span{display:flex;align-items:center;justify-content:center;height:34px;padding:0 10px;border-radius:8px;font-size:14px;font-weight:500;color:var(--_muted);cursor:pointer;text-align:center}
.seg-item input:checked+span{background:var(--_bg);color:var(--_fg);box-shadow:0 1px 3px rgba(16,24,40,.1),0 1px 2px rgba(16,24,40,.06)}
.affix{display:flex;align-items:center;border:1px solid var(--_border);border-radius:var(--_control-radius);background:var(--_bg);padding:0 14px;gap:8px;box-shadow:var(--_xs)}
.affix:focus-within{border-color:color-mix(in srgb,var(--_accent) 55%,var(--_bg));box-shadow:var(--_xs),0 0 0 4px var(--_focus)}
.affix span{color:var(--_subtle);font-size:14px}
.affix .input{border:0;padding:0;box-shadow:none!important;text-align:end;font-variant-numeric:tabular-nums}
.invalid>.affix{border-color:color-mix(in srgb,var(--_error) 55%,var(--_bg));box-shadow:var(--_xs),0 0 0 4px color-mix(in srgb,var(--_error) 9%,transparent)}
.summary{margin:0 0 18px;padding:12px 14px;border-radius:12px;border:1px solid color-mix(in srgb,var(--_error) 25%,var(--_bg));
  background:color-mix(in srgb,var(--_error) 6%,var(--_bg));font-size:14px}
.summary:focus{outline:none;box-shadow:0 0 0 4px color-mix(in srgb,var(--_error) 15%,transparent)}
.summary p{margin:0 0 4px;font-weight:600;color:color-mix(in srgb,var(--_cancel-fg) 70%,var(--_fg))}
.summary ul{margin:0;padding-inline-start:20px}
.summary li{margin:2px 0}
.summary a{color:color-mix(in srgb,var(--_cancel-fg) 70%,var(--_fg));display:block;min-height:24px;line-height:24px}
/* Asistente: barras de progreso con el nombre del paso debajo. */
.stepper{list-style:none;margin:0 0 20px;padding:0;display:flex;gap:8px;font-size:13px;font-weight:500;color:var(--_subtle)}
.stepper li{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.stepper li::before{content:"";display:block;height:4px;border-radius:4px;background:var(--_line)}
.stepper .done::before,.stepper .current::before{background:var(--_accent)}
.stepper .num{display:none}
.stepper li span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stepper .done{color:var(--_label)}
.stepper .current{color:var(--_accent);font-weight:600}
.narrow .stepper li:not(.current) span:last-child{visibility:hidden}
.step-head{margin-bottom:16px}
.step-count{margin:0;font-size:13px;color:var(--_subtle)}
.step-title{margin:2px 0 0;font:600 16px/24px var(--_title-font);color:var(--_fg)}
.step-title:focus{outline:none}
.step-desc{margin:4px 0 0;color:var(--_muted);font-size:14px}
.review{display:grid;gap:12px}
.review section{border:1px solid var(--_line);border-radius:12px;padding:14px 16px}
.rev-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.rev-head h4{margin:0;font-size:15px;font-weight:600}
.review dl{margin:0;display:grid;grid-template-columns:minmax(140px,auto) 1fr;gap:6px 16px;font-size:14px}
.review dt{color:var(--_subtle)}
.review dd{margin:0;overflow-wrap:anywhere;color:var(--_fg)}
.link{border:0;background:transparent;color:var(--_accent);font:600 14px var(--_font);cursor:pointer;padding:6px 8px;border-radius:8px}
.link:hover{background:color-mix(in srgb,var(--_accent) 8%,transparent)}
.link:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
`
