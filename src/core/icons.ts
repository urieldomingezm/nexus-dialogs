import type { IconName } from '../types'
import { svg } from './dom'

const PATHS: Record<IconName, string> = {
  success: '<path d="M17 28.5l7 7 15-15"/>',
  error: '<path d="M20 20l16 16M36 20L20 36"/>',
  warning: '<path d="M28 16v15M28 38v.5"/>',
  info: '<path d="M28 25v14M28 17v.5"/>',
  question: '<path d="M22 22a6 6 0 1 1 9 5.2c-2 1.2-3 2.3-3 4.3M28 38v.5"/>',
}

/** Icono decorativo (aria-hidden): el título ya dice qué pasó. */
export function icon(name: IconName): SVGElement {
  return svg(
    `<svg class="icon i-${name}" viewBox="0 0 56 56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle class="bgc" cx="28" cy="28" r="28" stroke="none"/>${PATHS[name]}</svg>`,
  )
}

export const closeIcon = (): SVGElement =>
  svg(
    '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  )
