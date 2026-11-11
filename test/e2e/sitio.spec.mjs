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
    ['erp.html', /Mini ERP/],
    ['migracion.html', /Migrar/],
    ['accesibilidad.html', /Accesibilidad/],
    ['api.html', /API/],
  ]) {
    test(`${pagina}: carga, sin marcadores sin resolver ni errores`, async ({ pagina: page }) => {
      await page.goto(SITIO + pagina)
      await expect(page).toHaveTitle(titulo)
      await expect(page.locator('header.cabecera nav a[aria-current="page"]')).toHaveCount(pagina === 'accesibilidad.html' ? 0 : 1)
      expect(await page.content()).not.toContain('<!--@')
      await expect(page.locator('footer.pie')).toContainText('MIT')
    })
  }

  test('celular: el menú se abre y se cierra con Esc', async ({ pagina: page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(SITIO + 'index.html')
    const boton = page.locator('.menu-btn')
    await expect(page.locator('#menu-principal')).toBeHidden()
    await boton.click()
    await expect(boton).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#menu-principal a', { hasText: 'Ejemplos' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#menu-principal')).toBeHidden()
  })

  test('portada: el botón Ejecutar abre la receta de borrar', async ({ pagina: page }) => {
    await page.goto(SITIO + 'index.html')
    await page.locator('#b-hero').click()
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
  })

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

  test('mini ERP: baja con confirmación y «Deshacer», cambio de puesto y acción masiva', async ({ pagina: page }) => {
    await page.goto(SITIO + 'erp.html')
    const filas = page.locator('#e-filas tr')
    await expect(filas).toHaveCount(5)
    await filas
      .first()
      .getByRole('button', { name: /Dar de baja/ })
      .click()
    await page.locator('dialog[data-nexus-dialog]').last().locator('button[data-id="confirm"]').click()
    await expect(filas).toHaveCount(4)
    await page.locator('[data-nexus-toast]').getByRole('button', { name: 'Deshacer' }).click()
    await expect(filas).toHaveCount(5)
    await filas
      .first()
      .getByRole('button', { name: /Cambiar puesto/ })
      .click()
    const d = page.locator('dialog[data-nexus-dialog]').last()
    await d.locator('input[name="puesto"]').fill('Gerente de turno')
    await d.locator('button[data-id="confirm"]').click()
    await expect(filas.first()).toContainText('Gerente de turno')
    await page.locator('#e-masiva').click()
    await page.locator('dialog[data-nexus-dialog]').last().locator('button[data-id="run"]').click()
    await page.locator('dialog[data-nexus-dialog]').last().locator('button[data-id="done"]').click({ timeout: 15000 })
    await expect(page.locator('#e-log li').first()).toContainText('Mover de área')
  })

  test('mini ERP: exportar descarga empleados.xlsx y el alta abre el asistente', async ({ pagina: page }) => {
    await page.goto(SITIO + 'erp.html')
    const descarga = page.waitForEvent('download')
    await page.locator('#e-exportar').click()
    expect((await descarga).suggestedFilename()).toBe('empleados.xlsx')
    await page.locator('#e-alta').click()
    await expect(page.locator('dialog[data-nexus-dialog]').last()).toContainText('Alta de empleado')
  })

  test('migración: el mismo código de SweetAlert2 corre con el adaptador y con la API propia', async ({ pagina: page }) => {
    await page.goto(SITIO + 'migracion.html')
    expect(await page.locator('.mig').count()).toBeGreaterThanOrEqual(7)
    await page.locator('#m-borrar button[data-mig="swal"]').click()
    const d = page.locator('dialog[data-nexus-dialog]').last()
    await expect(d.locator('button[data-id="confirm"]')).toHaveClass('btn btn-danger')
    await d.locator('button[data-id="confirm"]').click()
    await expect(page.locator('#mig-salida')).toContainText('SweetAlert2 (adaptador) → true')
    await page.locator('#m-borrar button[data-mig="nativa"]').click()
    await page.locator('dialog[data-nexus-dialog]').last().locator('button[data-id="confirm"]').click()
    await expect(page.locator('#mig-salida')).toContainText('API propia → true')
  })

  test('accesibilidad: las páginas no tienen violaciones de axe (WCAG 2.2 AA)', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
    for (const p of ['index.html', 'ejemplos.html', 'guia.html', 'erp.html', 'migracion.html', 'accesibilidad.html']) {
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
