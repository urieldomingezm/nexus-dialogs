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
   * por aquí porque siempre se insertan como texto. Sin filtro, el HTML se inserta tal cual: solo pásale contenido tuyo.
   */
  sanitize?: (html: string) => string
}

const estado: Required<Omit<GlobalConfig, 'labels'>> & { labels: Labels } = {
  lang: 'es',
  labels: { ...es },
  theme: {},
  scheme: 'light',
  dir: 'auto',
  defaults: {},
  sheetOnMobile: true,
  sanitize: (h) => h,
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
  if (c.sanitize) estado.sanitize = c.sanitize
}

/** Único punto por donde entra HTML en cadena: aplica `sanitize` si se configuró. */
export const setHtml = (el: Element, html: string): void => {
  el.innerHTML = estado.sanitize(html)
}

export const config = (): Readonly<typeof estado> => estado
export const labels = (): Labels => estado.labels
/** Idioma configurado ('es' o 'en'). */
export const language = (): 'es' | 'en' => estado.lang
