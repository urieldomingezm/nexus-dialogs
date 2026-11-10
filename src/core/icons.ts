import type { IconName } from '../types'
import { h, svg } from './dom'

const PATHS: Record<IconName, string> = {
  success: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  error: '<path d="M7 7l10 10M17 7 7 17"/>',
  warning: '<path d="M12 3.8 21 19.5H3z"/><path d="M12 10v4M12 16.8v.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6M12 16.6v.2"/>',
  delete: '<path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.9 11.6a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/>',
}

/** Icono decorativo (aria-hidden) en un cuadro suave junto al título: el título ya dice qué pasó. */
export function icon(name: IconName): HTMLElement {
  return h(
    'span',
    { class: `icon i-${name}`, 'aria-hidden': 'true' },
    svg(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`,
    ),
  )
}

export const closeIcon = (): SVGElement =>
  svg(
    '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  )
