/**
 * Temas: conjuntos de variables `--nd-*`. Se aplican con `configure({ theme })`, `toast.configure({ theme })`
 * o en :root con `applyTheme()`, y se heredan dentro del Shadow DOM.
 *
 * ```ts
 * import { configure } from 'nexus-dialogs'
 * import { themes, fromBootstrap } from 'nexus-dialogs/themes'
 * configure({ theme: themes.bootstrap })     // colores fijos de Bootstrap 5
 * configure({ theme: fromBootstrap() })      // o los que tu página ya tiene en --bs-*
 * ```
 */
export type Theme = Record<string, string>

export const themes = {
  /** El de siempre: azul, esquinas redondeadas. */
  light: {} as Theme,
  /** Oscuro para cualquier página (o usa scheme: 'dark' / 'auto' en configure). */
  dark: {
    '--nd-bg': '#1d1f2c',
    '--nd-fg': '#eceef6',
    '--nd-muted': '#b4b8cc',
    '--nd-border': '#454a63',
    '--nd-surface': '#252838',
    '--nd-line': '#33374b',
    '--nd-accent': '#8ea4ff',
    '--nd-accent-contrast': '#12142a',
    '--nd-cancel-fg': '#ff8a80',
    '--nd-cancel-border': '#8c3a36',
    '--nd-danger': '#d92d20',
    '--nd-error': '#ff8a80',
    '--nd-overlay': 'rgba(0,0,0,.6)',
  } as Theme,
  /** Bootstrap 5: mismos colores, radios y tipografía del sistema. */
  bootstrap: {
    '--nd-accent': '#0d6efd',
    '--nd-danger': '#dc3545',
    '--nd-success': '#198754',
    '--nd-warning': '#ffc107',
    '--nd-info': '#0dcaf0',
    '--nd-cancel-fg': '#dc3545',
    '--nd-cancel-border': '#dc3545',
    '--nd-border': '#dee2e6',
    '--nd-fg': '#212529',
    '--nd-muted': '#6c757d',
    '--nd-radius': '8px',
    '--nd-control-radius': '6px',
    '--nd-font': 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    '--nd-overlay': 'rgba(0,0,0,.5)',
  } as Theme,
  /** Tailwind (paleta indigo/rose/slate por omisión). */
  tailwind: {
    '--nd-accent': '#4f46e5',
    '--nd-danger': '#e11d48',
    '--nd-success': '#059669',
    '--nd-warning': '#d97706',
    '--nd-cancel-fg': '#e11d48',
    '--nd-cancel-border': '#fda4af',
    '--nd-border': '#cbd5e1',
    '--nd-fg': '#0f172a',
    '--nd-muted': '#475569',
    '--nd-surface': '#f8fafc',
    '--nd-line': '#e2e8f0',
    '--nd-radius': '16px',
    '--nd-control-radius': '8px',
  } as Theme,
  /**
   * Tailwind en modo oscuro (slate e indigo): el par de `tailwind`. Úsalo con `scheme: 'dark'` o, mejor, deja que
   * `followPageScheme()` cambie entre los dos según el modo de tu página.
   */
  tailwindDark: {
    '--nd-bg': '#0f172a',
    '--nd-fg': '#f1f5f9',
    '--nd-muted': '#94a3b8',
    '--nd-border': '#64748b',
    '--nd-surface': '#1e293b',
    '--nd-line': '#334155',
    '--nd-accent': '#818cf8',
    '--nd-accent-contrast': '#0f172a',
    '--nd-danger': '#e11d48',
    '--nd-error': '#fb7185',
    '--nd-success': '#34d399',
    '--nd-warning': '#fbbf24',
    '--nd-cancel-fg': '#fb7185',
    '--nd-cancel-border': '#9f1239',
    '--nd-overlay': 'rgba(2,6,23,.7)',
    '--nd-radius': '16px',
    '--nd-control-radius': '8px',
  } as Theme,
  /** Material 3 (tonos base). */
  material: {
    '--nd-accent': '#6750a4',
    '--nd-danger': '#b3261e',
    '--nd-cancel-fg': '#b3261e',
    '--nd-cancel-border': '#e6b4b0',
    '--nd-border': '#79747e',
    '--nd-fg': '#1d1b20',
    '--nd-muted': '#49454f',
    '--nd-surface': '#f7f2fa',
    '--nd-line': '#e7e0ec',
    '--nd-radius': '28px',
    '--nd-control-radius': '20px',
    '--nd-font': 'Roboto,system-ui,sans-serif',
  } as Theme,
}

/** Lee los colores que la página ya usa en Bootstrap 5 (--bs-primary, --bs-danger…). */
export function fromBootstrap(el: Element = document.documentElement): Theme {
  const cs = getComputedStyle(el)
  const leer = (v: string) => cs.getPropertyValue(v).trim()
  const t: Theme = { ...themes.bootstrap }
  const mapa: Record<string, string> = {
    '--bs-primary': '--nd-accent',
    '--bs-danger': '--nd-danger',
    '--bs-success': '--nd-success',
    '--bs-warning': '--nd-warning',
    '--bs-info': '--nd-info',
    '--bs-body-color': '--nd-fg',
    '--bs-secondary-color': '--nd-muted',
    '--bs-border-color': '--nd-border',
    '--bs-body-bg': '--nd-bg',
    '--bs-body-font-family': '--nd-font',
    '--bs-border-radius-lg': '--nd-radius',
    '--bs-border-radius': '--nd-control-radius',
  }
  for (const [bs, nd] of Object.entries(mapa)) {
    const v = leer(bs)
    if (v) t[nd] = v
  }
  const danger = leer('--bs-danger')
  if (danger) t['--nd-cancel-fg'] = t['--nd-cancel-border'] = danger
  return t
}

/** Pone las variables en un elemento (por omisión :root) para que todos los diálogos y toasts las hereden. */
export function applyTheme(theme: Theme, el: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(theme)) el.style.setProperty(k.startsWith('--') ? k : `--nd-${k}`, v)
}

export type PageScheme = 'light' | 'dark'

export interface FollowPageSchemeOptions {
  /**
   * Cómo sabe tu página que está en oscuro. `'class'` (por omisión): `<html class="dark">` (Tailwind con `darkMode: 'class'` o, en la v4,
   * `@custom-variant dark`), `data-theme="dark"` o `data-bs-theme="dark"` (Bootstrap 5.3). `'media'`: el modo del sistema
   * (`prefers-color-scheme`), que es lo que hace Tailwind si no configuras otra cosa.
   */
  strategy?: 'class' | 'media'
  /** Clase de `<html>` que marca el modo oscuro. Por omisión `dark`. */
  darkClass?: string
  /** Variables `--nd-*` para el modo claro. Por omisión las de siempre. Con Tailwind: `themes.tailwind`. */
  light?: Theme
  /** Variables `--nd-*` para el modo oscuro. Con Tailwind: `themes.tailwindDark`. */
  dark?: Theme
}

/**
 * Hace que los diálogos sigan el modo claro u oscuro de tu página, también cuando la persona lo cambia con un interruptor.
 * Llama a `aplicar` al empezar y en cada cambio con el modo y el tema que toca; tú lo pasas a `configure` (y al toast).
 * Los diálogos que se abran después salen en el modo nuevo. Devuelve una función que deja de observar.
 *
 * ```ts
 * import { configure } from 'nexus-dialogs'
 * import { toast } from 'nexus-dialogs/toast'
 * import { themes, followPageScheme } from 'nexus-dialogs/themes'
 *
 * followPageScheme(
 *   ({ scheme, theme }) => {
 *     configure({ scheme, theme })
 *     toast.configure({ scheme, theme })
 *   },
 *   { light: themes.tailwind, dark: themes.tailwindDark },
 * )
 * ```
 */
export function followPageScheme(
  aplicar: (modo: { scheme: PageScheme; theme: Theme }) => void,
  opciones: FollowPageSchemeOptions = {},
): () => void {
  if (typeof document === 'undefined') return () => {}
  const { strategy = 'class', darkClass = 'dark', light = {}, dark = {} } = opciones
  const raiz = document.documentElement
  const sistema = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
  const leer = (): PageScheme => {
    if (strategy === 'media') return sistema?.matches ? 'dark' : 'light'
    return raiz.classList.contains(darkClass) || raiz.dataset.theme === 'dark' || raiz.dataset.bsTheme === 'dark' ? 'dark' : 'light'
  }
  // `configure` mezcla los temas: lo que el modo vigente no define se vacía para que no quede lo del modo anterior.
  const vacias = Object.fromEntries([...new Set([...Object.keys(light), ...Object.keys(dark)])].map((k) => [k, '']))
  let actual: PageScheme | undefined
  const revisar = (): void => {
    const scheme = leer()
    if (scheme === actual) return
    actual = scheme
    aplicar({ scheme, theme: { ...vacias, ...(scheme === 'dark' ? dark : light) } })
  }
  revisar()
  const observador = new MutationObserver(revisar)
  observador.observe(raiz, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-bs-theme'] })
  sistema?.addEventListener('change', revisar)
  return () => {
    observador.disconnect()
    sistema?.removeEventListener('change', revisar)
  }
}
