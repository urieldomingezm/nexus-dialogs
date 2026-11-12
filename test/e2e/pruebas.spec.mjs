// Mesa de pruebas (site/pruebas.html): tema y modo reales, lista que se guarda y resumen para reportar.
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const test = base.extend({
  pagina: async ({ page }, use) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await use(page)
    expect(errores, 'errores en la consola').toEqual([])
  },
})

const fondo = (pagina) =>
  pagina.evaluate(() => {
    const h = document.querySelector('nexus-dialog, [data-nd-host]') ?? [...document.body.querySelectorAll('*')].find((e) => e.shadowRoot)
    return { esquema: h?.getAttribute('data-scheme'), bg: h ? getComputedStyle(h).getPropertyValue('--nd-bg').trim() : null }
  })

test.describe('Mesa de pruebas', () => {
  test('Tailwind en oscuro y en claro cambia los diálogos', async ({ pagina }) => {
    await pagina.goto('/site/pruebas.html')
    await pagina.click('[data-tema-prueba=tailwind]')
    await pagina.click('[data-modo-prueba=oscuro]')
    await expect(pagina.locator('#estado-apariencia')).toContainText('oscuro')
    await expect(pagina.locator('html')).toHaveClass(/dark/)
    await pagina.getByRole('button', { name: 'Confirmar un borrado' }).click()
    await expect(pagina.locator('dialog[open]')).toHaveCount(1)
    let r = await fondo(pagina)
    expect(r.esquema).toBe('dark')
    expect(r.bg).toBe('#0f172a')
    await pagina.keyboard.press('Escape')
    await pagina.click('[data-modo-prueba=claro]')
    await expect(pagina.locator('#estado-apariencia')).toContainText('claro')
    await pagina.getByRole('button', { name: 'Confirmar un borrado' }).click()
    r = await fondo(pagina)
    expect(r.esquema).toBe('light')
    expect(r.bg).not.toBe('#0f172a')
  })

  test('la lista se guarda y el resumen refleja la versión y la apariencia', async ({ pagina }) => {
    await pagina.goto('/site/pruebas.html')
    await pagina.click('[data-tema-prueba=bootstrap]')
    await pagina.check('#rev-teclado')
    await pagina.fill('#notas', 'Se ve bien en móvil')
    const resumen = pagina.locator('#resumen')
    await expect(resumen).toHaveValue(/nexus-dialogs \d+\.\d+\.\d+/)
    await expect(resumen).toHaveValue(/tema Bootstrap/)
    await expect(resumen).toHaveValue(/\[x\] Con el teclado/)
    await expect(resumen).toHaveValue(/Se ve bien en móvil/)
    await pagina.reload()
    await expect(pagina.locator('#rev-teclado')).toBeChecked()
    await expect(pagina.locator('#notas')).toHaveValue('Se ve bien en móvil')
    await expect(pagina.locator('#reportar-error')).toHaveAttribute('href', /template=error\.yml&version=/)
  })

  test('accesibilidad: sin violaciones axe', async ({ pagina }) => {
    await pagina.goto('/site/pruebas.html')
    const r = await new AxeBuilder({ page: pagina }).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
  })
})
