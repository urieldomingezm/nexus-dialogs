import { setNonce } from './core/sheet'
import { en, es } from './i18n'
import type { DialogOptions, Labels, Scheme } from './types'

export interface GlobalConfig {
  /** Idioma de los textos de la librería. Por omisión 'es'. */
  lang?: 'es' | 'en'
  /** Reemplaza textos sueltos (por ejemplo `{ cancel: 'Cerrar' }`). */
  labels?: Partial<Labels>
  /** Variables `--nd-*` para todos los diálogos (también puedes ponerlas en :root). */
  theme?: Record<string, string>
  /** Esquema de color. 'auto' sigue al sistema. Por omisión 'light'. */
  scheme?: Scheme
  /** Dirección del texto. 'auto' (por omisión) sigue a la de la página (`<html dir="rtl">`). */
  dir?: 'ltr' | 'rtl' | 'auto'
  /** Valores por omisión para todos los diálogos. */
  defaults?: Partial<DialogOptions<any>>
  /** En pantallas angostas, los diálogos centrados se vuelven hoja inferior. Por omisión true. */
  sheetOnMobile?: boolean
  /**
   * Filtro para todo `html` en cadena (`html`, `iconHtml`, `closeButtonHtml`, `loaderHtml` de swal). Recibe la cadena y devuelve la
   * versión segura; con DOMPurify: `sanitize: (s) => DOMPurify.sanitize(s)`. Los textos (`title`, `text`, etiquetas) nunca pasan
   * por aquí porque siempre se insertan como texto. Sin filtro, el HTML se inserta tal cual: solo pásale contenido tuyo. `null` quita el filtro.
   */
  sanitize?: ((html: string) => string | { toString(): string }) | null
  /**
   * Con `true`, el `html` en cadena que no pase por un `sanitize` configurado se muestra como texto en vez de interpretarse.
   * Es la opción recomendada si no controlas todo el contenido; en la 1.0 será el comportamiento por omisión.
   */
  strictHtml?: boolean
  /** Nonce de tu Content-Security-Policy para el `<style>` alternativo de navegadores sin hojas construibles. */
  nonce?: string
}

const estado: Required<Omit<GlobalConfig, 'labels' | 'sanitize'>> & { labels: Labels; sanitize: GlobalConfig['sanitize'] | null } = {
  lang: 'es',
  labels: { ...es },
  theme: {},
  scheme: 'light',
  dir: 'auto',
  defaults: {},
  sheetOnMobile: true,
  sanitize: null,
  strictHtml: false,
  nonce: '',
}

/** Configuración global. Se puede llamar varias veces; cada llamada mezcla con lo anterior. */
export function configure(c: GlobalConfig): void {
  if (c.lang) {
    estado.lang = c.lang
    estado.labels = { ...(c.lang === 'en' ? en : es) }
  }
  if (c.labels) Object.assign(estado.labels, c.labels)
  if (c.theme) estado.theme = { ...estado.theme, ...c.theme }
  if (c.scheme) estado.scheme = c.scheme
  if (c.dir) estado.dir = c.dir
  if (c.defaults) estado.defaults = { ...estado.defaults, ...c.defaults }
  if (c.sheetOnMobile !== undefined) estado.sheetOnMobile = c.sheetOnMobile
  if (c.sanitize !== undefined) estado.sanitize = c.sanitize
  if (c.strictHtml !== undefined) estado.strictHtml = c.strictHtml
  if (c.nonce !== undefined) setNonce((estado.nonce = c.nonce))
}

/**
 * Único punto por donde entra HTML en cadena. Con `sanitize` se inserta lo que devuelva (puede ser un `TrustedHTML`); sin él, tal cual,
 * salvo con `strictHtml`, que lo muestra como texto.
 */
export const setHtml = (el: Element, html: string): void => {
  if (estado.sanitize) el.innerHTML = estado.sanitize(html) as string
  else if (estado.strictHtml) el.textContent = html
  else el.innerHTML = html
}

export const config = (): Readonly<typeof estado> => estado
export const labels = (): Labels => estado.labels
/** Idioma configurado ('es' o 'en'). */
export const language = (): 'es' | 'en' => estado.lang
