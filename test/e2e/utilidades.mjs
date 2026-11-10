// Utilidades compartidas por las pruebas de punta a punta (Playwright Test).
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export { expect }
export const PAGINA = '/test/paginas/'

/** Elemento dentro del Shadow DOM del diálogo de arriba (Playwright atraviesa shadow roots con locators CSS). */
export const enDialogo = (page, q) => page.locator('dialog[data-nexus-dialog]').last().locator(q)
export const boton = (page, id) => enDialogo(page, `button[data-id="${id}"]`)

/** Resultado del último diálogo abierto desde la página de pruebas. */
export const resultado = (page) => page.waitForFunction(() => window.ultimo).then(() => page.evaluate(() => window.ultimo))

/** Espera a que no haya diálogos de la librería. */
export const sinDialogos = (page) => expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(0)

/** Abre la página de pruebas, limpia el resultado y falla si la página lanza errores. */
export const test = base.extend({
  pagina: async ({ page }, use) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(PAGINA)
    await page.waitForFunction(() => window.nd)
    await use(page)
    expect(errores, 'errores de JavaScript en la página').toEqual([])
  },
})

/** Revisión de accesibilidad con axe (WCAG 2.2 AA) de lo que esté abierto. */
export async function axe(page, incluir = 'dialog[data-nexus-dialog]') {
  const r = await new AxeBuilder({ page }).include(incluir).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}
