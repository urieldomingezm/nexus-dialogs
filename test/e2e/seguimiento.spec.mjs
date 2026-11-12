// Seguimiento por etapas (nexus-dialogs/timeline) en un navegador real: estructura, progreso y axe en claro y oscuro.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const abrir = async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/site/ejemplos.html#seguimiento')
  await page.locator('#ej-seguimiento').getByRole('button', { name: 'Probar' }).click()
  const d = page.locator('dialog[data-nexus-dialog]')
  await expect(d.getByRole('heading', { name: 'Ortega Vázquez Mariela Berenice' })).toBeVisible()
  return d
}

test.describe('Seguimiento', () => {
  test('muestra las 6 etapas con su estado en texto, el resumen y la barra', async ({ page }) => {
    const d = await abrir(page)
    await expect(d.getByRole('listitem')).toHaveCount(6)
    await expect(d.getByText('0 de 6 etapas completadas · 0%')).toBeVisible()
    await expect(d.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await expect(d.locator('li[aria-current="step"]')).toContainText('Cita')
    await expect(d.locator('li[aria-current="step"]')).toContainText('En curso')
    await expect(d.getByText('Pendiente', { exact: true })).toHaveCount(5)
    await expect(d.getByText('Los estados se muestran con base en registros')).toBeVisible()
  })

  test('las etapas quedan en una columna ordenada (el marcador a la izquierda del texto)', async ({ page }) => {
    const d = await abrir(page)
    const marca = await d.locator('.tl-mark').first().boundingBox()
    const titulo = await d.getByRole('heading', { name: 'Cita', level: 3, exact: true }).boundingBox()
    expect(marca.x + marca.width).toBeLessThan(titulo.x)
    const siguiente = await d.getByRole('heading', { name: 'Enlace NEO', exact: true }).boundingBox()
    expect(siguiente.y).toBeGreaterThan(titulo.y + 20)
  })

  for (const tema of ['claro', 'oscuro']) {
    test(`axe: sin violaciones en ${tema} (WCAG 2.2 AA)`, async ({ page, browserName }) => {
      test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
      await page.addInitScript((t) => localStorage.setItem('nd-tema', t), tema)
      await abrir(page)
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' })
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }
})
