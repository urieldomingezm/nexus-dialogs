// Hojas de estilo construibles (adoptedStyleSheets): no dependen de <style> en línea, así funcionan con una
// Content-Security-Policy estricta. Si el navegador no las soporta, se usa un <style> normal.

const cache = new Map<string, CSSStyleSheet | null>()

function construible(css: string): CSSStyleSheet | null {
  if (cache.has(css)) return cache.get(css)!
  let s: CSSStyleSheet | null = null
  try {
    s = new CSSStyleSheet()
    s.replaceSync(css)
  } catch {
    s = null
  }
  cache.set(css, s)
  return s
}

/** Aplica CSS a una raíz (shadow root o documento). */
export function adopt(root: ShadowRoot | Document, css: string): void {
  const s = construible(css)
  if (s && 'adoptedStyleSheets' in root) {
    try {
      if (!root.adoptedStyleSheets.includes(s)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, s]
      return
    } catch {}
  }
  const el = document.createElement('style')
  el.textContent = css
  ;(root.nodeType === Node.DOCUMENT_NODE ? (root as Document).head : root).appendChild(el)
}

let global = false
/** Reglas mínimas en el documento para el <dialog> contenedor (su ::backdrop no se puede estilizar en línea). */
export function globalStyles(): void {
  if (global) return
  global = true
  adopt(
    document,
    `dialog[data-nexus-dialog]{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;overflow:visible!important;outline:none!important;color:inherit}
dialog[data-nexus-dialog]::backdrop{background:transparent!important}
html[data-nexus-lock]{overflow:hidden!important}`,
  )
}
