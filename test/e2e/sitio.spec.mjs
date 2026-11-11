// Sitio de documentación (site/): todas las páginas cargan sin errores y cada ejemplo de la galería se ejecuta de verdad.
import { readFileSync } from 'node:fs'
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SITIO = '/site/'
const IDS = [...readFileSync('site/src/ejemplos-def.ts', 'utf8').matchAll(/^ \* id: (\S+)$/gm)].map((m) => m[1])

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

test.describe('Sitio de documentación', () => {
  for (const [pagina, titulo] of [
    ['index.html', /nexus-dialogs/],
    ['guia.html', /Guía/],
    ['ejemplos.html', /Ejemplos/],
    ['api.html', /API/],
    ['comparar.html', /vs SweetAlert2/],
  ]) {
    test(`${pagina}: carga, sin marcadores sin resolver ni errores`, async ({ pagina: page }) => {
      await page.goto(SITIO + pagina)
      await expect(page).toHaveTitle(titulo)
      await expect(page.locator('header.cabecera nav a[aria-current="page"]')).toHaveCount(pagina === 'index.html' ? 1 : 1)
      expect(await page.content()).not.toContain('<!--@')
      await expect(page.locator('footer.pie')).toContainText('MIT')
    })
  }

  test('guía: README con anclajes, menú lateral y código resaltado', async ({ pagina: page }) => {
    await page.goto(SITIO + 'guia.html')
    await expect(page.locator('#vienes-de-sweetalert2')).toBeAttached()
    await expect(page.locator('[id="1-instalación"]')).toBeAttached()
    await expect(page.locator('[data-toc] a').first()).toBeVisible()
    expect(await page.locator('[data-toc] a').count()).toBeGreaterThan(20)
    await expect(page.locator('pre .tk-k').first()).toBeAttached()
    // Un enlace interno del índice del README y uno al reporte de API reescrito
    await expect(page.locator('a[href="api.html"]').first()).toBeAttached()
    await page.locator('pre').first().hover()
    await expect(page.locator('pre .copiar').first()).toBeVisible()
  })

  test('tema: cambia entre auto, claro y oscuro y se recuerda', async ({ pagina: page }) => {
    await page.goto(SITIO + 'index.html')
    const boton = page.locator('button[data-tema]')
    await expect(boton).toHaveText('Tema: Auto')
    await boton.click()
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro')
    await boton.click()
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'oscuro')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'oscuro')
    await expect(page.locator('button[data-tema]')).toHaveText('Tema: Oscuro')
  })

  test('portada: los botones abren la librería de verdad', async ({ pagina: page }) => {
    await page.goto(SITIO + 'index.html')
    await page.locator('#b-borrar').click()
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(0)
    await page.locator('#b-form').click()
    await expect(page.locator('dialog[data-nexus-dialog]').last().locator('input').first()).toBeVisible()
  })

  test('ejemplos: la galería trae todos los ejemplos y el buscador filtra', async ({ pagina: page }) => {
    await page.goto(SITIO + 'ejemplos.html')
    await expect(page.locator('article.ejemplo')).toHaveCount(IDS.length)
    await expect(page.locator('#total')).toHaveText(String(IDS.length))
    await page.locator('#buscar').fill('excel')
    const visibles = await page.locator('article.ejemplo:visible').count()
    expect(visibles).toBeGreaterThan(0)
    expect(visibles).toBeLessThan(IDS.length)
    await page.locator('#buscar').fill('zzzz-no-existe')
    await expect(page.locator('#vacio')).toBeVisible()
    await page.locator('#buscar').fill('')
    await page.getByRole('button', { name: 'Toasts', exact: true }).click()
    await expect(page.locator('article.ejemplo:visible')).toHaveCount(2)
  })

  for (const id of IDS) {
    test(`ejemplo «${id}» se ejecuta`, async ({ pagina: page }) => {
      await page.goto(`${SITIO}ejemplos.html#${id}`)
      const tarjeta = page.locator(`#ej-${id}`)
      await expect(tarjeta).toBeVisible()
      await expect(tarjeta.locator('pre code').first()).not.toBeEmpty()
      const descarga = id === 'exportar' ? page.waitForEvent('download') : null
      await tarjeta.getByRole('button', { name: 'Probar' }).click()
      if (descarga) {
        expect((await descarga).suggestedFilename()).toBe('empleados.xlsx')
        return
      }
      // Algo debe pasar: se abre un diálogo, sale un toast o aparece el resultado de un ejemplo sin diálogo.
      await expect
        .poll(
          () =>
            page.evaluate(
              (i) =>
                document.querySelectorAll('dialog[data-nexus-dialog]').length > 0 ||
                !document.querySelector(`#ej-${i} .resultado`)?.hidden ||
                !!document.querySelector('[data-nexus-toast-host], nexus-toasts, [data-nexus-toast]'),
              id,
            ),
          { timeout: 5000 },
        )
        .toBe(true)
    })
  }

  test('ejemplo «alerta»: el resultado queda a la vista al cerrar', async ({ pagina: page }) => {
    await page.goto(SITIO + 'ejemplos.html')
    await page.locator('#ej-error').getByRole('button', { name: 'Probar' }).click()
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('#ej-error .resultado')).toContainText('confirmed')
  })

  test('ejemplo «validadores»: valida de verdad el dígito verificador', async ({ pagina: page }) => {
    await page.goto(SITIO + 'ejemplos.html')
    await page.locator('#ej-validadores').getByRole('button', { name: 'Probar' }).click()
    const r = page.locator('#ej-validadores .resultado')
    await expect(r).toContainText('"clabeBuena": true')
    await expect(r).toContainText('"clabeMala": false')
  })

  test('comparar: escenarios, cifras y SweetAlert2 real lado a lado', async ({ pagina: page }) => {
    await page.goto(SITIO + 'comparar.html')
    await expect(page.locator('article.escenario')).toHaveCount(6)
    for (const id of ['n-params', 'n-params-ok', 'n-params-falta', 'n-metodos', 'n-metodos-ok', 'n-metodos-falta']) {
      expect(Number(await page.locator('#' + id).textContent())).toBeGreaterThan(0)
    }
    // Las cifras de tamaño salen de dist/: no deben quedar vacías
    await expect(page.locator('td.dato').first()).not.toContainText('—')
    const primero = page.locator('article.escenario').first()
    await primero.getByRole('button', { name: 'SweetAlert2' }).click()
    await expect(page.locator('.swal2-popup')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.swal2-popup')).toBeHidden()
    await primero.getByRole('button', { name: 'Adaptador (mismo código)' }).click()
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(0)
    await primero.getByRole('button', { name: 'nexus-dialogs' }).click()
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
  })

  test('comparar: el formulario de SweetAlert2 no funciona con el adaptador (documentado)', async ({ pagina: page }) => {
    await page.goto(SITIO + 'comparar.html')
    const form = page.locator('article.escenario', { hasText: 'Formulario de varios campos' })
    await expect(form.getByRole('button', { name: 'Adaptador (mismo código)' })).toBeDisabled()
    await expect(form).toContainText('Shadow DOM')
  })

  test('accesibilidad: las páginas no tienen violaciones de axe (WCAG 2.2 AA)', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
    for (const p of ['index.html', 'ejemplos.html', 'comparar.html', 'guia.html']) {
      await page.goto(SITIO + p)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      expect(
        r.violations.map(
          (v) =>
            `${p} → ${v.id}: ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 3)
              .join(', ')}`,
        ),
      ).toEqual([])
    }
  })
})
