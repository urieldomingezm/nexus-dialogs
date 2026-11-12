// El build sin bundler (nexus-dialogs.swal.iife.js) debe respetar strictHtml y sanitize.
// Regresión de la 0.5.0: el empaquetador dejó setHtml fijo en texto porque `configure` no estaba en el build.
import { test, expect } from '@playwright/test'

const cargar = async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setContent('<!doctype html><html><body></body></html>')
  await page.addScriptTag({ path: 'dist/nexus-dialogs.swal.iife.js' })
}
const cuerpo = (page) => page.locator('dialog[data-nexus-dialog]')

test.describe('Build swal.iife: html', () => {
  test('por omisión (strictHtml) el html se ve como texto', async ({ page }) => {
    await cargar(page)
    await page.evaluate(() => void window.Swal.fire({ title: 'A', html: '<b>x</b>' }))
    await expect(cuerpo(page).getByText('<b>x</b>')).toBeVisible()
    await expect(cuerpo(page).locator('b')).toHaveCount(0)
  })

  test('Swal.configure({ strictHtml: false }) lo interpreta', async ({ page }) => {
    await cargar(page)
    expect(await page.evaluate(() => typeof window.Swal.configure)).toBe('function')
    await page.evaluate(() => {
      window.Swal.configure({ strictHtml: false })
      void window.Swal.fire({ title: 'A', html: '<b>x</b>' })
    })
    await expect(cuerpo(page).locator('b')).toHaveText('x')
  })

  test('Swal.configure({ sanitize }) filtra lo que se inserta', async ({ page }) => {
    await cargar(page)
    await page.evaluate(() => {
      window.Swal.configure({ sanitize: (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '') })
      void window.Swal.fire({ title: 'A', html: '<i>ok</i><script>window.__x=1</script>' })
    })
    await expect(cuerpo(page).locator('i')).toHaveText('ok')
    expect(await page.evaluate(() => window.__x)).toBeUndefined()
    await expect(cuerpo(page).locator('script')).toHaveCount(0)
  })
})
