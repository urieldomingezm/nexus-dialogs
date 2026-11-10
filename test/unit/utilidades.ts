// Ayudas para las pruebas unitarias (happy-dom).
import { beforeEach } from 'vitest'

// Movimiento reducido: los diálogos se cierran sin esperar la animación.
beforeEach(() => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('reduce'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as any
  document.body.innerHTML = ''
})

/** Shadow root del diálogo de arriba. */
export const raiz = (): ShadowRoot => {
  const hosts = document.querySelectorAll('dialog[data-nexus-dialog] [data-nexus-host]')
  return (hosts[hosts.length - 1] as HTMLElement).shadowRoot!
}
export const $ = <E extends Element = HTMLElement>(q: string): E => raiz().querySelector(q) as unknown as E
export const $$ = (q: string): HTMLElement[] => [...raiz().querySelectorAll<HTMLElement>(q)]
export const boton = (id: string): HTMLButtonElement => $(`button[data-id="${id}"]`)
export const esperar = (ms = 0) => new Promise((r) => setTimeout(r, ms))
export const abiertos = () => document.querySelectorAll('dialog[data-nexus-dialog]').length

/** Escribe en un campo como lo haría el usuario. */
export function escribir(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, valor: string): void {
  el.value = valor
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}
