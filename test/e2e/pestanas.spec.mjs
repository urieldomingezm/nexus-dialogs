// Pestañas (nexus-dialogs/tabs) en un navegador real: teclado, foco, altura estable, lista fija al bajar y axe en claro y oscuro.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SITIO = '/site/ejemplos.html#pestanas'
const abrir = async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(SITIO)
  await page.locator('#ej-pestanas').getByRole('button', { name: 'Probar' }).click()
  const d = page.locator('dialog[data-nexus-dialog]')
  await expect(d.getByRole('tab', { name: 'Datos generales' })).toHaveAttribute('aria-selected', 'true')
  return d
}

test.describe('Pestañas', () => {
  test('el foco inicia en la pestaña activa; las flechas, Inicio y Fin cambian de pestaña', async ({ page }) => {
    const d = await abrir(page)
    await expect(d.getByRole('tab', { name: 'Datos generales' })).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(d.getByRole('tab', { name: /Cita y entrevista/ })).toHaveAttribute('aria-selected', 'true')
    await expect(d.getByRole('tab', { name: /Cita y entrevista/ })).toBeFocused()
    await expect(d.getByRole('tabpanel', { name: /Cita y entrevista/ })).toContainText('Videollamada') // contenido async
    await page.keyboard.press('Home')
    await expect(d.getByRole('tab', { name: 'Datos generales' })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('End')
    await expect(d.getByRole('tab', { name: /Cita y entrevista/ })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Escape')
    await expect(d).toHaveCount(0)
  })

  test('el diálogo no cambia de alto al cambiar de pestaña (altura estable)', async ({ page }) => {
    const d = await abrir(page)
    const alto = async () => (await d.locator('[data-nexus-host]').locator('.panel, [role=dialog]').first().boundingBox())?.height
    const a = await alto()
    await d.getByRole('tab', { name: /Cita y entrevista/ }).click()
    await expect(d.getByRole('tabpanel', { name: /Cita y entrevista/ })).toContainText('Videollamada')
    expect(Math.abs((await alto()) - a)).toBeLessThan(2)
  })

  test('en pantalla baja la lista de pestañas se queda fija mientras el contenido se desplaza', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 420 })
    const d = await abrir(page)
    const lista = d.getByRole('tablist')
    const cuerpo = d.locator('.body')
    const antes = (await lista.boundingBox()).y
    await cuerpo.evaluate((b) => b.scrollTo({ top: b.scrollHeight }))
    expect(await cuerpo.evaluate((b) => b.scrollTop)).toBeGreaterThan(0) // sí hubo desplazamiento
    const despues = (await lista.boundingBox()).y
    const arribaDelCuerpo = (await cuerpo.boundingBox()).y
    expect(despues).toBeLessThan(antes) // subió hasta pegarse…
    expect(despues - arribaDelCuerpo).toBeLessThanOrEqual(21) // …al borde superior del cuerpo (que deja 20 px de relleno)
    await expect(lista).toBeVisible()
  })

  for (const tema of ['claro', 'oscuro']) {
    test(`axe: sin violaciones en ${tema} (WCAG 2.2 AA), con cada pestaña`, async ({ page, browserName }) => {
      test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript((t) => localStorage.setItem('nd-tema', t), tema)
      const d = await abrir(page)
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' })
      for (const nombre of ['Datos generales', /Cita y entrevista/]) {
        await d.getByRole('tab', { name: nombre }).click()
        await expect(d.getByRole('tab', { name: nombre })).toHaveAttribute('aria-selected', 'true')
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
      }
    })
  }
})
