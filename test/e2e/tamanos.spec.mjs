// Tamaños y diseño adaptable de las pestañas y del seguimiento, con medidas reales en el navegador.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const abrir = async (page, id, titulo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/site/ejemplos.html#${id}`)
  await page.locator(`#ej-${id}`).getByRole('button', { name: 'Probar' }).click()
  const d = page.locator('dialog[data-nexus-dialog]')
  await expect(d.getByRole('heading', { name: titulo })).toBeVisible()
  return d
}
const caja = async (loc) => await loc.boundingBox()

test.describe('Pestañas: tamaño', () => {
  test('scale «sm» mide 34 px y fill reparte el ancho por igual', async ({ page }) => {
    const d = await abrir(page, 'pestanas-compactas', 'Resultado de la cita')
    const tabs = d.getByRole('tab')
    await expect(tabs).toHaveCount(3)
    const cajas = [await caja(tabs.nth(0)), await caja(tabs.nth(1)), await caja(tabs.nth(2))]
    for (const c of cajas) expect(Math.round(c.height)).toBe(34)
    expect(Math.abs(cajas[0].width - cajas[1].width)).toBeLessThan(2)
    expect(Math.abs(cajas[1].width - cajas[2].width)).toBeLessThan(2)
  })

  test('en móvil la lista no desborda el diálogo', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 })
    const d = await abrir(page, 'pestanas-compactas', 'Resultado de la cita')
    const lista = await caja(d.getByRole('tablist'))
    expect(lista.x + lista.width).toBeLessThanOrEqual(360)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
})

test.describe('Seguimiento: tamaño y disposición', () => {
  test('horizontal en pantalla ancha: las 5 etapas en una fila y marcadores de 24 px (sm)', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 })
    const d = await abrir(page, 'seguimiento-horizontal', 'Seguimiento de contratación')
    const marcas = d.locator('.tl-mark')
    await expect(marcas).toHaveCount(5)
    const c = []
    for (let i = 0; i < 5; i++) c.push(await caja(marcas.nth(i)))
    for (const m of c) {
      expect(Math.round(m.width)).toBe(24)
      expect(Math.abs(m.y - c[0].y)).toBeLessThan(2) // misma fila
    }
    for (let i = 1; i < 5; i++) expect(c[i].x).toBeGreaterThan(c[i - 1].x + 24)
  })

  test('en móvil la misma configuración horizontal vuelve a vertical', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    const d = await abrir(page, 'seguimiento-horizontal', 'Seguimiento de contratación')
    const marcas = d.locator('.tl-mark')
    const a = await caja(marcas.nth(0))
    const b = await caja(marcas.nth(1))
    expect(Math.abs(a.x - b.x)).toBeLessThan(2) // misma columna
    expect(b.y).toBeGreaterThan(a.y + 24)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })

  test('el seguimiento vertical (md) mide 32 px por marcador', async ({ page }) => {
    const d = await abrir(page, 'seguimiento', 'Ortega Vázquez Mariela Berenice')
    expect(Math.round((await caja(d.locator('.tl-mark').first())).width)).toBe(32)
  })
})

for (const [id, titulo] of [
  ['pestanas-compactas', 'Resultado de la cita'],
  ['seguimiento-horizontal', 'Seguimiento de contratación'],
]) {
  for (const tema of ['claro', 'oscuro']) {
    for (const ancho of [1100, 390]) {
      test(`axe: «${id}» sin violaciones en ${tema}, ${ancho} px`, async ({ page, browserName }) => {
        test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
        await page.setViewportSize({ width: ancho, height: 800 })
        await page.addInitScript((t) => localStorage.setItem('nd-tema', t), tema)
        await abrir(page, id, titulo)
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' })
        // WebKit puede medir el contraste con la entrada del diálogo a medias: se espera a que no quede ninguna animación.
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
      })
    }
  }
}
