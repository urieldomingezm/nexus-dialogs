// Content-Security-Policy y Trusted Types en un navegador real: la librería no debe violar ninguna de las dos
// con sus propios estilos e iconos, ni con el camino de estilos alternativo (sin hojas construibles).
import { test as base, expect } from '@playwright/test'
import { PAGINA, boton, enDialogo } from './utilidades.mjs'

/** Página de pruebas servida con la política indicada; recoge toda violación y todo error. */
const test = base.extend({
  conCsp: async ({ page }, use) => {
    const abrir = async (csp, { sinHojas = false } = {}) => {
      const problemas = []
      page.on('pageerror', (e) => problemas.push(`error: ${e.message}`))
      page.on('console', (m) => m.type() === 'error' && /Content Security|Trusted/i.test(m.text()) && problemas.push(m.text()))
      await page.addInitScript(() => {
        window.__violaciones = []
        document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(`${e.violatedDirective} ${e.blockedURI}`))
      })
      if (sinHojas) await page.addInitScript(() => Object.defineProperty(window, 'CSSStyleSheet', { value: undefined, configurable: true }))
      await page.route('**/test/paginas/', async (route) => {
        const r = await route.fetch()
        await route.fulfill({ response: r, headers: { ...r.headers(), 'content-security-policy': csp } })
      })
      await page.goto(PAGINA)
      await page.waitForFunction(() => window.nd)
      return problemas
    }
    await use(abrir)
  },
})

/** Violaciones nuevas desde que se llamó a `marcar` (la página de pruebas trae sus propios <style> en línea, que la política bloquea al cargar). */
const marcar = async (page, problemas = []) => {
  problemas.length = 0
  await page.evaluate(() => (window.__base = window.__violaciones.length))
}
const violaciones = (page) => page.evaluate(() => window.__violaciones.slice(window.__base ?? 0))
const estilado = (page) =>
  enDialogo(page, '.panel').evaluate((el) => {
    const c = getComputedStyle(el)
    return { fondo: c.backgroundColor, radio: c.borderRadius, ancho: el.getBoundingClientRect().width }
  })

test.describe('CSP sin estilos en línea', () => {
  test('con hojas construibles: diálogo, formulario y toast salen estilados y sin violaciones', async ({ page, conCsp }) => {
    const problemas = await conCsp("style-src 'self'")
    await marcar(page, problemas)
    await page.click('#b-confirm')
    const e = await estilado(page)
    expect(e.fondo).not.toBe('rgba(0, 0, 0, 0)')
    expect(e.ancho).toBeGreaterThan(200)
    await boton(page, 'cancel').click()
    await page.click('#b-form')
    await expect(enDialogo(page, '[name=nombre]')).toBeFocused()
    await boton(page, 'cancel').click()
    await page.evaluate(() => window.nd.toast({ title: 'Guardado', text: 'Listo' }))
    await expect(page.locator('[data-nexus-toast]').locator('li').first()).toBeVisible()
    expect(await violaciones(page)).toEqual([])
    expect(problemas).toEqual([])
  })

  test('sin hojas construibles y sin nonce, el <style> alternativo lo bloquea la política (se documenta)', async ({ page, conCsp }) => {
    const p0 = await conCsp("style-src 'self'", { sinHojas: true })
    await marcar(page, p0)
    await page.click('#b-confirm')
    expect((await violaciones(page)).some((v) => v.startsWith('style-src'))).toBe(true)
  })

  test('sin hojas construibles y con nonce configurado, el <style> alternativo sí se permite', async ({ page, conCsp }) => {
    const problemas = await conCsp("style-src 'nonce-nd123'", { sinHojas: true })
    await page.evaluate(() => window.nd.configure({ nonce: 'nd123' }))
    await marcar(page, problemas)
    await page.click('#b-confirm')
    const e = await estilado(page)
    expect(e.fondo).not.toBe('rgba(0, 0, 0, 0)')
    expect(e.ancho).toBeGreaterThan(200)
    expect(await violaciones(page)).toEqual([])
    expect(problemas).toEqual([])
  })
})

test.describe('Trusted Types', () => {
  test("con require-trusted-types-for 'script' la librería abre diálogos, formularios y toasts", async ({ page, conCsp }) => {
    const problemas = await conCsp("require-trusted-types-for 'script'")
    await marcar(page, problemas)
    for (const id of ['#b-alert', '#b-confirm', '#b-form']) {
      await page.click(id)
      await expect(enDialogo(page, '.panel')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(0)
    }
    await page.evaluate(() => window.nd.toast({ title: 'Guardado', text: 'Listo', icon: 'success' }))
    await expect(page.locator('[data-nexus-toast]').locator('li').first()).toBeVisible()
    expect(await violaciones(page)).toEqual([])
    expect(problemas).toEqual([])
  })

  test('html en cadena sin TrustedHTML se bloquea; con un sanitize que devuelve TrustedHTML se inserta', async ({ page, conCsp }) => {
    await conCsp("require-trusted-types-for 'script'")
    // Con strictHtml (el valor por omisión de la librería; la página de pruebas lo apaga) la cadena sale como texto:
    // no toca innerHTML y no viola Trusted Types.
    await page.evaluate(() => window.nd.configure({ strictHtml: true }))
    await marcar(page)
    await page.evaluate(() => void window.nd.dialog.alert({ html: '<b id="x">hola</b>' }))
    await expect(enDialogo(page, '.html')).toHaveText('<b id="x">hola</b>')
    await expect(enDialogo(page, '.html b')).toHaveCount(0)
    await page.keyboard.press('Escape')
    // Con strictHtml: false y sin política, la cadena no se puede insertar. Ni pasa ni rompe la página.
    await page.evaluate(() => window.nd.configure({ strictHtml: false }))
    const sin = await page.evaluate(async () => {
      try {
        window.nd.dialog.alert({ html: '<b id="x">hola</b>' })
        return 'abrió'
      } catch (e) {
        return `error: ${e.name}`
      }
    })
    expect(sin).toMatch(/error: TypeError/)
    // Con una política propia que limpia y devuelve TrustedHTML.
    await page.evaluate(() => {
      const politica = window.trustedTypes.createPolicy('app', { createHTML: (s) => s.replace(/<script.*?<\/script>/gi, '') })
      window.nd.configure({ sanitize: (s) => politica.createHTML(s) })
      window.nd.dialog.alert({ html: '<b id="x">hola</b><script>window.__xss=1</script>' })
    })
    await expect(enDialogo(page, '.html b')).toHaveText('hola')
    expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  })
})
