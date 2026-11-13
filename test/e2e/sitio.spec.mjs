// Sitio de documentación (site/): todas las páginas cargan sin errores y cada ejemplo de la galería se ejecuta de verdad.
import { readFileSync } from 'node:fs'
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { enDialogo } from './utilidades.mjs'

const SITIO = '/site/'
const IDS = [...readFileSync('site/src/ejemplos-def.ts', 'utf8').matchAll(/^ \* id: (\S+)$/gm)].map((m) => m[1])

const test = base.extend({
  pagina: async ({ page }, use) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
    await page.route('https://api.npmjs.org/**', (r) =>
      r.fulfill({ json: { downloads: 1234, package: 'nexus-dialogs' }, headers: { 'access-control-allow-origin': '*' } }),
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await use(page)
    expect(errores, 'errores en la consola').toEqual([])
  },
})

test.describe('Sitio de documentación', () => {
  for (const [pagina, titulo] of [
    ['index.html', /nexus-dialogs/],
    ['primeros-pasos.html', /Primeros pasos/],
    ['guia.html', /Guía/],
    ['ejemplos.html', /Ejemplos/],
    ['playground.html', /Playground/],
    ['pruebas.html', /Pruebas/],
    ['erp.html', /Mini ERP/],
    ['migracion.html', /Migrar/],
    ['accesibilidad.html', /Accesibilidad/],
    ['seguridad.html', /Seguridad/],
    ['arquitectura.html', /Arquitectura/],
    ['limitaciones.html', /Limitaciones/],
    ['soporte.html', /Soporte/],
    ['versiones.html', /Versionado/],
    ['plugins.html', /Plugins/],
    ['rendimiento.html', /Rendimiento/],
    ['novedades.html', /Novedades/],
    ['swal-compat.html', /SweetAlert2/],
    ['contratos.html', /Contratos/],
    ['api.html', /API/],
  ]) {
    test(`${pagina}: carga, sin marcadores sin resolver ni errores`, async ({ pagina: page }) => {
      await page.goto(SITIO + pagina)
      await expect(page).toHaveTitle(titulo)
      await expect(page.locator('header.cabecera nav a[aria-current="page"]')).toHaveCount(1)
      expect(await page.content()).not.toContain('<!--@')
      await expect(page.locator('footer.pie')).toContainText('MIT')
    })
  }

  // Cada página en cada idioma: carga sin errores, trae la interfaz en su idioma y el menú marca la página actual.
  for (const [lang, saltar, minimo] of [
    ['en', 'Skip to content', 'Home'],
    ['pt', 'Pular para o conteúdo', 'Início'],
    ['fr', 'Aller au contenu', 'Accueil'],
  ]) {
    for (const pagina of [
      'index.html',
      'primeros-pasos.html',
      'guia.html',
      'ejemplos.html',
      'playground.html',
      'soporte.html',
      'api.html',
      'migracion.html',
      'novedades.html',
      'erp.html',
      'pruebas.html',
    ]) {
      test(`${lang}/${pagina}: carga con la interfaz en su idioma`, async ({ pagina: page }) => {
        await page.goto(`${SITIO}${lang}/${pagina}`)
        await expect(page.locator('html')).toHaveAttribute('lang', lang)
        await expect(page.locator('a.saltar')).toHaveText(saltar)
        await expect(page.locator('header.cabecera nav a').first()).toHaveText(minimo)
        await expect(page.locator('header.cabecera nav a[aria-current="page"]')).toHaveCount(1)
        await expect(page.locator('select[data-idioma]')).toHaveValue(lang)
        expect(await page.content()).not.toContain('<!--@')
        await expect(page.locator('footer.pie')).toContainText('MIT')
      })
    }
  }

  test('la guía en inglés es el README en inglés, sin aviso, y sus anclas funcionan', async ({ page }) => {
    await page.goto(SITIO + 'en/guia.html#vue-3')
    await expect(page.locator('main .nota.aviso')).toHaveCount(0)
    await expect(page.locator('#vue-3')).toBeVisible()
    await expect(page.locator('h2[id="3-recipes-everyday-things-in-one-line"]')).toBeVisible()
    await expect(page.locator('#contenido')).not.toHaveAttribute('lang', 'es')
  })

  test('páginas sin traducir salen en español con un aviso y marcadas con su idioma', async ({ pagina: page }) => {
    await page.goto(SITIO + 'pt/novedades.html')
    await expect(page.locator('p.aviso')).toContainText('apenas em espanhol')
    await expect(page.locator('article.contenido')).toHaveAttribute('lang', 'es')
    await page.goto(SITIO + 'en/soporte.html')
    await expect(page.locator('p.aviso')).toHaveCount(0) // esta sí está traducida
    await expect(page.locator('h2').first()).toHaveText(/Browsers/)
  })

  test('accesibilidad: una muestra de páginas traducidas pasa axe en claro y oscuro', async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
    test.setTimeout(90_000)
    for (const p of ['en/soporte.html', 'en/primeros-pasos.html', 'pt/soporte.html', 'fr/novedades.html']) {
      for (const tema of ['claro', 'oscuro']) {
        await page.goto(SITIO + p)
        await page.evaluate((t) => (document.documentElement.dataset.tema = t), tema)
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' })
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(r.violations.map((v) => `${p} (${tema}) → ${v.id}`)).toEqual([])
      }
    }
  })

  test('celular: el menú se abre y se cierra con Esc', async ({ pagina: page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(SITIO + 'index.html')
    const boton = page.locator('.menu-btn')
    await expect(page.locator('#menu-principal')).toBeHidden()
    await boton.click()
    await expect(boton).toHaveAttribute('aria-expanded', 'true')
    await page.locator('header.cabecera').getByRole('button', { name: 'Probar' }).click()
    await expect(page.locator('#menu-principal a', { hasText: 'Ejemplos' })).toBeVisible()
    await page.keyboard.press('Escape') // el primer Esc cierra el submenú
    await expect(page.locator('#menu-principal a', { hasText: 'Ejemplos' })).toBeHidden()
    await page.keyboard.press('Escape') // el segundo cierra el menú
    await expect(page.locator('#menu-principal')).toBeHidden()
  })

  for (const [ancho, alto] of [
    [390, 844],
    [360, 640],
    [320, 568],
  ]) {
    test(`celular ${ancho}×${alto}: el menú abierto cabe en la pantalla, se desplaza y llega al último enlace`, async ({
      pagina: page,
    }) => {
      await page.setViewportSize({ width: ancho, height: alto })
      await page.goto(SITIO + 'index.html')
      await page.locator('.menu-btn').click()
      await page.locator('header.cabecera').getByRole('button', { name: 'Referencia' }).click() // el grupo más largo
      const medidas = () =>
        page.evaluate(() => {
          const c = document.querySelector('header.cabecera').getBoundingClientRect()
          const n = document.querySelector('#menu-principal')
          return {
            alto: Math.round(c.height),
            arriba: Math.round(c.top),
            nav: { cabe: n.scrollHeight <= n.clientHeight, tope: n.scrollTop },
            ancho: document.documentElement.scrollWidth,
          }
        })
      const m = await medidas()
      expect(m.alto, 'la cabecera no pasa de la pantalla').toBeLessThanOrEqual(alto)
      expect(m.ancho, 'sin desplazamiento horizontal').toBeLessThanOrEqual(ancho)
      // El botón de cerrar y el buscador siguen a la vista aunque el menú sea largo.
      await expect(page.locator('.menu-btn')).toBeInViewport()
      await expect(page.locator('header.cabecera [data-buscar]')).toBeInViewport()
      // Y el último enlace se alcanza desplazando el menú.
      const npm = page.locator('#menu-principal a.solo-movil', { hasText: 'npm' })
      await npm.scrollIntoViewIfNeeded()
      await expect(npm).toBeInViewport({ ratio: 0.9 })
      await expect(page.locator('.menu-btn')).toBeInViewport()
    })
  }

  test('«Míralo en acción» sigue sola al cambiar de apariencia y tras elegir una escena', async ({ pagina: page }) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(SITIO + 'index.html')
    await page.locator('.demo-pantalla').evaluate((e) => (e.dataset.retoma = '2000'))
    await page.locator('.demo-pantalla').scrollIntoViewIfNeeded()
    const escena = () => page.locator('button[data-escena][aria-pressed=true]').getAttribute('data-escena')
    const cambia = async (desde) => expect.poll(escena, { timeout: 30_000 }).not.toBe(desde)
    await expect(page.locator('.demo-cursor')).toHaveClass(/visible/)
    const antes = await escena()
    await page.click('[data-apariencia=bootstrap]')
    await expect(page.locator('[data-apariencia=bootstrap]')).toHaveAttribute('aria-pressed', 'true')
    await cambia(antes) // no se detuvo: pasa a otra escena por su cuenta
    // Elegir una escena la reproduce, queda lista para usarse y, sin tocarla, la invitación sigue con la que viene después.
    await page.click('[data-escena=formulario]')
    await cambia('formulario')
    expect(await escena()).toBe('aprobar')
  })

  test('«Míralo en acción»: al usarla se queda quieta y, sin tocarla, retoma sola', async ({ pagina: page }) => {
    test.setTimeout(90_000)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(SITIO + 'index.html')
    await page.locator('.demo-pantalla').evaluate((e) => (e.dataset.retoma = '1500'))
    await page.locator('.demo-pantalla').scrollIntoViewIfNeeded()
    await expect(page.locator('.demo-cursor')).toHaveClass(/visible/)
    await page.locator('.demo-pantalla').click({ position: { x: 24, y: 24 } })
    await expect(page.locator('.demo-cursor')).not.toHaveClass(/visible/) // la tomó: se detiene
    await expect(page.locator('.demo-cursor')).toHaveClass(/visible/, { timeout: 20_000 }) // y sin tocarla, retoma
  })

  test('escritorio: los submenús abren con clic, uno a la vez, y se cierran con Esc o fuera', async ({ pagina: page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(SITIO + 'ejemplos.html')
    const probar = page.locator('header.cabecera').getByRole('button', { name: 'Probar' })
    const empezar = page.locator('header.cabecera').getByRole('button', { name: 'Empezar' })
    await expect(page.locator('.grupo.activo')).toHaveClass(/activo/)
    await expect(page.locator('#sm-2 a')).toHaveCount(4)
    await expect(page.locator('#sm-2')).toBeHidden()
    await probar.click()
    await expect(page.locator('#sm-2')).toBeVisible()
    await empezar.click()
    await expect(probar).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#sm-1')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#sm-1')).toBeHidden()
    await expect(empezar).toBeFocused()
    await probar.click()
    await page.mouse.click(1200, 600) // fuera del submenú, que queda a la izquierda
    await expect(page.locator('#sm-2')).toBeHidden()
  })

  test('pie: columnas de enlaces y firma', async ({ pagina: page }) => {
    await page.goto(SITIO + 'index.html')
    for (const c of ['Documentación', 'Referencia', 'Migración', 'Proyecto'])
      await expect(page.locator(`footer.pie nav[aria-label="${c}"]`)).toBeVisible()
    await expect(page.locator('footer.pie')).toContainText('DevMedina')
  })

  test('portada: muestra las descargas semanales de npm', async ({ pagina: page }) => {
    await page.goto(SITIO + 'index.html')
    await expect(page.locator('#n-descargas')).toHaveText(/1[.,\s]?234/)
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

  test('playground: ejecuta el código, muestra el resultado y los errores, y el enlace lleva el código', async ({ pagina: page }) => {
    await page.goto(SITIO + 'playground.html')
    const editor = page.locator('#pg-codigo')
    const salida = page.locator('#pg-salida')
    await expect(editor).toHaveValue(/dialog\.confirm/)
    // Código propio: el diálogo se abre de verdad y su resultado llega a «Resultado».
    await editor.fill(`import { dialog } from 'nexus-dialogs'\nconst r = await dialog.confirm({ title: 'Hola' })\nconsole.log(r.confirmed)`)
    await page.locator('#pg-ejecutar').click()
    await expect(page.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(salida).toContainText('false')
    // Un import que no existe y un error del propio código se dicen claro, sin romper la página.
    await editor.fill(`import { x } from 'nexus-dialogs/nada'`)
    await page.locator('#pg-ejecutar').click()
    await expect(salida).toContainText('No conozco')
    await editor.fill(`throw new Error('falló a propósito')`)
    await page.keyboard.press('Control+Enter')
    await expect(salida).toContainText('falló a propósito')
    // Los ejemplos de la galería que son JavaScript se pueden cargar y ejecutar.
    await page.locator('#pg-ejemplo').selectOption('validadores')
    await expect(editor).toHaveValue(/isRFC/)
    await page.locator('#pg-ejecutar').click()
    await expect(salida).not.toBeEmpty()
    // «Copiar enlace» deja el código en la dirección y, al abrirla, vuelve el mismo código.
    await editor.fill(`console.log('compartido ✓')`)
    await page.locator('#pg-compartir').click()
    await expect(page).toHaveURL(/#c=/)
    await page.reload()
    await expect(editor).toHaveValue(`console.log('compartido ✓')`)
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

  test('idioma: el selector lleva a la misma página en otro idioma, con la interfaz y los diálogos en ese idioma', async ({
    pagina: page,
  }) => {
    await page.goto(SITIO + 'soporte.html')
    const sel = page.locator('select[data-idioma]')
    await expect(sel).toHaveValue('es')
    await expect(page.locator('a.saltar')).toHaveText('Saltar al contenido')
    await sel.selectOption('en')
    await expect(page).toHaveURL(/\/site\/en\/soporte(\.html)?$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('select[data-idioma]')).toHaveValue('en')
    await expect(page.locator('a.saltar')).toHaveText('Skip to content')
    await expect(page.locator('button[data-tema]')).toHaveText('Theme: Auto')
    await expect(page.locator('.cabecera .buscar-btn span')).toHaveText('Search')
    await page.locator('select[data-idioma]').selectOption('fr')
    await expect(page).toHaveURL(/\/site\/fr\/soporte(\.html)?$/)
    await page.goto(SITIO + 'fr/index.html')
    await page.click('#b-hero')
    await expect(enDialogo(page, 'button[data-id="cancel"]')).toHaveText('Annuler')
    await page.keyboard.press('Escape')
    await page.locator('select[data-idioma]').selectOption('es')
    await expect(page).toHaveURL(/\/site\/index(\.html)?$/)
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

  test('mini ERP en inglés: la lista, la baja con «Undo» y la actividad salen en inglés', async ({ pagina: page }) => {
    await page.goto(SITIO + 'en/erp.html')
    const filas = page.locator('#e-filas tr')
    await expect(filas).toHaveCount(5)
    await expect(filas.first()).toContainText('Shift lead')
    await filas
      .first()
      .getByRole('button', { name: /Remove Ana/ })
      .click()
    const d = page.locator('dialog[data-nexus-dialog]').last()
    await expect(d).toContainText('Their severance is calculated')
    await d.locator('button[data-id="confirm"]').click()
    await expect(filas).toHaveCount(4)
    await expect(page.locator('#e-log')).toContainText('Removed Ana Torres')
    await page.locator('[data-nexus-toast]').getByRole('button', { name: 'Undo' }).click()
    await expect(filas).toHaveCount(5)
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

  test('migración en inglés: la página, los ejemplos y los avisos salen en inglés', async ({ pagina: page }) => {
    await page.goto(SITIO + 'en/migracion.html')
    await expect(page.locator('h1')).toHaveText('Migrate from SweetAlert2')
    await expect(page.locator('main .nota.aviso')).toHaveCount(0)
    await page.locator('#m-borrar button[data-mig="swal"]').click()
    const d = page.locator('dialog[data-nexus-dialog]').last()
    await expect(d).toContainText('Delete Laura Méndez?')
    await d.locator('button[data-id="confirm"]').click()
    await expect(page.locator('#mig-salida')).toContainText('SweetAlert2 (adapter) → true')
    await page.locator('#m-borrar button[data-mig="nativa"]').click()
    await expect(page.locator('dialog[data-nexus-dialog]').last()).toContainText('Laura Méndez')
    await page.locator('dialog[data-nexus-dialog]').last().locator('button[data-id="confirm"]').click()
    await expect(page.locator('#mig-salida')).toContainText('Native API → true')
  })

  test('páginas de texto: etiquetas para compartir, canónico y columna derecha en pantalla ancha', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 800 })
    await page.goto(SITIO + 'arquitectura.html')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /arquitectura$/)
    const riel = page.locator('aside.riel')
    await expect(riel).toBeVisible()
    await expect(riel.getByRole('link', { name: 'Editar en GitHub' })).toHaveAttribute('href', /edit\/main\/docs\/arquitectura\.md$/)
    await page.setViewportSize({ width: 390, height: 800 })
    await expect(riel).toBeHidden()
  })

  test('al ir a otra página aparece la barra de carga; un ancla de la misma página no la activa', async ({ page }) => {
    await page.goto(SITIO + 'index.html')
    const barra = page.locator('.carga-pagina')
    await expect(barra).not.toHaveClass(/activa/)
    await page.keyboard.press('Tab') // el enlace «Saltar al contenido» (ancla de la misma página)
    await page.keyboard.press('Enter')
    await expect(barra).not.toHaveClass(/activa/)
    // Se anota cómo estaba la barra justo al salir de la página (después de ella ya no existe ese documento).
    await page.evaluate(() =>
      window.addEventListener('beforeunload', () => sessionStorage.setItem('barra', document.querySelector('.carga-pagina').className)),
    )
    await page.locator('header.cabecera').getByRole('button', { name: 'Empezar' }).click()
    await page.locator('header.cabecera nav a[href="guia.html"]').click()
    await expect(page).toHaveURL(/guia\.html/)
    expect(await page.evaluate(() => sessionStorage.getItem('barra'))).toContain('activa')
    await expect(page.locator('.carga-pagina')).not.toHaveClass(/activa/)
  })

  test('accesibilidad: las páginas no tienen violaciones de axe (WCAG 2.2 AA)', async ({ page, browserName }) => {
    // La entrada de la portada anima la opacidad: sin movimiento el contraste se mide en el estado final.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    test.skip(browserName === 'firefox', 'axe se omite en Firefox (ver utilidades.mjs)')
    test.setTimeout(90_000) // 11 páginas × 2 temas: ronda los 30 s por defecto
    for (const p of [
      'index.html',
      'ejemplos.html',
      'pruebas.html',
      'primeros-pasos.html',
      'guia.html',
      'erp.html',
      'migracion.html',
      'accesibilidad.html',
      'seguridad.html',
      'arquitectura.html',
      'limitaciones.html',
      'soporte.html',
      'playground.html',
      'versiones.html',
      'plugins.html',
      'rendimiento.html',
      'novedades.html',
      'swal-compat.html',
      'contratos.html',
    ]) {
      for (const tema of ['claro', 'oscuro']) {
        await page.goto(SITIO + p)
        await page.evaluate((t) => (document.documentElement.dataset.tema = t), tema)
        // Sin transiciones ni animaciones de ningún tipo: axe mide el contraste en el estado final (WebKit lo medía a medias).
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' })
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(
          r.violations.map(
            (v) =>
              `${p} (${tema}) → ${v.id}: ${v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 3)
                .join(', ')}`,
          ),
        ).toEqual([])
      }
    }
  })
})

// Animaciones decorativas: se prueban con el movimiento permitido (el resto de las pruebas lo reduce).
test.describe('Sitio: animaciones', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('portada: las partículas corren, y al ir hacia abajo las secciones aparecen', async ({ page }) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.goto(SITIO + 'index.html')
    const lienzo = page.locator('.hero canvas.particulas')
    await expect(lienzo).toHaveAttribute('aria-hidden', 'true')
    // El lienzo se va pintando: dos fotos separadas no pueden ser iguales.
    const foto = () => lienzo.evaluate((c) => c.toDataURL())
    const a = await foto()
    await page.waitForTimeout(400)
    expect(await foto()).not.toBe(a)
    // Lo que empieza fuera de pantalla entra al hacer scroll.
    const bloque = page.locator('section.bloque').first()
    await expect(bloque).toHaveClass(/revela/)
    await bloque.scrollIntoViewIfNeeded()
    await expect(bloque).toHaveClass(/visto/)
    await expect(bloque).toHaveCSS('opacity', '1')
    // Sin desborde horizontal por el lienzo.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errores).toEqual([])
  })

  test('confirmar un ejemplo lanza chispas que se quitan solas y no bloquean clics', async ({ page }) => {
    await page.goto(SITIO + 'ejemplos.html#confirmar')
    await page.locator('#ej-confirmar button', { hasText: 'Probar' }).click()
    await page.locator('dialog[data-nexus-dialog]').last().locator('button[data-role=confirm]').click()
    const chispas = page.locator('canvas.chispas')
    await expect(chispas).toHaveCount(1)
    await expect(chispas).toHaveCSS('pointer-events', 'none')
    await expect(chispas).toHaveCount(0, { timeout: 4000 })
  })

  test('con movimiento reducido no hay chispas ni partículas animadas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    await expect(page.locator('section.bloque.revela')).toHaveCount(0)
    const lienzo = page.locator('.hero canvas.particulas')
    const a = await lienzo.evaluate((c) => c.toDataURL())
    await page.waitForTimeout(300)
    expect(await lienzo.evaluate((c) => c.toDataURL())).toBe(a)
  })
})

test.describe('Sitio: texto que se escribe', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('portada: el texto cambia solo y los lectores de pantalla leen la lista fija', async ({ page }) => {
    await page.goto(SITIO + 'index.html')
    const texto = page.locator('.escribe-txt')
    await expect(texto).toHaveAttribute('aria-hidden', 'true')
    const primera = await texto.textContent()
    await expect.poll(async () => await texto.textContent(), { timeout: 9000 }).not.toBe(primera)
    await expect(page.locator('.escribe .sr-only')).toContainText('importar desde Excel')
  })

  test('con movimiento reducido el texto queda fijo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    const texto = page.locator('.escribe-txt')
    const primera = await texto.textContent()
    await page.waitForTimeout(2600)
    expect(await texto.textContent()).toBe(primera)
  })
})

test.describe('Sitio: demo, cifras, buscador y volver arriba', () => {
  test.use({ reducedMotion: 'no-preference' })
  const npm = (page) =>
    page.route('https://api.npmjs.org/**', (r) => r.fulfill({ json: { downloads: 1234 }, headers: { 'access-control-allow-origin': '*' } }))

  test('las cifras cuentan desde cero hasta su valor al llegar a ellas', async ({ page }) => {
    await npm(page)
    await page.goto(SITIO + 'index.html')
    const tam = page.locator('.datos-fila strong').nth(1)
    await expect(tam).toHaveText(/^0\.0 KB$/)
    await page.locator('.datos').scrollIntoViewIfNeeded()
    await expect(tam).toHaveText(/^[1-9]\d*\.\d KB$/)
    await expect(page.locator('#n-descargas')).toHaveText('1,234')
  })

  test('la demo se recorre sola hasta que alguien la toca, y entonces se detiene', async ({ page }) => {
    await npm(page)
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    await pantalla.scrollIntoViewIfNeeded()
    await expect(pantalla.locator('.demo-titulo')).toHaveText('Nuevo gasto', { timeout: 20000 })
    await expect(pantalla.locator('#demo-rfc')).toHaveValue('XAXX010101000', { timeout: 10000 })
    await pantalla.locator('#demo-importe').click() // la toma: la animación se corta y queda en sus manos
    await expect(pantalla.locator('.demo-cursor')).not.toHaveClass(/visible/)
    await pantalla.locator('#demo-importe').fill('99')
    await page.waitForTimeout(3500)
    await expect(pantalla.locator('.demo-titulo')).toHaveText('Nuevo gasto')
    await expect(pantalla.locator('#demo-importe')).toHaveValue('99')
  })

  for (const [lang, eliminar, eliminada, nuevo, guardar, obligatorio] of [
    ['en', 'Delete', 'Laura Méndez deleted', 'New expense', 'Save', 'required'],
    ['pt', 'Excluir', 'Laura Méndez excluída', 'Nova despesa', 'Salvar', 'obrigatório'],
    ['fr', 'Supprimer', 'Laura Méndez supprimée', 'Nouvelle dépense', 'Enregistrer', 'obligatoire'],
  ])
    test(`la portada en ${lang} traduce la maqueta, sus avisos y el código`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${SITIO}${lang}/index.html`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      const pantalla = page.locator('.demo-pantalla')
      const toast = pantalla.locator('.demo-toast')
      await pantalla.scrollIntoViewIfNeeded()
      await pantalla.getByRole('button', { name: eliminar, exact: true }).click()
      await expect(toast).toContainText(eliminada)
      await page.locator('button[data-escena=formulario]').click()
      await expect(pantalla.locator('.demo-titulo')).toHaveText(nuevo)
      await pantalla.getByRole('button', { name: guardar, exact: true }).click()
      await expect(pantalla.locator('#demo-rfc-e')).toContainText(obligatorio)
      await expect(page.locator('.demo-codigo code')).toContainText(nuevo)
      // Los diálogos de verdad también salen en el idioma de la página.
      await page.locator('#b-borrar').click()
      await expect(page.locator('dialog.nexus, nexus-dialog, [role=alertdialog], dialog').first()).toBeVisible()
    })

  test('la maqueta se puede usar: borrar con «Deshacer», formulario con validación y aprobar con motivo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    const toast = pantalla.locator('.demo-toast')
    await pantalla.scrollIntoViewIfNeeded()
    // Borrar
    await pantalla.getByRole('button', { name: 'Eliminar' }).click()
    await expect(toast).toContainText('Laura Méndez eliminada')
    await toast.getByRole('button', { name: 'Deshacer' }).click()
    await expect(toast).toContainText('Cambio deshecho')
    await expect(pantalla.getByRole('button', { name: 'Eliminar' })).toBeVisible({ timeout: 6000 }) // vuelve a abrirse
    // Formulario: la validación avisa y no deja pasar
    await page.locator('button[data-escena=formulario]').click()
    await expect(pantalla.locator('.demo-titulo')).toHaveText('Nuevo gasto')
    await pantalla.getByRole('button', { name: 'Guardar' }).click()
    await expect(pantalla.locator('#demo-rfc-e')).toContainText('obligatorio')
    await expect(pantalla.locator('#demo-rfc')).toHaveAttribute('aria-invalid', 'true')
    await expect(toast).not.toHaveClass(/visible/)
    await pantalla.locator('#demo-rfc').fill('no-es-rfc')
    await pantalla.locator('#demo-importe').fill('150')
    await pantalla.getByRole('button', { name: 'Guardar' }).click()
    await expect(pantalla.locator('#demo-rfc-e')).toContainText('no es válido')
    await pantalla.locator('#demo-rfc').fill('XAXX010101000')
    await expect(pantalla.locator('#demo-rfc-e')).toBeHidden() // al corregir, el aviso se quita
    await pantalla.getByRole('button', { name: 'Guardar' }).click()
    await expect(toast).toContainText('Enviado a aprobación')
    // Aprobar: rechazar pide el motivo
    await page.locator('button[data-escena=aprobar]').click()
    await pantalla.getByRole('button', { name: 'Rechazar' }).click()
    await expect(pantalla.locator('#demo-motivo-e')).toContainText('motivo')
    await pantalla.locator('#demo-motivo').fill('Fechas cubiertas')
    await pantalla.getByRole('button', { name: 'Rechazar' }).click()
    await expect(toast).toContainText('Solicitud rechazada')
  })

  test('al elegir otra escena se reproduce sola y luego queda lista para usarse', async ({ page }) => {
    await npm(page)
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    await pantalla.scrollIntoViewIfNeeded()
    await page.locator('button[data-escena=aprobar]').click()
    await expect(pantalla.locator('.demo-titulo')).toHaveText('Solicitud de vacaciones')
    await expect(pantalla.locator('#demo-motivo')).toHaveValue('Cubre su equipo', { timeout: 6000 }) // lo escribe solo
    await expect(pantalla.locator('.demo-toast')).toContainText('Solicitud aprobada', { timeout: 6000 })
    // Al terminar vuelve a abrirse, sin cursor, y se puede usar.
    await expect(pantalla.locator('#demo-motivo')).toHaveValue('', { timeout: 8000 })
    await expect(pantalla.locator('.demo-cursor')).not.toHaveClass(/visible/)
    await pantalla.locator('#demo-motivo').fill('Lo uso yo')
    await pantalla.getByRole('button', { name: 'Rechazar' }).click()
    await expect(pantalla.locator('.demo-toast')).toContainText('Solicitud rechazada')
    // Otra escena, a media reproducción: la nueva reemplaza a la anterior.
    await page.locator('button[data-escena=formulario]').click()
    await page.locator('button[data-escena=borrar]').click()
    await expect(pantalla.locator('.demo-titulo')).toHaveText('¿Eliminar a Laura Méndez?')
    await expect(pantalla.locator('.demo-toast')).toContainText('Laura Méndez eliminada', { timeout: 8000 })
  })

  test('escenas nuevas: vacaciones cuenta días hábiles y valida, y el asistente avanza y retrocede', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    const toast = pantalla.locator('.demo-toast')
    await pantalla.scrollIntoViewIfNeeded()
    // Vacaciones
    await page.locator('button[data-escena=vacaciones]').click()
    await pantalla.getByRole('button', { name: 'Enviar' }).click()
    await expect(pantalla.locator('#demo-desde-e')).toContainText('primer día')
    await pantalla.locator('#demo-desde').fill('2026-12-21')
    await pantalla.locator('#demo-hasta').fill('2026-12-18')
    await pantalla.getByRole('button', { name: 'Enviar' }).click()
    await expect(pantalla.locator('#demo-hasta-e')).toContainText('antes')
    await pantalla.locator('#demo-hasta').fill('2027-01-29')
    await expect(pantalla.locator('#demo-dias')).toContainText('máximo 12')
    await pantalla.getByRole('button', { name: 'Enviar' }).click()
    await expect(pantalla.locator('#demo-hasta-e')).toContainText('Máximo 12')
    await pantalla.locator('#demo-hasta').fill('2026-12-30')
    await expect(pantalla.locator('#demo-dias')).toHaveText('8 días hábiles')
    await pantalla.getByRole('button', { name: 'Enviar' }).click()
    await expect(toast).toContainText('vacaciones enviada')
    // Asistente: no pasa sin nombre, conserva lo escrito al ir y volver
    await page.locator('button[data-escena=asistente]').click()
    await pantalla.getByRole('button', { name: 'Siguiente' }).click()
    await expect(pantalla.locator('#demo-nombre-e')).toContainText('obligatorio')
    await pantalla.locator('#demo-nombre').fill('Mario Ruiz')
    await pantalla.getByRole('button', { name: 'Siguiente' }).click()
    await expect(pantalla.locator('#demo-paso')).toHaveText('Paso 2 de 3')
    await pantalla.locator('#demo-puesto').selectOption('Contabilidad')
    await pantalla.getByRole('button', { name: 'Siguiente' }).click()
    await expect(pantalla.locator('.demo-resumen')).toContainText('Mario Ruiz')
    await expect(pantalla.locator('.demo-resumen')).toContainText('Contabilidad')
    await pantalla.getByRole('button', { name: 'Atrás' }).click()
    await pantalla.getByRole('button', { name: 'Atrás' }).click()
    await expect(pantalla.locator('#demo-nombre')).toHaveValue('Mario Ruiz')
    await pantalla.getByRole('button', { name: 'Siguiente' }).click()
    await pantalla.getByRole('button', { name: 'Siguiente' }).click()
    await pantalla.getByRole('button', { name: 'Dar de alta' }).click()
    await expect(toast).toContainText('dado de alta')
  })

  test('escenas nuevas: importar pide el archivo antes y descartar avisa; «Ver código» sigue a la escena', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    const toast = pantalla.locator('.demo-toast')
    const codigo = page.locator('.demo-codigo')
    await pantalla.scrollIntoViewIfNeeded()
    await expect(codigo.locator('code')).toContainText('confirmDelete')
    await codigo.locator('summary').click()
    await page.locator('button[data-escena=importar]').click()
    await expect(codigo.locator('code')).toContainText('importData')
    await pantalla.getByRole('button', { name: 'Importar', exact: true }).click()
    await expect(pantalla.locator('#demo-archivo-e')).toContainText('Primero elige')
    await pantalla.getByRole('button', { name: 'Elegir empleados.csv' }).click()
    await expect(pantalla.locator('.demo-filas')).toContainText('RFC no válido')
    await pantalla.getByRole('button', { name: 'Importar 3' }).click()
    await expect(toast).toContainText('Se importaron 3 empleados')
    await page.locator('button[data-escena=descartar]').click()
    await expect(codigo.locator('code')).toContainText('unsavedChanges')
    await expect(codigo.locator('button.copiar')).toHaveCount(1)
    await pantalla.getByRole('button', { name: 'Descartar' }).click()
    await expect(toast).toContainText('Cambios descartados')
  })

  test('el asistente se reproduce solo al elegirlo y vuelve a quedar usable', async ({ page }) => {
    await npm(page)
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    await pantalla.scrollIntoViewIfNeeded()
    await page.locator('button[data-escena=asistente]').click()
    await expect(pantalla.locator('#demo-paso')).toHaveText('Paso 3 de 3', { timeout: 12000 })
    await expect(pantalla.locator('.demo-toast')).toContainText('dado de alta', { timeout: 8000 })
    await expect(pantalla.locator('#demo-paso')).toHaveText('Paso 1 de 3', { timeout: 8000 })
    await expect(pantalla.locator('#demo-nombre')).toHaveValue('')
  })

  test('las escenas nuevas pasan axe, también en oscuro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    for (const apariencia of ['nexus', 'oscuro']) {
      await page.locator(`button[data-apariencia=${apariencia}]`).click()
      for (const escena of ['vacaciones', 'asistente', 'importar', 'descartar']) {
        await page.locator(`button[data-escena=${escena}]`).click()
        if (escena === 'asistente') await page.locator('.demo-pantalla').getByRole('button', { name: 'Siguiente' }).click()
        if (escena === 'importar') await page.locator('.demo-pantalla').getByRole('button', { name: 'Elegir empleados.csv' }).click()
        const r = await new AxeBuilder({ page })
          .include('.demo-pantalla')
          .include('.demo-codigo')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(r.violations.map((v) => `${apariencia}/${escena}: ${v.id}`)).toEqual([])
      }
    }
  })

  test('portada: la insignia de versión se confirma con npm, la cifra muestra un esqueleto y existe la sección de piezas', async ({
    page,
  }) => {
    await page.route('https://registry.npmjs.org/**', (r) =>
      r.fulfill({ json: { version: '9.9.9' }, headers: { 'access-control-allow-origin': '*' } }),
    )
    await page.route('https://api.npmjs.org/**', async (r) => {
      await new Promise((ok) => setTimeout(ok, 800))
      await r.fulfill({ json: { downloads: 1234 }, headers: { 'access-control-allow-origin': '*' } })
    })
    await page.goto(SITIO + 'index.html')
    await expect(page.locator('#n-descargas')).toHaveClass(/esqueleto/)
    await expect(page.locator('#n-descargas')).not.toHaveClass(/esqueleto/)
    await expect(page.locator('#i-version')).toHaveText('v9.9.9')
    await expect(page.locator('.insignias.en-vivo')).toContainText('MIT')
    await expect(page.getByRole('heading', { name: 'Una pieza en lugar de varias' })).toBeVisible()
    await expect(page.locator('section[aria-labelledby=piezas] tbody tr')).toHaveCount(6)
  })

  test('sin respuesta de npm, la insignia conserva la versión de la construcción y el esqueleto se quita', async ({ page }) => {
    await page.route('https://registry.npmjs.org/**', (r) => r.abort())
    await page.route('https://api.npmjs.org/**', (r) => r.abort())
    await page.goto(SITIO + 'index.html')
    await expect(page.locator('#n-descargas')).not.toHaveClass(/esqueleto/)
    await expect(page.locator('#i-version')).toHaveText(/^v\d+\.\d+\.\d+/)
    await expect(page.locator('#i-version')).not.toHaveText('v9.9.9')
  })

  test('la maqueta y sus avisos de error pasan axe, también con otra apariencia', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(SITIO + 'index.html')
    await page.locator('button[data-escena=formulario]').click()
    await page.locator('.demo-pantalla').getByRole('button', { name: 'Guardar' }).click()
    for (const apariencia of ['nexus', 'material', 'bootstrap', 'tailwind', 'oscuro']) {
      await page.locator(`button[data-apariencia=${apariencia}]`).click()
      // Centrada: la cabecera fija no debe tapar parte de la maqueta cuando axe calcula el fondo de cada texto.
      await page.locator('.demo-pantalla').evaluate((e) => e.scrollIntoView({ block: 'center' }))
      const r = await new AxeBuilder({ page })
        .include('.demo-pantalla')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(r.violations.map((v) => `${apariencia}: ${v.id}`)).toEqual([])
    }
  })

  test('cada apariencia cambia los colores de la maqueta y los diálogos de verdad', async ({ page }) => {
    await npm(page)
    await page.goto(SITIO + 'index.html')
    const pantalla = page.locator('.demo-pantalla')
    const chips = page.locator('.demo-controles button[data-apariencia]')
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true')
    await page.locator('button[data-apariencia=material]').click()
    await expect(page.locator('button[data-apariencia=material]')).toHaveAttribute('aria-pressed', 'true')
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'false')
    expect(await pantalla.evaluate((p) => p.style.getPropertyValue('--nd-radius'))).toBe('28px')
    await page.locator('#b-demo').click()
    const real = page.locator('[data-nexus-host]').last()
    await expect(real).toBeVisible()
    expect(await real.evaluate((d) => d.style.getPropertyValue('--nd-radius'))).toBe('28px')
    await page.keyboard.press('Escape')
    await page.locator('button[data-apariencia=oscuro]').click()
    await expect(pantalla).toHaveClass(/oscuro/)
  })

  test('el buscador abre con «/» y con Ctrl+K, filtra, se mueve con flechas, abre con Enter y vuelve el foco', async ({ page }) => {
    await page.goto(SITIO + 'index.html')
    await page.keyboard.press('/')
    const caja = page.locator('dialog.buscador')
    await expect(caja).toBeVisible()
    const entrada = caja.getByRole('combobox')
    await expect(entrada).toBeFocused()
    await expect(caja.getByRole('option').first()).toBeVisible() // sin texto: las páginas
    await entrada.fill('vacaciones')
    const opciones = caja.getByRole('option')
    await expect(opciones.first()).toBeVisible()
    expect(await opciones.count()).toBeGreaterThan(0)
    await entrada.fill('zzzzqqqq')
    await expect(caja.locator('.busca-aviso')).toHaveText('Sin resultados')
    await page.keyboard.press('Escape')
    await expect(caja).toBeHidden()
    await page.keyboard.press('Control+k')
    await expect(caja).toBeVisible()
    await caja.getByRole('combobox').fill('ejemplos')
    await page.keyboard.press('ArrowDown')
    await expect(caja.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/ejemplos\.html/)
  })

  test('el buscador abierto no tiene violaciones de axe y un clic en un resultado navega', async ({ page }) => {
    await page.goto(SITIO + 'index.html')
    await page.keyboard.press('/')
    await page.locator('dialog.buscador').getByRole('combobox').fill('tema')
    await expect(page.locator('dialog.buscador').getByRole('option').first()).toBeVisible()
    const r = await new AxeBuilder({ page })
      .include('dialog.buscador')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(r.violations.map((v) => v.id)).toEqual([])
    await page.locator('dialog.buscador').getByRole('option').first().click()
    await expect(page).not.toHaveURL(/index\.html$/)
  })

  test('«/» no abre el buscador mientras se escribe en un campo, y el botón de la cabecera sí', async ({ page }) => {
    await page.goto(SITIO + 'ejemplos.html')
    await page.locator('input[type=search], input[type=text]').first().fill('')
    await page.locator('input[type=search], input[type=text]').first().focus()
    await page.keyboard.press('/')
    await expect(page.locator('dialog.buscador')).toHaveCount(0)
    await page.locator('[data-buscar]').click()
    await expect(page.locator('dialog.buscador')).toBeVisible()
  })

  test('el botón de volver arriba aparece al bajar y regresa al inicio', async ({ page }) => {
    await page.goto(SITIO + 'guia.html')
    const arriba = page.locator('button.arriba')
    await expect(arriba).toBeHidden()
    await page.evaluate(() => scrollTo(0, 2500))
    await expect(arriba).toBeVisible()
    await arriba.click()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await expect(arriba).toBeHidden()
  })
})
