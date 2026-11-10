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
  /** Valores por omisión para todos los diálogos. */
  defaults?: Partial<DialogOptions<any>>
  /** En pantallas angostas, los diálogos centrados se vuelven hoja inferior. Por omisión true. */
  sheetOnMobile?: boolean
}

const estado: Required<Omit<GlobalConfig, 'labels'>> & { labels: Labels } = {
  lang: 'es',
  labels: { ...es },
  theme: {},
  scheme: 'light',
  defaults: {},
  sheetOnMobile: true,
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
  if (c.defaults) estado.defaults = { ...estado.defaults, ...c.defaults }
  if (c.sheetOnMobile !== undefined) estado.sheetOnMobile = c.sheetOnMobile
}

export const config = (): Readonly<typeof estado> => estado
export const labels = (): Labels => estado.labels
