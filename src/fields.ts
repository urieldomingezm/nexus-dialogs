// Campos avanzados para form() y wizard(): combobox, file, daterange, otp e items.
// Cada uno es una «fábrica» que devuelve un control propio; FieldSet (forms.ts) pone la etiqueta, la ayuda y el error.
import { language } from 'nexus-dialogs'
import type { DatePreset, Field, Option } from './forms'
import { css, h, svg, uid } from './core/dom'

/** Lo que FieldSet necesita de un control propio. */
export interface CustomControl {
  /** El control, sin etiqueta ni mensaje de error. */
  el: HTMLElement
  value(): unknown
  focus(): void
  invalid(on: boolean): void
  /** Validación propia del tipo (corre siempre, después de «obligatorio»; con el campo vacío debe devolver null). */
  validate?(): string | null | undefined | Promise<string | null | undefined>
  /** Texto para la revisión del asistente. */
  summary?(): string
  /** Usa <fieldset> + <legend> (controles con varias partes) en lugar de <label for>. */
  group?: boolean
  /** Valida solo al enviar (o para quitar un error ya mostrado), no al salir de cada parte. */
  lazy?: boolean
}

/** Un FieldSet anidado (filas de «items»). */
export interface NestedFieldSet {
  el: HTMLElement
  values(): Record<string, unknown>
  validate(extra?: Record<string, string>): Promise<{ label: string; focus: () => void }[]>
  summary(): { label: string; value: string }[]
  focusFirst(): void
}

export interface FieldContext {
  /** id para el elemento enfocable principal (la etiqueta apunta a él). */
  id: string
  /** ids de la ayuda y del mensaje de error. */
  describedBy: string
  field: Field
  required: boolean
  nested: (fields: Field[], values: Record<string, unknown>, onChange: () => void) => NestedFieldSet
}

type Fabrica = (ctx: FieldContext, valor: unknown) => CustomControl

// ── Textos ──────────────────────────────────────────────────────────────────
const ES = {
  noResults: 'Sin resultados',
  searching: 'Buscando…',
  searchError: 'No se pudo buscar',
  create: 'Crear «{0}»',
  remove: 'Quitar',
  removeItem: 'Quitar {0}',
  maxItems: 'Puedes elegir hasta {0}.',
  options: '{0} opciones',
  dropHere: 'Arrastra aquí o',
  chooseFile: 'Elegir archivo',
  chooseFiles: 'Elegir archivos',
  uploading: 'Espera a que terminen de subirse los archivos.',
  uploadFailed: 'Algún archivo no se subió: quítalo o reinténtalo.',
  retry: 'Reintentar',
  done: 'Listo',
  tooBig: '{0} no se agregó: pesa más de {1}.',
  badType: '{0} no se agregó: tipo no permitido.',
  tooMany: 'Puedes subir hasta {0} archivos.',
  from: 'Desde',
  to: 'Hasta',
  bothDates: 'Completa las dos fechas.',
  order: '«Hasta» debe ser igual o posterior a «Desde».',
  maxDays: 'El rango es de máximo {0} días.',
  outOfRange: 'Las fechas deben estar entre {0} y {1}.',
  today: 'Hoy',
  week: 'Esta semana',
  fortnight: 'Quincena actual',
  month: 'Este mes',
  lastMonth: 'Mes pasado',
  last30: 'Últimos 30 días',
  otpLength: 'Escribe los {0} dígitos.',
  add: 'Agregar fila',
  row: 'Fila {0}',
  removeRow: 'Quitar fila {0}',
  rowsInvalid: 'Revisa las filas marcadas.',
  minRows: 'Agrega al menos {0} fila(s).',
  dialCode: 'Lada',
  phoneDigits: 'Escribe los {0} dígitos del teléfono.',
  postalCode: 'Código postal',
  state: 'Estado',
  municipality: 'Municipio o alcaldía',
  neighborhood: 'Colonia',
  street: 'Calle y número',
  chooseNeighborhood: 'Elige la colonia',
  postalNotFound: 'No encontramos ese código postal: escribe los datos.',
  missing: 'Falta: {0}.',
}
type Textos = typeof ES
const EN: Textos = {
  noResults: 'No results',
  searching: 'Searching…',
  searchError: 'Search failed',
  create: 'Create “{0}”',
  remove: 'Remove',
  removeItem: 'Remove {0}',
  maxItems: 'You can choose up to {0}.',
  options: '{0} options',
  dropHere: 'Drop here or',
  chooseFile: 'Choose file',
  chooseFiles: 'Choose files',
  uploading: 'Wait for the files to finish uploading.',
  uploadFailed: 'A file failed to upload: remove it or retry.',
  retry: 'Retry',
  done: 'Done',
  tooBig: '{0} was not added: it is larger than {1}.',
  badType: '{0} was not added: type not allowed.',
  tooMany: 'You can upload up to {0} files.',
  from: 'From',
  to: 'To',
  bothDates: 'Fill in both dates.',
  order: '“To” must be the same as or after “From”.',
  maxDays: 'The range can be at most {0} days.',
  outOfRange: 'Dates must be between {0} and {1}.',
  today: 'Today',
  week: 'This week',
  fortnight: 'Current fortnight',
  month: 'This month',
  lastMonth: 'Last month',
  last30: 'Last 30 days',
  otpLength: 'Enter all {0} digits.',
  add: 'Add row',
  row: 'Row {0}',
  removeRow: 'Remove row {0}',
  rowsInvalid: 'Check the highlighted rows.',
  minRows: 'Add at least {0} row(s).',
  dialCode: 'Country code',
  phoneDigits: 'Enter all {0} digits of the phone number.',
  postalCode: 'ZIP code',
  state: 'State',
  municipality: 'Municipality',
  neighborhood: 'Neighborhood',
  street: 'Street and number',
  chooseNeighborhood: 'Choose the neighborhood',
  postalNotFound: 'ZIP code not found: type the details.',
  missing: 'Missing: {0}.',
}
const T = (): Textos => (language() === 'en' ? EN : ES)
const f = (s: string, ...v: (string | number)[]) => s.replace(/\{(\d)\}/g, (_, i) => String(v[+i] ?? ''))
const cambio = (el: Element) => el.dispatchEvent(new Event('change', { bubbles: true }))

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter((p) => /^\p{L}/u.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
/** Avatar: la foto si la opción trae `avatar`; si no, iniciales con un tono fijo por nombre (clases, sin estilos en línea por CSP). */
function avatar(o: { label: string; avatar?: string }, clase = 'av'): HTMLElement {
  if (o.avatar) return h('img', { class: clase, src: o.avatar, alt: '' })
  let n = 0
  for (const c of o.label) n = (n * 31 + c.charCodeAt(0)) >>> 0
  return h('span', { class: `${clase} t${n % 7}`, 'aria-hidden': 'true' }, iniciales(o.label))
}

type Opt = { value: string; label: string; disabled: boolean; description?: string; group?: string; avatar?: string }
const opt = (o: Option): Opt => (typeof o === 'string' ? { value: o, label: o, disabled: false } : { disabled: false, ...o })
/** Sin acentos ni mayúsculas, para buscar «nomina» y encontrar «Nómina». */
const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── combobox ────────────────────────────────────────────────────────────────

const combobox: Fabrica = (ctx, valor) => {
  const t = T()
  const fl = ctx.field
  const multiple = !!fl.multiple
  const conocidas = new Map<string, Opt>()
  for (const o of (fl.options ?? []).map(opt)) conocidas.set(o.value, o)
  let elegidos: string[] = Array.isArray(valor)
    ? valor.map(String)
    : valor !== undefined && valor !== null && valor !== ''
      ? [String(valor)]
      : []
  let visibles: Opt[] = []
  let activo = -1
  let abierto = false
  let espera: ReturnType<typeof setTimeout> | undefined
  let consulta = 0
  const CREAR = '\u0000crear'

  const listaId = uid('cbl')
  const input = h('input', {
    id: ctx.id,
    class: 'input cb-input',
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: fl.placeholder,
    disabled: fl.disabled,
    'aria-expanded': 'false',
    'aria-controls': listaId,
    'aria-autocomplete': 'list',
    'aria-describedby': ctx.describedBy,
    'aria-required': ctx.required ? 'true' : null,
  })
  const lista = h('ul', {
    id: listaId,
    class: 'cb-list',
    role: 'listbox',
    hidden: true,
    'aria-label': fl.label,
    'aria-multiselectable': multiple ? 'true' : null,
  })
  const chips = h('ul', { class: 'cb-chips', hidden: !multiple })
  const estado = h('p', { class: 'sr', role: 'status' })
  const el = h('div', { class: 'cb' }, chips, h('div', { class: 'cb-box' }, input, lista), estado)

  const etiqueta = (v: string) => conocidas.get(v)?.label ?? v
  const conAvatar = () => !!fl.avatars || [...conocidas.values()].some((o) => o.avatar)

  const pintarChips = () => {
    if (!multiple) return
    chips.hidden = !elegidos.length
    chips.replaceChildren(
      ...elegidos.map((v) =>
        h(
          'li',
          null,
          conAvatar() ? avatar(conocidas.get(v) ?? { label: etiqueta(v) }, 'av av-sm') : null,
          h('span', null, etiqueta(v)),
          h(
            'button',
            {
              type: 'button',
              class: 'cb-x',
              'aria-label': f(t.removeItem, etiqueta(v)),
              disabled: fl.disabled,
              onclick: () => {
                elegidos = elegidos.filter((x) => x !== v)
                pintarChips()
                cambio(el)
                input.focus()
              },
            },
            '×',
          ),
        ),
      ),
    )
  }

  const textoSimple = () => {
    if (!multiple) input.value = elegidos[0] ? etiqueta(elegidos[0]) : ''
  }

  const abrir = (si: boolean) => {
    abierto = si
    lista.hidden = !si
    input.setAttribute('aria-expanded', String(si))
    if (si) {
      // Si abajo no cabe (el campo está al final del diálogo), la lista se abre hacia arriba.
      const caja = input.closest('.body')?.getBoundingClientRect()
      const r = input.getBoundingClientRect()
      lista.classList.toggle('up', !!caja && caja.bottom - r.bottom < 200 && r.top - caja.top > caja.bottom - r.bottom)
    }
    if (!si) {
      activo = -1
      input.removeAttribute('aria-activedescendant')
    }
  }

  const fila = (texto: string, clase: string) => h('li', { class: `cb-note ${clase}`, role: 'presentation' }, texto)

  const pintar = (nota?: string) => {
    const items: Node[] = []
    let grupo: string | undefined
    visibles.forEach((o, i) => {
      if (o.group && o.group !== grupo) {
        grupo = o.group
        items.push(h('li', { class: 'cb-group', role: 'presentation' }, o.group))
      }
      const sel = elegidos.includes(o.value)
      items.push(
        h(
          'li',
          {
            id: `${listaId}-${i}`,
            role: 'option',
            class: ['cb-opt', i === activo ? 'active' : '', o.value === CREAR ? 'create' : ''].join(' ').trim(),
            'aria-selected': String(sel),
            'aria-disabled': o.disabled ? 'true' : null,
            onmousedown: (e: Event) => e.preventDefault(),
            onclick: () => !o.disabled && void elegir(o),
          },
          conAvatar() && o.value !== CREAR ? avatar(o) : null,
          h('span', { class: 'cb-text' }, h('span', null, o.label), o.description ? h('small', null, o.description) : null),
          h('span', { class: 'cb-check', 'aria-hidden': 'true' }, sel ? '✓' : ''),
        ),
      )
    })
    if (nota) items.push(fila(nota, 'muted'))
    else if (!visibles.length) items.push(fila(t.noResults, 'muted'))
    lista.replaceChildren(...items)
    if (activo >= 0) {
      input.setAttribute('aria-activedescendant', `${listaId}-${activo}`)
      lista.querySelector(`#${CSS.escape(`${listaId}-${activo}`)}`)?.scrollIntoView?.({ block: 'nearest' })
    } else input.removeAttribute('aria-activedescendant')
  }

  const conCrear = (q: string, lista: Opt[]): Opt[] => {
    if (!fl.creatable || !q.trim()) return lista
    const existe =
      lista.some((o) => plano(o.label) === plano(q.trim())) || [...conocidas.values()].some((o) => plano(o.label) === plano(q.trim()))
    return existe ? lista : [...lista, { value: CREAR, label: f(t.create, q.trim()), disabled: false }]
  }

  const buscar = (q: string) => {
    clearTimeout(espera)
    const anunciar = () => (estado.textContent = abierto ? f(t.options, visibles.filter((o) => o.value !== CREAR).length) : '')
    if (!fl.search) {
      const p = plano(q.trim())
      visibles = conCrear(
        q,
        [...conocidas.values()].filter((o) => !p || plano(o.label).includes(p) || plano(o.description ?? '').includes(p)),
      )
      activo = visibles.findIndex((o) => !o.disabled)
      pintar()
      anunciar()
      return
    }
    const n = ++consulta
    visibles = []
    activo = -1
    pintar(t.searching)
    espera = setTimeout(async () => {
      try {
        const r = (await fl.search!(q.trim())).map(opt)
        if (n !== consulta) return
        for (const o of r) conocidas.set(o.value, o)
        visibles = conCrear(q, r)
        activo = visibles.findIndex((o) => !o.disabled)
        pintar()
        anunciar()
      } catch {
        if (n !== consulta) return
        visibles = []
        pintar(t.searchError)
      }
    }, 250)
  }

  async function elegir(o: Opt): Promise<void> {
    let opcion = o
    if (o.value === CREAR) {
      const texto = input.value.trim()
      opcion = typeof fl.creatable === 'function' ? opt(await fl.creatable(texto)) : { value: texto, label: texto, disabled: false }
      conocidas.set(opcion.value, opcion)
    }
    if (multiple) {
      if (elegidos.includes(opcion.value)) elegidos = elegidos.filter((x) => x !== opcion.value)
      else if (fl.maxItems && elegidos.length >= fl.maxItems) {
        estado.textContent = f(t.maxItems, fl.maxItems)
        return
      } else elegidos = [...elegidos, opcion.value]
      pintarChips()
      if (o.value === CREAR) {
        input.value = ''
        buscar('')
      } else pintar()
    } else {
      elegidos = [opcion.value]
      textoSimple()
      abrir(false)
    }
    cambio(el)
  }

  input.addEventListener('focus', () => {
    if (!multiple) input.select()
  })
  input.addEventListener('input', (e) => {
    e.stopPropagation() // el texto que se escribe no es el valor del campo
    if (!multiple && !input.value) elegidos = []
    abrir(true)
    buscar(input.value)
  })
  input.addEventListener('click', () => {
    if (!abierto) {
      abrir(true)
      buscar(multiple ? input.value : '')
    }
  })
  input.addEventListener('keydown', (e) => {
    const mover = (d: number) => {
      if (!abierto) {
        abrir(true)
        buscar(multiple ? input.value : '')
        return
      }
      if (!visibles.length) return
      let i = activo
      for (let k = 0; k < visibles.length; k++) {
        i = (i + d + visibles.length) % visibles.length
        if (!visibles[i].disabled) break
      }
      activo = i
      pintar()
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      mover(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      mover(-1)
    } else if (e.key === 'Enter' && abierto) {
      // Con la lista abierta, Enter elige la opción marcada (o nada, si aún busca); nunca envía el formulario.
      e.preventDefault()
      e.stopPropagation()
      if (activo >= 0) void elegir(visibles[activo])
    } else if (e.key === 'Escape' && abierto) {
      // Cierra la lista, no el diálogo.
      e.preventDefault()
      e.stopPropagation()
      input.dispatchEvent(new Event('nexus-dialogs:escape', { bubbles: true, composed: true }))
      abrir(false)
      textoSimple()
    } else if (e.key === 'Backspace' && multiple && !input.value && elegidos.length) {
      elegidos = elegidos.slice(0, -1)
      pintarChips()
      cambio(el)
    } else if (e.key === 'Tab') abrir(false)
  })
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!input.isConnected || (input.getRootNode() as ShadowRoot).activeElement === input) return
      abrir(false)
      if (multiple) input.value = ''
      else textoSimple()
    }, 120)
  })

  pintarChips()
  textoSimple()
  return {
    el,
    value: () => (multiple ? [...elegidos] : (elegidos[0] ?? '')),
    focus: () => input.focus(),
    invalid: (on) => input.setAttribute('aria-invalid', String(on)),
    summary: () => elegidos.map(etiqueta).join(', '),
  }
}

// ── file ────────────────────────────────────────────────────────────────────

/** Etiqueta con la extensión (PDF, XML, JPG…); el color sale de la clase. */
function tipoArchivo(nombre: string): HTMLElement {
  const ext = nombre.includes('.') ? (nombre.split('.').pop() ?? '').toLowerCase() : ''
  const tono = /^pdf$/.test(ext)
    ? 'ft-pdf'
    : /^(xml|xlsx?|csv|ods)$/.test(ext)
      ? 'ft-data'
      : /^(docx?|odt|txt|rtf)$/.test(ext)
        ? 'ft-doc'
        : /^(jpe?g|png|gif|webp|heic|avif|svg)$/.test(ext)
          ? 'ft-img'
          : ''
  return h('span', { class: `ftype ${tono}`, 'aria-hidden': 'true' }, ext.slice(0, 4).toUpperCase() || '—')
}

const peso = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`)

function aceptado(file: File, accept?: string): boolean {
  if (!accept) return true
  const nombre = file.name.toLowerCase()
  return accept
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith('.') ? nombre.endsWith(a) : a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a))
}

interface Archivo {
  file: File
  estado: 'listo' | 'subiendo' | 'error'
  pct: number
  resultado?: unknown
  error?: string
}

const archivo: Fabrica = (ctx) => {
  const t = T()
  const fl = ctx.field
  const multiple = !!fl.multiple
  let archivos: Archivo[] = []
  const oculto = h('input', { type: 'file', class: 'sr', tabindex: '-1', 'aria-hidden': 'true', accept: fl.accept, multiple })
  const boton = h(
    'button',
    {
      type: 'button',
      id: ctx.id,
      class: 'btn btn-secondary btn-sm',
      disabled: fl.disabled,
      'aria-describedby': ctx.describedBy,
      onclick: () => oculto.click(),
    },
    multiple ? t.chooseFiles : t.chooseFile,
  )
  const aviso = h('p', { class: 'file-note', role: 'status' })
  const lista = h('ul', { class: 'files' })
  const zona = h(
    'div',
    { class: 'drop' },
    h(
      'span',
      { class: 'drop-ico', 'aria-hidden': 'true' },
      svg(
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 13v1.5A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5V13"/></svg>',
      ),
    ),
    h('div', { class: 'drop-row' }, h('span', null, t.dropHere), boton),
    fl.accept ? h('small', null, fl.accept.replace(/,/g, ', ')) : null,
  )
  const el = h('div', { class: 'file' }, zona, oculto, aviso, lista)

  const subir = async (a: Archivo) => {
    if (!fl.upload) return
    a.estado = 'subiendo'
    a.pct = 0
    a.error = undefined
    pintar()
    try {
      a.resultado = await fl.upload(a.file, (p) => {
        a.pct = Math.max(0, Math.min(100, Math.round(p)))
        const li = lista.querySelector<HTMLElement>(`[data-k="${archivos.indexOf(a)}"]`)
        const barra = li?.querySelector<HTMLElement>('[role=progressbar]')
        barra?.setAttribute('aria-valuenow', String(a.pct))
        if (barra?.firstElementChild) (barra.firstElementChild as HTMLElement).style.width = `${a.pct}%`
        const nota = li?.querySelector('small')
        if (nota) nota.textContent = `${peso(a.file.size)} · ${a.pct}%`
      })
      a.estado = 'listo'
    } catch (e) {
      a.estado = 'error'
      a.error = e instanceof Error ? e.message : String(e)
    }
    pintar()
    cambio(el)
  }

  const pintar = () => {
    lista.replaceChildren(
      ...archivos.map((a, k) =>
        h(
          'li',
          { 'data-k': k, class: a.estado },
          tipoArchivo(a.file.name),
          h(
            'div',
            { class: 'f-info' },
            h('span', { class: 'f-name' }, a.file.name),
            h(
              'small',
              null,
              peso(a.file.size),
              a.estado === 'error' ? ` · ${a.error}` : a.estado === 'subiendo' ? ` · ${a.pct}%` : fl.upload ? ` · ${t.done}` : '',
            ),
            a.estado === 'subiendo'
              ? h(
                  'div',
                  {
                    class: 'bar',
                    role: 'progressbar',
                    'aria-label': a.file.name,
                    'aria-valuemin': '0',
                    'aria-valuemax': '100',
                    'aria-valuenow': String(a.pct),
                  },
                  css(h('div'), { width: `${a.pct}%` }),
                )
              : null,
          ),
          a.estado === 'error'
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'btn btn-secondary btn-sm',
                  onclick: () => void subir(a),
                  'aria-label': `${t.retry}: ${a.file.name}`,
                },
                t.retry,
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-cancel btn-sm',
              'aria-label': f(t.removeItem, a.file.name),
              onclick: () => {
                archivos = archivos.filter((x) => x !== a)
                pintar()
                cambio(el)
                boton.focus()
              },
            },
            t.remove,
          ),
        ),
      ),
    )
  }

  const agregar = (lista: FileList | File[] | null) => {
    if (!lista) return
    const notas: string[] = []
    let nuevos: Archivo[] = []
    for (const file of Array.from(lista)) {
      if (!aceptado(file, fl.accept)) notas.push(f(t.badType, file.name))
      else if (fl.maxSize && file.size > fl.maxSize) notas.push(f(t.tooBig, file.name, peso(fl.maxSize)))
      else nuevos.push({ file, estado: 'listo', pct: 100 })
    }
    if (!multiple) nuevos = nuevos.slice(0, 1)
    let todos = multiple ? [...archivos, ...nuevos] : nuevos.length ? nuevos : archivos
    if (multiple && fl.maxFiles && todos.length > fl.maxFiles) {
      notas.push(f(t.tooMany, fl.maxFiles))
      todos = todos.slice(0, fl.maxFiles)
      nuevos = nuevos.filter((n) => todos.includes(n))
    }
    archivos = todos
    aviso.textContent = notas.join(' ')
    pintar()
    cambio(el)
    for (const a of nuevos) void subir(a)
  }

  oculto.addEventListener('change', (e) => {
    e.stopPropagation()
    agregar(oculto.files)
    oculto.value = ''
  })
  zona.addEventListener('dragover', (e) => {
    e.preventDefault()
    zona.classList.add('over')
  })
  zona.addEventListener('dragleave', () => zona.classList.remove('over'))
  zona.addEventListener('drop', (e) => {
    e.preventDefault()
    zona.classList.remove('over')
    if (!fl.disabled) agregar(e.dataTransfer?.files ?? null)
  })

  return {
    el,
    value: () => {
      const v = archivos.filter((a) => a.estado === 'listo').map((a) => (fl.upload ? a.resultado : a.file))
      return multiple ? v : (v[0] ?? null)
    },
    focus: () => boton.focus(),
    invalid: (on) => zona.classList.toggle('bad', on),
    validate: () =>
      archivos.some((a) => a.estado === 'subiendo') ? t.uploading : archivos.some((a) => a.estado === 'error') ? t.uploadFailed : null,
    summary: () => archivos.map((a) => a.file.name).join(', '),
  }
}

// ── daterange ───────────────────────────────────────────────────────────────

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const desdeIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const legible = (s: string) =>
  desdeIso(s).toLocaleDateString(language() === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

/** Atajos por omisión, calculados al momento de usarse. */
export function defaultDatePresets(): DatePreset[] {
  const t = T()
  const hoy = () => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  return [
    { label: t.today, range: () => [hoy(), hoy()] },
    {
      label: t.week,
      range: () => {
        const d = hoy()
        const lunes = new Date(d)
        lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7))
        const domingo = new Date(lunes)
        domingo.setDate(lunes.getDate() + 6)
        return [lunes, domingo]
      },
    },
    {
      label: t.fortnight,
      range: () => {
        const d = hoy()
        const y = d.getFullYear()
        const m = d.getMonth()
        return d.getDate() <= 15 ? [new Date(y, m, 1), new Date(y, m, 15)] : [new Date(y, m, 16), new Date(y, m + 1, 0)]
      },
    },
    {
      label: t.month,
      range: () => {
        const d = hoy()
        return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)]
      },
    },
    {
      label: t.lastMonth,
      range: () => {
        const d = hoy()
        return [new Date(d.getFullYear(), d.getMonth() - 1, 1), new Date(d.getFullYear(), d.getMonth(), 0)]
      },
    },
    {
      label: t.last30,
      range: () => {
        const d = hoy()
        const ini = new Date(d)
        ini.setDate(d.getDate() - 29)
        return [ini, d]
      },
    },
  ]
}

const rango: Fabrica = (ctx, valor) => {
  const t = T()
  const fl = ctx.field
  const v = (valor ?? {}) as { from?: string; to?: string }
  const idHasta = uid('dr')
  const min = fl.min !== undefined ? String(fl.min) : undefined
  const max = fl.max !== undefined ? String(fl.max) : undefined
  const comunes = { type: 'date', class: 'input', min, max, disabled: fl.disabled, 'aria-describedby': ctx.describedBy }
  const desde = h('input', { ...comunes, id: ctx.id, value: v.from ?? '' })
  const hasta = h('input', { ...comunes, id: idHasta, value: v.to ?? '' })
  const atajos = fl.presets === false ? [] : (fl.presets ?? defaultDatePresets())
  const chips = atajos.map((p) =>
    h(
      'button',
      {
        type: 'button',
        class: 'preset',
        'aria-pressed': 'false',
        disabled: fl.disabled,
        onclick: () => {
          const [a, b] = p.range()
          desde.value = iso(a)
          hasta.value = iso(b)
          marcar()
          cambio(el)
        },
      },
      p.label,
    ),
  )
  const marcar = () => {
    atajos.forEach((p, i) => {
      const [a, b] = p.range()
      chips[i].setAttribute('aria-pressed', String(desde.value === iso(a) && hasta.value === iso(b)))
    })
  }
  const el = h(
    'div',
    { class: 'dr' },
    chips.length ? h('div', { class: 'presets' }, ...chips) : null,
    h(
      'div',
      { class: 'dr-inputs' },
      h('div', { class: 'dr-col' }, h('label', { for: ctx.id }, t.from), desde),
      h('div', { class: 'dr-col' }, h('label', { for: idHasta }, t.to), hasta),
    ),
  )
  desde.addEventListener('change', marcar)
  hasta.addEventListener('change', marcar)
  marcar()
  return {
    el,
    group: true,
    value: () => (desde.value || hasta.value ? { from: desde.value, to: hasta.value } : null),
    focus: () => desde.focus(),
    invalid: (on) => {
      desde.setAttribute('aria-invalid', String(on))
      hasta.setAttribute('aria-invalid', String(on))
    },
    validate: () => {
      if (!desde.value && !hasta.value) return null
      if (!desde.value || !hasta.value) return t.bothDates
      if (hasta.value < desde.value) return t.order
      if ((min && desde.value < min) || (max && hasta.value > max))
        return f(t.outOfRange, min ? legible(min) : '…', max ? legible(max) : '…')
      if (fl.maxDays) {
        const dias = Math.round((desdeIso(hasta.value).getTime() - desdeIso(desde.value).getTime()) / 86_400_000) + 1
        if (dias > fl.maxDays) return f(t.maxDays, fl.maxDays)
      }
      return null
    },
    summary: () => `${legible(desde.value)} – ${legible(hasta.value)}`,
  }
}

// ── otp ─────────────────────────────────────────────────────────────────────

const otp: Fabrica = (ctx, valor) => {
  const t = T()
  const fl = ctx.field
  const n = fl.length ?? 6
  const cajas = Array.from({ length: n }, () => h('span', { class: 'otp-box' }))
  const input = h('input', {
    id: ctx.id,
    class: 'otp-input',
    inputmode: 'numeric',
    autocomplete: 'one-time-code',
    maxlength: n,
    pattern: `\\d{${n}}`,
    disabled: fl.disabled,
    'aria-describedby': ctx.describedBy,
    'aria-required': ctx.required ? 'true' : null,
    value: valor ? String(valor).replace(/\D/g, '').slice(0, n) : '',
  })
  const el = h('div', { class: 'otp' }, h('div', { class: 'otp-boxes', 'aria-hidden': 'true' }, ...cajas), input)
  const pintar = () => {
    const v = input.value
    const pos = Math.min(input.selectionStart ?? v.length, n - 1)
    const foco = input.isConnected && (input.getRootNode() as ShadowRoot | Document).activeElement === input
    cajas.forEach((c, i) => {
      c.textContent = v[i] ?? ''
      c.classList.toggle('active', foco && i === pos)
    })
  }
  input.addEventListener('input', () => {
    const limpio = input.value.replace(/\D/g, '').slice(0, n)
    if (limpio !== input.value) input.value = limpio
    pintar()
    if (limpio.length === n && fl.autoSubmit !== false) {
      cambio(el)
      // Completo: pulsa el botón principal (como al pegar el código del SMS).
      setTimeout(() => {
        const raiz = input.getRootNode() as ShadowRoot
        raiz.querySelector<HTMLButtonElement>('footer button[data-role=confirm]:not([disabled])')?.click()
      })
    }
  })
  for (const ev of ['focus', 'blur', 'keyup', 'click', 'select']) input.addEventListener(ev, pintar)
  pintar()
  return {
    el,
    value: () => input.value,
    focus: () => input.focus(),
    invalid: (on) => {
      input.setAttribute('aria-invalid', String(on))
      el.classList.toggle('bad', on)
    },
    validate: () => (!input.value || new RegExp(`^\\d{${n}}$`).test(input.value) ? null : f(t.otpLength, n)),
  }
}

// ── phone (teléfono con lada) ────────────────────────────────────────────────

/** Lada, nombre y dígitos del número nacional. */
export interface PhoneCountry {
  dial: string
  label: string
  digits?: number
}
export const DEFAULT_COUNTRIES: PhoneCountry[] = [
  { dial: '+52', label: 'México', digits: 10 },
  { dial: '+1', label: 'Estados Unidos y Canadá', digits: 10 },
  { dial: '+34', label: 'España', digits: 9 },
  { dial: '+57', label: 'Colombia', digits: 10 },
  { dial: '+54', label: 'Argentina', digits: 10 },
  { dial: '+56', label: 'Chile', digits: 9 },
  { dial: '+51', label: 'Perú', digits: 9 },
  { dial: '+502', label: 'Guatemala', digits: 8 },
]

/** 81 1234 5678 (CDMX, GDL y MTY: 2-4-4), 222 123 4567 (3-3-4), y de 3 en 3 para otros largos. */
export function formatPhone(digitos: string, dial = '+52'): string {
  const d = digitos.replace(/\D/g, '')
  const grupos =
    d.length > 6 && (dial === '+52' || dial === '+1')
      ? dial === '+52' && /^(55|56|33|81)/.test(d)
        ? [2, 4, 4]
        : [3, 3, 4]
      : [3, 3, 3, 3, 3]
  const partes: string[] = []
  let i = 0
  for (const g of grupos) {
    if (i >= d.length) break
    partes.push(d.slice(i, i + g))
    i += g
  }
  if (i < d.length) partes.push(d.slice(i))
  return partes.join(' ')
}

const telefono: Fabrica = (ctx, valor) => {
  const t = T()
  const fl = ctx.field
  const paises = fl.countries?.length ? fl.countries : DEFAULT_COUNTRIES
  // El valor llega como +528112345678: se busca la lada más larga que coincida.
  let inicial = String(valor ?? '').replace(/[^\d+]/g, '')
  let dial = fl.dialCode ?? paises[0].dial
  if (inicial.startsWith('+')) {
    const p = [...paises].sort((a, b) => b.dial.length - a.dial.length).find((x) => inicial.startsWith(x.dial))
    if (p) {
      dial = p.dial
      inicial = inicial.slice(p.dial.length)
    }
  }
  const pais = () => paises.find((p) => p.dial === lada.value) ?? paises[0]
  const lada = h(
    'select',
    { class: 'dial', 'data-skip-initial': '', 'aria-label': t.dialCode, disabled: fl.disabled, 'aria-describedby': ctx.describedBy },
    ...paises.map((p) => h('option', { value: p.dial, selected: p.dial === dial }, `${p.dial} ${p.label}`)),
  )
  lada.value = dial
  const input = h('input', {
    id: ctx.id,
    class: 'input',
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel-national',
    disabled: fl.disabled,
    placeholder: fl.placeholder ?? formatPhone('8112345678'.slice(0, pais().digits ?? 10), lada.value),
    'aria-describedby': ctx.describedBy,
    'aria-required': ctx.required ? 'true' : null,
  })
  const digitos = () => input.value.replace(/\D/g, '')
  const formatear = () => {
    // Conserva el cursor: cuenta cuántos dígitos había antes de él.
    const antes = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, '').length
    const max = pais().digits ?? 15
    const nuevo = formatPhone(digitos().slice(0, max), lada.value)
    if (nuevo === input.value) return
    input.value = nuevo
    let pos = 0
    for (let n = 0; pos < nuevo.length && n < antes; pos++) if (/\d/.test(nuevo[pos])) n++
    if ((input.getRootNode() as ShadowRoot | Document).activeElement === input) input.setSelectionRange(pos, pos)
  }
  input.value = formatPhone(inicial, dial)
  input.addEventListener('input', formatear)
  lada.addEventListener('change', () => {
    formatear()
    input.placeholder = fl.placeholder ?? formatPhone('8112345678'.slice(0, pais().digits ?? 10), lada.value)
  })
  const el = h('div', { class: 'affix phone' }, lada, input)
  return {
    el,
    value: () => (digitos() ? lada.value + digitos() : ''),
    focus: () => input.focus(),
    invalid: (on) => input.setAttribute('aria-invalid', String(on)),
    validate: () => {
      const n = pais().digits
      const d = digitos()
      return !d || (n ? d.length === n : d.length >= 6 && d.length <= 15) ? null : f(t.phoneDigits, n ?? '6–15')
    },
    summary: () => `${lada.value} ${input.value}`,
  }
}

// ── address (dirección por código postal) ────────────────────────────────────

export interface PostalLookup {
  state: string
  municipality: string
  /** Colonias de ese código postal. */
  neighborhoods: string[]
  city?: string
}
export interface Address {
  postalCode: string
  state: string
  municipality: string
  neighborhood: string
  street: string
}

const direccion: Fabrica = (ctx, valor) => {
  const t = T()
  const fl = ctx.field
  const v = (valor ?? {}) as Partial<Address>
  const parte = (nombre: keyof Address, etiqueta: string, extra: Record<string, unknown> = {}) => {
    const id = nombre === 'postalCode' ? ctx.id : uid('fa')
    const input = h('input', {
      id,
      class: 'input',
      name: `${fl.name}.${nombre}`,
      disabled: fl.disabled,
      'aria-describedby': ctx.describedBy,
      'aria-required': ctx.required ? 'true' : null,
      value: v[nombre] ?? '',
      ...extra,
    })
    return { input, el: h('div', { class: `ad-${nombre}` }, h('label', { for: id }, etiqueta), input) }
  }
  const cp = parte('postalCode', t.postalCode, { inputmode: 'numeric', autocomplete: 'postal-code', maxlength: 5 })
  const estado = parte('state', t.state, { autocomplete: 'address-level1' })
  const municipio = parte('municipality', t.municipality, { autocomplete: 'address-level2' })
  const colonia = parte('neighborhood', t.neighborhood, { autocomplete: 'address-level3' })
  const calle = parte('street', t.street, { autocomplete: 'street-address' })
  // Con varias colonias, un <select> en lugar del texto (mismo id, así la etiqueta sigue apuntando bien).
  const lista = h('select', { id: colonia.input.id, class: 'input', disabled: fl.disabled, 'aria-describedby': ctx.describedBy })
  const aviso = h('p', { class: 'ad-note', role: 'status' })
  let consulta = 0
  const usarLista = (colonias: string[]) => {
    if (colonias.length > 1) {
      lista.replaceChildren(h('option', { value: '' }, t.chooseNeighborhood), ...colonias.map((c) => h('option', { value: c }, c)))
      lista.value = colonias.includes(colonia.input.value) ? colonia.input.value : ''
      colonia.input.replaceWith(lista)
    } else {
      if (lista.isConnected) lista.replaceWith(colonia.input)
      colonia.input.value = colonias[0] ?? colonia.input.value
    }
  }
  const buscar = async () => {
    const codigo = cp.input.value
    if (!fl.lookupPostalCode || !/^\d{5}$/.test(codigo)) return
    const n = ++consulta
    aviso.textContent = t.searching
    el.setAttribute('aria-busy', 'true')
    let r: PostalLookup | null = null
    try {
      r = await fl.lookupPostalCode(codigo)
    } catch {}
    if (n !== consulta) return
    el.removeAttribute('aria-busy')
    aviso.textContent = r ? '' : t.postalNotFound
    if (r) {
      estado.input.value = r.state
      municipio.input.value = r.municipality
      usarLista(r.neighborhoods)
      if (r.neighborhoods.length > 1) lista.focus()
      else calle.input.focus()
    } else usarLista([])
    cambio(el)
  }
  cp.input.addEventListener('input', () => {
    const limpio = cp.input.value.replace(/\D/g, '').slice(0, 5)
    if (limpio !== cp.input.value) cp.input.value = limpio
    if (limpio.length === 5) void buscar()
  })
  const el = h('div', { class: 'addr' }, cp.el, estado.el, municipio.el, colonia.el, calle.el, aviso)
  const coloniaValor = () => (lista.isConnected ? lista.value : colonia.input.value.trim())
  const valores = (): Address => ({
    postalCode: cp.input.value.trim(),
    state: estado.input.value.trim(),
    municipality: municipio.input.value.trim(),
    neighborhood: coloniaValor(),
    street: calle.input.value.trim(),
  })
  const partes: [keyof Address, string][] = [
    ['postalCode', t.postalCode],
    ['state', t.state],
    ['municipality', t.municipality],
    ['neighborhood', t.neighborhood],
    ['street', t.street],
  ]
  const campo = (k: keyof Address) =>
    k === 'neighborhood' && lista.isConnected
      ? lista
      : { postalCode: cp, state: estado, municipality: municipio, neighborhood: colonia, street: calle }[k].input
  let faltan: (keyof Address)[] = []
  return {
    el,
    group: true,
    lazy: true,
    value: () => {
      const a = valores()
      return Object.values(a).some(Boolean) ? a : null
    },
    focus: () => (faltan.length ? campo(faltan[0]).focus() : cp.input.focus()),
    invalid: (on) => {
      for (const [k] of partes) campo(k).setAttribute('aria-invalid', String(on && faltan.includes(k)))
    },
    validate: () => {
      const a = valores()
      faltan = []
      if (!Object.values(a).some(Boolean)) return null
      if (a.postalCode && !/^\d{5}$/.test(a.postalCode)) {
        faltan = ['postalCode']
        return f(t.missing, t.postalCode)
      }
      faltan = partes.filter(([k]) => !a[k]).map(([k]) => k)
      return faltan.length
        ? f(
            t.missing,
            partes
              .filter(([k]) => faltan.includes(k))
              .map(([, l]) => l.toLowerCase())
              .join(', '),
          )
        : null
    },
    summary: () => {
      const a = valores()
      return [a.street, a.neighborhood, a.municipality, a.state, a.postalCode && `CP ${a.postalCode}`].filter(Boolean).join(', ')
    },
  }
}

// ── items (filas repetibles) ────────────────────────────────────────────────

const items: Fabrica = (ctx, valor) => {
  const t = T()
  const fl = ctx.field
  const columnas = fl.fields ?? []
  const minimo = fl.minRows ?? (ctx.required ? 1 : 0)
  const filas: { fs: NestedFieldSet; el: HTMLElement; quitar: HTMLButtonElement }[] = []
  const cuerpo = h('div', { class: 'rows' })
  const totales = h('dl', { class: 'totals', 'aria-live': 'polite' })
  // Encabezado visual con la misma rejilla que las filas (el lector de pantalla usa las etiquetas de cada campo).
  const encabezado = h(
    'div',
    { class: 'row rows-head', 'aria-hidden': 'true' },
    css(h('div', { class: 'rh-cols' }, ...columnas.map((c) => h('span', null, c.label))), {
      'grid-template-columns': `repeat(${columnas.length},minmax(0,1fr))`,
    }),
    h('span', { class: 'btn btn-sm rh-x' }, t.remove),
  )
  const agregar = h(
    'button',
    { type: 'button', class: 'btn btn-secondary btn-sm', disabled: fl.disabled, onclick: () => nueva({}, true) },
    fl.addText ?? t.add,
  )
  const el = h(
    'div',
    { class: 'items' },
    h('div', { class: 'tbl' }, encabezado, cuerpo),
    h('div', { class: 'rows-foot' }, agregar, totales),
  )

  const actualizar = () => {
    filas.forEach((r, i) => {
      r.el.setAttribute('aria-label', f(t.row, i + 1))
      r.quitar.setAttribute('aria-label', f(t.removeRow, i + 1))
      r.quitar.disabled = !!fl.disabled || filas.length <= minimo
    })
    agregar.disabled = !!fl.disabled || (!!fl.maxRows && filas.length >= fl.maxRows)
    if (fl.totals) {
      let lista: { label: string; value: string }[] = []
      try {
        lista = fl.totals(filas.map((r) => r.fs.values()))
      } catch (e) {
        console.error(e)
      }
      totales.replaceChildren(...lista.flatMap((x) => [h('dt', null, x.label), h('dd', null, x.value)]))
    }
  }

  function nueva(valores: Record<string, unknown>, enfocar = false): void {
    const fs = ctx.nested(columnas, valores, () => actualizar())
    fs.el.classList.add('compact')
    fs.el.style.gridTemplateColumns = `repeat(${columnas.length},minmax(0,1fr))`
    const fila: (typeof filas)[number] = {
      fs,
      el: h('div', { class: 'row', role: 'group' }),
      quitar: h('button', { type: 'button', class: 'btn btn-cancel btn-sm' }, t.remove),
    }
    fila.quitar.addEventListener('click', () => {
      const i = filas.indexOf(fila)
      filas.splice(i, 1)
      fila.el.remove()
      actualizar()
      cambio(el)
      ;(filas[Math.min(i, filas.length - 1)]?.fs ?? null)?.focusFirst() ?? agregar.focus()
    })
    fila.el.append(fs.el, fila.quitar)
    cuerpo.appendChild(fila.el)
    filas.push(fila)
    actualizar()
    if (enfocar) {
      fs.focusFirst()
      cambio(el)
    }
  }

  const iniciales = Array.isArray(valor) ? (valor as Record<string, unknown>[]) : []
  for (const v of iniciales) nueva(v)
  while (filas.length < minimo) nueva({})
  actualizar()

  return {
    el,
    group: true,
    lazy: true,
    value: () => filas.map((r) => r.fs.values()),
    focus: () => (filas[0] ? filas[0].fs.focusFirst() : agregar.focus()),
    invalid: (on) => el.classList.toggle('bad', on),
    validate: async () => {
      if (filas.length < minimo) return f(t.minRows, minimo)
      let mal = 0
      for (const r of filas) if ((await r.fs.validate()).length) mal++
      return mal ? t.rowsInvalid : null
    },
    summary: () =>
      filas
        .map((r) =>
          r.fs
            .summary()
            .map((s) => s.value)
            .join(' · '),
        )
        .join('; '),
  }
}

export const CAMPOS: Record<string, Fabrica> = {
  combobox,
  file: archivo,
  daterange: rango,
  otp,
  items,
  phone: telefono,
  address: direccion,
}

export const FIELDS_CSS = `
.btn-sm{height:34px;padding:0 12px;font-size:13px}
.av{flex:none;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:600 12px var(--_font);object-fit:cover}
.av-sm{width:20px;height:20px;font-size:9px}
.t0{background:#e0e7ff;color:#3451d1}.t1{background:#fce7f6;color:#c11574}.t2{background:#d1fadf;color:#067647}.t3{background:#fef0c7;color:#b54708}
.t4{background:#e0f2fe;color:#026aa2}.t5{background:#ebe9fe;color:#5925dc}.t6{background:#ffe4e8;color:#c01048}
.cb-box{position:relative}
.cb-list{position:absolute;z-index:5;left:0;right:0;top:calc(100% + 6px);margin:0;padding:6px;list-style:none;max-height:260px;overflow:auto;
  background:var(--_bg);border:1px solid var(--_line);border-radius:12px;box-shadow:0 12px 24px -4px rgba(16,24,40,.12),0 4px 8px -2px rgba(16,24,40,.04)}
.cb-list[hidden]{display:none}
.cb-list.up{top:auto;bottom:calc(100% + 6px)}
.cb-opt{display:flex;gap:12px;align-items:center;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:14px;color:var(--_fg)}
.cb-opt.active{background:var(--_surface)}
.cb-opt[aria-selected=true] .cb-text>span{font-weight:600}
.cb-opt[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.cb-opt.create{color:var(--_accent);font-weight:600;border-top:1px solid var(--_line);border-radius:0 0 8px 8px;margin-top:4px}
.cb-text{display:flex;flex-direction:column;min-width:0;flex:1}
.cb-text small{color:var(--_subtle);font-size:13px;font-weight:400}
.cb-check{flex:none;width:18px;text-align:center;color:var(--_accent);font-weight:700}
.cb-group{padding:8px 10px 4px;font-size:12px;font-weight:600;color:var(--_subtle)}
.cb-note{padding:10px;color:var(--_subtle);font-size:14px}
.cb-chips{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.cb-chips[hidden]{display:none}
.cb-chips li{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 4px 0 8px;border-radius:8px;border:1px solid var(--_border);background:var(--_bg);font-size:14px;font-weight:500;color:var(--_label)}
.cb-chips li:has(.av){padding-left:4px}
.cb-x{width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:var(--_subtle);cursor:pointer;font-size:16px;line-height:1}
.cb-x:hover{background:var(--_surface)}
.cb-x:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
.drop{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px;border:1px dashed var(--_border);border-radius:12px;background:var(--_surface);color:var(--_muted);text-align:center;font-size:14px}
.drop-ico{width:40px;height:40px;border-radius:10px;border:1px solid var(--_line);background:var(--_bg);display:flex;align-items:center;justify-content:center;color:var(--_muted);box-shadow:var(--_xs)}
.drop-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center}
.drop small{font-size:12px;color:var(--_subtle)}
.drop.over{border-color:var(--_accent);background:color-mix(in srgb,var(--_accent) 6%,var(--_bg))}
.drop.bad{border-color:color-mix(in srgb,var(--_error) 55%,var(--_bg))}
.file-note{margin:8px 0 0;font-size:13px;color:var(--_error)}
.file-note:empty{display:none}
.files{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}
.files li{display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--_line);border-radius:12px}
.files li.error{border-color:color-mix(in srgb,var(--_error) 30%,var(--_bg));background:color-mix(in srgb,var(--_error) 3%,var(--_bg))}
.files li.error small{color:var(--_error)}
.ftype{flex:none;width:36px;height:40px;border-radius:6px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px;font:700 9px var(--_font);letter-spacing:.02em;color:#fff;background:#475467}
.ft-pdf{background:#d92d20}.ft-data{background:#067647}.ft-doc{background:#155eef}.ft-img{background:#6938ef}
.f-info{flex:1;min-width:0;display:flex;flex-direction:column}
.f-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;color:var(--_fg)}
.f-info small{color:var(--_subtle);font-size:13px}
.f-info .bar{height:8px;border-radius:4px;background:var(--_line);margin-top:8px;overflow:hidden}
.f-info .bar div{height:100%;background:var(--_accent);border-radius:4px;transition:width .2s}
.presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.preset{height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--_border);background:var(--_bg);color:var(--_label);font:500 13px var(--_font);cursor:pointer;box-shadow:var(--_xs)}
.preset:hover{background:var(--_surface)}
.preset[aria-pressed=true]{background:var(--_accent);border-color:var(--_accent);color:var(--_accent-fg);font-weight:600}
.preset:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
.dr-inputs{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dr-col{display:flex;flex-direction:column;gap:4px}
.dr-col label{font-size:13px;color:var(--_subtle)}
.otp{position:relative;display:inline-block}
.otp-boxes{display:flex;gap:8px}
.otp-box{width:48px;height:56px;border:1px solid var(--_border);border-radius:12px;display:flex;align-items:center;justify-content:center;
  font:600 26px ui-monospace,Menlo,monospace;background:var(--_bg);box-shadow:var(--_xs);color:var(--_fg)}
.otp-box.active{border-color:color-mix(in srgb,var(--_accent) 55%,var(--_bg));box-shadow:var(--_xs),0 0 0 4px var(--_focus)}
.otp.bad .otp-box{border-color:color-mix(in srgb,var(--_error) 55%,var(--_bg))}
.otp-input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;font-size:16px;caret-color:transparent}
.tbl{border:1px solid var(--_line);border-radius:12px;overflow:visible}
.rows-head{padding:10px 14px;background:var(--_surface);border-radius:11px 11px 0 0;font-size:12px;font-weight:600;color:var(--_subtle)}
.rh-cols{display:grid;gap:12px}
.rows-head .rh-x{visibility:hidden;height:0;overflow:hidden;padding-top:0;padding-bottom:0;border:0}
.rows{display:grid}
.row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start}
.rows>.row{padding:10px 14px;border-top:1px solid var(--_line)}
.compact{gap:12px}
.compact>.field>label,.compact>fieldset>legend{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.compact>.field{position:relative}
.row>.btn{margin-top:3px}
.rows-foot{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-top:14px}
.totals{margin:0;display:grid;grid-template-columns:auto minmax(110px,auto);gap:6px 24px;font-size:14px;font-variant-numeric:tabular-nums}
.totals dt{color:var(--_subtle);text-align:right}
.totals dd{margin:0;text-align:right;font-weight:500;color:var(--_fg)}
.totals dt:last-of-type,.totals dd:last-of-type{font-size:18px;color:var(--_fg);font-weight:700;padding-top:2px}
.narrow .rows-head{display:none}
.narrow .tbl{border:0}
.narrow .rows{gap:10px}
.narrow .rows>.row{border:1px solid var(--_line);border-radius:12px;padding:12px}
.narrow .compact{grid-template-columns:1fr!important}
.narrow .compact>.field>label{position:static;width:auto;height:auto;clip-path:none}
.narrow .dr-inputs{grid-template-columns:1fr}
.phone .dial{flex:none;width:auto;max-width:156px;height:auto;border:0;border-right:1px solid var(--_line);border-radius:0;background:var(--_surface);
  padding:0 8px 0 12px;font:500 14px var(--_font);color:var(--_label);cursor:pointer;text-overflow:ellipsis}
.phone .dial:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--_accent)}
.affix.phone{padding:0 14px 0 0;overflow:hidden;align-items:stretch}
.phone .input{text-align:left;letter-spacing:.02em;flex:1;min-width:0}
.addr{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.addr>div{display:flex;flex-direction:column;gap:6px;min-width:0}
.addr label{font-size:13px;color:var(--_subtle)}
.addr .ad-street,.addr .ad-note{grid-column:1/-1}
.ad-note{margin:0;font-size:13px;color:var(--_subtle)}
.ad-note:empty{display:none}
.narrow .addr{grid-template-columns:1fr}
`
