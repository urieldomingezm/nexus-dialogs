type Child = Node | string | number | null | undefined | false
type Attrs = Record<string, unknown> | null | undefined

/** Crea un elemento. Atributos `on*` con función se vuelven listeners; true/false en booleanos; `value`, `checked` como propiedad. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener)
      else if (k === 'value' || k === 'checked' || k === 'selected') (el as any)[k] = v
      else el.setAttribute(k, v === true ? '' : String(v))
    }
  }
  append(el, children)
  return el
}

export function append(el: Node, children: Child[]): void {
  for (const c of children)
    if (c !== null && c !== undefined && c !== false) el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)))
}

let n = 0
/** Id único dentro de la página (las raíces de shadow tienen su propio espacio de ids, pero así se evita cualquier choque). */
export const uid = (p = 'nd'): string => `${p}-${(++n).toString(36)}`

/**
 * SVG desde una cadena controlada por la librería (iconos), nunca desde datos del usuario. Se arma con `createElementNS` en vez de
 * `innerHTML`, así funciona con Trusted Types sin tener que crear ninguna política. Solo entiende etiquetas con atributos entre comillas dobles.
 */
export function svg(markup: string): SVGElement {
  let raiz!: SVGElement
  const pila: SVGElement[] = []
  for (const m of markup.matchAll(/<(\/?)([a-z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g)) {
    if (m[1]) {
      pila.pop()
      continue
    }
    const el = document.createElementNS('http://www.w3.org/2000/svg', m[2]) as SVGElement
    for (const a of m[3].matchAll(/([\w:-]+)="([^"]*)"/g)) el.setAttribute(a[1], a[2])
    if (pila.length) pila[pila.length - 1].appendChild(el)
    else raiz = el
    if (!m[4]) pila.push(el)
  }
  return raiz
}

/** Elemento con foco real, atravesando shadow roots. */
export function activeDeep(): HTMLElement | null {
  let a = document.activeElement as HTMLElement | null
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement as HTMLElement
  return a
}

export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const FOCUSABLE =
  'input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])'
export const focusables = (root: ParentNode): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => !e.closest('[hidden]'))

/** Pantalla angosta (celular). Se evalúa en JS porque WebKit puede no reevaluar @media de hojas adoptadas al cambiar el tamaño. */
export function angosto(el: Element, clase = 'narrow'): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const mq = matchMedia('(max-width: 560px)')
  const aplicar = () => el.classList.toggle(clase, mq.matches)
  aplicar()
  mq.addEventListener?.('change', aplicar)
  return () => mq.removeEventListener?.('change', aplicar)
}

/** Estilos por CSSOM (permitido con CSP estricta, a diferencia del atributo `style`). */
export function css<T extends HTMLElement>(el: T, props: Record<string, string>): T {
  for (const [k, v] of Object.entries(props)) el.style.setProperty(k, v)
  return el
}

/** Dirección efectiva del texto: la pedida o, si es 'auto', la que tenga la página (`dir` en <html> o <body>, o `direction` en CSS). */
export function direccion(pedida: 'ltr' | 'rtl' | 'auto' | undefined): 'ltr' | 'rtl' {
  if (pedida === 'ltr' || pedida === 'rtl') return pedida
  if (typeof document === 'undefined') return 'ltr'
  const atributo = document.body?.closest('[dir]')?.getAttribute('dir')
  if (atributo === 'rtl' || atributo === 'ltr') return atributo
  return getComputedStyle(document.documentElement).direction === 'rtl' ? 'rtl' : 'ltr'
}

/** ¿El elemento (dentro del Shadow DOM de un diálogo) se lee de derecha a izquierda? */
export function esRtl(el: Element): boolean {
  const raiz = el.getRootNode()
  const host = raiz instanceof ShadowRoot ? raiz.host : null
  const d = host?.getAttribute('dir')
  return d ? d === 'rtl' : getComputedStyle(el).direction === 'rtl'
}
