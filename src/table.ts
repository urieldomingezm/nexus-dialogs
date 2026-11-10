/**
 * Tabla con selección dentro de un diálogo: elegir empleados (o lo que sea) de una lista grande.
 *
 * ```ts
 * import { pickRows } from 'nexus-dialogs/table'
 *
 * const r = await pickRows({
 *   title: 'Agregar participantes',
 *   rows: empleados,
 *   rowKey: 'numero',
 *   columns: [
 *     { key: 'numero', label: 'Núm.' },
 *     { key: 'nombre', label: 'Nombre' },
 *     { key: 'area', label: 'Área' },
 *   ],
 * })
 * if (r.confirmed) agregar(r.value) // filas elegidas
 * ```
 * Con `load` la búsqueda y las páginas vienen de tu API. La selección se conserva al buscar y al cambiar de página.
 */
import { INVALID, language, openDialog } from 'nexus-dialogs'
import type { DialogContext, DialogOptions, DialogResult } from 'nexus-dialogs'
import { h, uid } from './core/dom'

const ES = {
  title: 'Elegir',
  search: 'Buscar',
  choose: 'Elegir',
  chooseN: 'Elegir {0}',
  selectPage: 'Seleccionar todos los de esta página',
  select: 'Seleccionar {0}',
  selected: '{0} seleccionados',
  selected1: '1 seleccionado',
  clear: 'Quitar selección',
  range: '{0}–{1} de {2}',
  prev: 'Página anterior',
  next: 'Página siguiente',
  loading: 'Cargando…',
  noResults: 'Sin resultados',
  loadError: 'No se pudo cargar la lista.',
  min: 'Elige al menos {0}.',
  max: 'Puedes elegir hasta {0}.',
  cancel: 'Cancelar',
}
type Textos = typeof ES
const EN: Textos = {
  title: 'Choose',
  search: 'Search',
  choose: 'Choose',
  chooseN: 'Choose {0}',
  selectPage: 'Select all on this page',
  select: 'Select {0}',
  selected: '{0} selected',
  selected1: '1 selected',
  clear: 'Clear selection',
  range: '{0}–{1} of {2}',
  prev: 'Previous page',
  next: 'Next page',
  loading: 'Loading…',
  noResults: 'No results',
  loadError: 'The list could not be loaded.',
  min: 'Choose at least {0}.',
  max: 'You can choose up to {0}.',
  cancel: 'Cancel',
}
const T = (): Textos => (language() === 'en' ? EN : ES)
const f = (s: string, ...v: (string | number)[]) => s.replace(/\{(\d)\}/g, (_, i) => String(v[+i] ?? ''))
const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export interface TableColumn<R> {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  /** Texto de la celda. Por omisión, el valor tal cual. */
  format?: (value: any, row: R) => string
}

export interface TablePage<R> {
  rows: R[]
  total: number
}

export interface PickRowsOptions<R> extends Omit<DialogOptions<R[]>, 'render' | 'buttons' | 'collect'> {
  columns: TableColumn<R>[]
  /** Todas las filas (búsqueda y páginas aquí mismo). */
  rows?: R[]
  /** O páginas desde tu API. */
  load?: (q: { search: string; page: number; pageSize: number }) => Promise<TablePage<R>> | TablePage<R>
  /** Clave única de cada fila: nombre de la propiedad o función. Por omisión 'id'. */
  rowKey?: string | ((row: R) => string)
  /** Por omisión true. Con false se elige una sola fila. */
  multiple?: boolean
  /** Claves ya elegidas al abrir. */
  selected?: string[]
  /** Filas que no se pueden elegir (ya asignadas, dadas de baja…). */
  isDisabled?: (row: R) => boolean
  /** Por omisión 25. */
  pageSize?: number
  min?: number
  max?: number
  searchPlaceholder?: string
}

const ESTILOS = `
.pick-top{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.pick-top .input{flex:1}
.pick-count{font-size:13px;color:var(--_subtle);white-space:nowrap}
.tbl-wrap{border:1px solid var(--_line);border-radius:12px;overflow:auto;max-height:min(52vh,460px)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{position:sticky;top:0;z-index:1;background:var(--_surface);color:var(--_subtle);font-size:12px;font-weight:600;text-align:left;padding:10px 12px;border-bottom:1px solid var(--_line)}
td{padding:10px 12px;border-top:1px solid var(--_line);color:var(--_fg)}
tbody tr:first-child td{border-top:0}
tbody tr{cursor:pointer}
tbody tr:hover td{background:var(--_surface)}
tbody tr.sel td{background:color-mix(in srgb,var(--_accent) 7%,var(--_bg))}
tbody tr.off{cursor:not-allowed;color:var(--_subtle)}
tbody tr.off td{color:var(--_subtle)}
.c-check{width:44px;padding-right:0}
.c-check input{width:18px;height:18px;margin:0;accent-color:var(--_accent);cursor:pointer;vertical-align:middle}
.a-right{text-align:right;font-variant-numeric:tabular-nums}.a-center{text-align:center}
.empty td{text-align:center;color:var(--_subtle);padding:28px 12px;cursor:default}
.pick-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;font-size:13px;color:var(--_subtle)}
.pager{display:flex;align-items:center;gap:4px}
.pg{width:34px;height:34px;border:1px solid var(--_border);border-radius:8px;background:var(--_bg);color:var(--_label);cursor:pointer;font-size:16px;line-height:1}
.pg:disabled{opacity:.4;cursor:not-allowed}
.pg:focus-visible,.link:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
.link{border:0;background:transparent;color:var(--_accent);font:600 13px var(--_font);cursor:pointer;padding:6px 8px;border-radius:8px}
.link[hidden]{display:none}
.narrow .pick-top{flex-direction:column;align-items:stretch}
.narrow .tbl-wrap{max-height:none}
.narrow .pick-top .input{flex:none}
.narrow td,.narrow th{white-space:nowrap}
`

/** Diálogo con tabla, búsqueda, páginas y selección. Resuelve con las filas elegidas (en el orden en que se eligieron). */
export function pickRows<R = Record<string, unknown>>(o: PickRowsOptions<R>): Promise<DialogResult<R[]>> {
  const t = T()
  const multiple = o.multiple !== false
  const tam = o.pageSize ?? 25
  const clave = (r: R) => (typeof o.rowKey === 'function' ? o.rowKey(r) : String((r as any)[o.rowKey ?? 'id']))
  const elegidas = new Map<string, R>()
  const pendientes = new Set(o.selected ?? [])
  let pagina = 0
  let total = 0
  let visibles: R[] = []
  let busqueda = ''
  let pedido = 0
  let ctxRef: DialogContext

  const idBusca = uid('pk')
  const buscador = h('input', {
    id: idBusca,
    class: 'input',
    type: 'search',
    placeholder: o.searchPlaceholder ?? t.search,
    'aria-label': o.searchPlaceholder ?? t.search,
    autocomplete: 'off',
  })
  const cuenta = h('span', { class: 'pick-count', role: 'status' })
  const todas = h('input', { type: 'checkbox', 'aria-label': t.selectPage })
  const cuerpo = h('tbody')
  const rango = h('span', { 'aria-live': 'polite' })
  const anterior = h('button', { type: 'button', class: 'pg', 'aria-label': t.prev }, '‹')
  const siguiente = h('button', { type: 'button', class: 'pg', 'aria-label': t.next }, '›')
  const limpiar = h('button', { type: 'button', class: 'link', hidden: true }, t.clear)
  const nombreFila = (r: R) => String((r as any)[o.columns[0]?.key] ?? clave(r))
  const apagada = (r: R) => !!o.isDisabled?.(r)

  const celda = (c: TableColumn<R>, r: R) => {
    const v = (r as any)[c.key]
    return h('td', { class: c.align && c.align !== 'left' ? `a-${c.align}` : null }, c.format ? c.format(v, r) : v === null || v === undefined ? '' : String(v))
  }

  const actualizarCuenta = () => {
    const n = elegidas.size
    cuenta.textContent = multiple && n ? (n === 1 ? t.selected1 : f(t.selected, n.toLocaleString())) : ''
    limpiar.hidden = !n || !multiple
    const libres = visibles.filter((r) => !apagada(r))
    const marcadas = libres.filter((r) => elegidas.has(clave(r))).length
    todas.checked = !!libres.length && marcadas === libres.length
    todas.indeterminate = marcadas > 0 && marcadas < libres.length
    todas.disabled = !libres.length
    const b = ctxRef?.button('confirm')
    if (b) b.textContent = multiple && n ? f(t.chooseN, n.toLocaleString()) : (o.confirmText ?? t.choose)
  }

  const alternar = (r: R, si?: boolean) => {
    if (apagada(r)) return
    const k = clave(r)
    const marcar = si ?? !elegidas.has(k)
    if (!multiple) elegidas.clear()
    if (marcar) elegidas.set(k, r)
    else elegidas.delete(k)
  }

  const dibujar = () => {
    const filas = visibles.map((r) => {
      const k = clave(r)
      const sel = elegidas.has(k)
      const caja = h('input', {
        type: multiple ? 'checkbox' : 'radio',
        name: multiple ? null : idBusca,
        checked: sel,
        disabled: apagada(r),
        'aria-label': f(t.select, nombreFila(r)),
      })
      caja.addEventListener('change', () => {
        alternar(r, caja.checked)
        dibujar()
        cuerpo.querySelector<HTMLInputElement>(`tr[data-k="${CSS.escape(k)}"] input`)?.focus()
      })
      const tr = h(
        'tr',
        { 'data-k': k, class: [sel ? 'sel' : '', apagada(r) ? 'off' : ''].filter(Boolean).join(' ') || null },
        h('td', { class: 'c-check' }, caja),
        ...o.columns.map((c) => celda(c, r)),
      )
      // Clic en cualquier parte de la fila (no solo en la casilla).
      tr.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('input,a,button')) return
        caja.click()
      })
      return tr
    })
    cuerpo.replaceChildren(
      ...(filas.length
        ? filas
        : [h('tr', { class: 'empty' }, h('td', { colspan: String(o.columns.length + 1) }, total < 0 ? t.loadError : t.noResults))]),
    )
    const ini = total > 0 ? pagina * tam + 1 : 0
    rango.textContent =
      total > 0 ? f(t.range, ini.toLocaleString(), Math.min(total, ini + visibles.length - 1).toLocaleString(), total.toLocaleString()) : ''
    anterior.disabled = pagina === 0
    siguiente.disabled = (pagina + 1) * tam >= total
    actualizarCuenta()
  }

  const cargar = async () => {
    const n = ++pedido
    if (o.load) {
      cuerpo.setAttribute('aria-busy', 'true')
      rango.textContent = t.loading
      try {
        const p = await o.load({ search: busqueda, page: pagina, pageSize: tam })
        if (n !== pedido) return
        visibles = p.rows
        total = p.total
      } catch {
        if (n !== pedido) return
        visibles = []
        total = -1
      }
      cuerpo.removeAttribute('aria-busy')
    } else {
      const q = plano(busqueda.trim())
      const todasFilas = o.rows ?? []
      const halladas = q
        ? todasFilas.filter((r) =>
            o.columns.some((c) => {
              const v = (r as any)[c.key]
              return plano(c.format ? c.format(v, r) : String(v ?? '')).includes(q)
            }),
          )
        : todasFilas
      total = halladas.length
      visibles = halladas.slice(pagina * tam, pagina * tam + tam)
    }
    // Las claves preseleccionadas se vuelven filas cuando aparecen.
    for (const r of visibles) if (pendientes.delete(clave(r))) elegidas.set(clave(r), r)
    dibujar()
  }
  if (!o.load) for (const r of o.rows ?? []) if (pendientes.delete(clave(r))) elegidas.set(clave(r), r)

  let espera: ReturnType<typeof setTimeout> | undefined
  buscador.addEventListener('input', () => {
    clearTimeout(espera)
    espera = setTimeout(
      () => {
        busqueda = buscador.value
        pagina = 0
        void cargar()
      },
      o.load ? 300 : 120,
    )
  })
  // Enter en el buscador no envía el diálogo.
  buscador.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault()
  })
  todas.addEventListener('change', () => {
    for (const r of visibles) alternar(r, todas.checked)
    dibujar()
  })
  anterior.addEventListener('click', () => {
    pagina--
    void cargar()
  })
  siguiente.addEventListener('click', () => {
    pagina++
    void cargar()
  })
  limpiar.addEventListener('click', () => {
    elegidas.clear()
    dibujar()
  })

  return openDialog<R[]>({
    role: 'dialog',
    size: 'lg',
    title: o.title ?? t.title,
    initialFocus: `#${idBusca}`,
    ...o,
    moduleCss: ESTILOS,
    confirmText: o.confirmText ?? t.choose,
    cancelText: o.cancelText ?? t.cancel,
    render: (ctx) => {
      ctxRef = ctx
      void cargar()
      return h(
        'div',
        null,
        h('div', { class: 'pick-top' }, buscador, cuenta),
        h(
          'div',
          { class: 'tbl-wrap' },
          h(
            'table',
            null,
            h(
              'thead',
              null,
              h(
                'tr',
                null,
                h('th', { class: 'c-check', scope: 'col' }, multiple ? todas : null),
                ...o.columns.map((c) => h('th', { scope: 'col', class: c.align && c.align !== 'left' ? `a-${c.align}` : null }, c.label)),
              ),
            ),
            cuerpo,
          ),
        ),
        h('div', { class: 'pick-foot' }, h('div', null, limpiar), h('div', { class: 'pager' }, rango, anterior, siguiente)),
      )
    },
    onOpen: (ctx) => {
      actualizarCuenta()
      o.onOpen?.(ctx)
    },
    collect: async () => {
      const n = elegidas.size
      const min = o.min ?? 1
      if (n < min) {
        ctxRef.setError(f(t.min, min))
        return INVALID
      }
      if (o.max && n > o.max) {
        ctxRef.setError(f(t.max, o.max))
        return INVALID
      }
      ctxRef.setError(null)
      return [...elegidas.values()]
    },
  })
}
