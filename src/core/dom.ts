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

/** SVG desde una cadena controlada por la librería (iconos), nunca desde datos del usuario. */
export function svg(markup: string): SVGElement {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstChild as SVGElement
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
