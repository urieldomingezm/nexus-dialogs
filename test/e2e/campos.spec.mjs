import { axe, boton, enDialogo, expect, resultado, test } from './utilidades.mjs'

test.describe('campos avanzados', () => {
  test('combobox: la barra de desplazamiento del modal y de la lista está siempre visible (no se oculta)', async ({ pagina: p }) => {
    await p.click('#c-combo')
    await p.keyboard.type('a')
    await expect(enDialogo(p, '[role=option]').first()).toBeVisible()
    // Con `::-webkit-scrollbar` los navegadores de WebKit/Chromium usan la barra clásica fija en lugar de la que se oculta sola.
    const ancho = (q) =>
      enDialogo(p, q)
        .first()
        .evaluate((e) => getComputedStyle(e, '::-webkit-scrollbar').width)
    if (p.context().browser()?.browserType().name() !== 'firefox') {
      expect(await ancho('.cb-list')).toBe('12px')
      expect(await ancho('.body')).toBe('12px')
    }
  })

  test('combobox: teclado completo, Esc cierra solo la lista y axe', async ({ pagina: p }) => {
    await p.click('#c-combo')
    const cliente = enDialogo(p, '[role=combobox]').first()
    await expect(cliente).toBeFocused()
    await p.keyboard.type('ace')
    await expect(enDialogo(p, '[role=option]').first()).toContainText('Aceros del Norte')
    await expect(cliente).toHaveAttribute('aria-expanded', 'true')
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('Escape')
    await expect(cliente).toHaveAttribute('aria-expanded', 'false')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await p.keyboard.type('ace')
    await expect(enDialogo(p, '[role=option]').first()).toContainText('Aceros del Norte')
    await p.keyboard.press('Enter')
    await expect(cliente).toHaveValue('Aceros del Norte')
    const equipo = enDialogo(p, '[role=combobox]').nth(1)
    await equipo.click()
    await p.keyboard.type('marta')
    await p.keyboard.press('Enter')
    await expect(enDialogo(p, '.cb-chips li')).toHaveCount(2)
    await p.keyboard.press('Escape')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({ confirmed: true, value: { cliente: 'Aceros del Norte', equipo: ['ana', 'marta'] } })
  })

  test('archivos: subir con progreso, error y reintento', async ({ pagina: p }) => {
    await p.click('#c-file')
    await enDialogo(p, 'input[type=file]')
      .first()
      .setInputFiles([
        { name: 'ine-frente.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(2000) },
        { name: 'ine-error.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2000) },
      ])
    await expect(enDialogo(p, '.files li.error')).toContainText('el servidor rechazó el archivo')
    expect(await axe(p)).toEqual([])
    await expect(enDialogo(p, '.files li.error button').first()).toHaveText('Reintentar')
    await enDialogo(p, '.files li.error .btn-cancel').click()
    await expect(enDialogo(p, '.files li')).toHaveCount(1)
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({ confirmed: true, value: { ine: ['id-ine-frente.jpg'] } })
  })

  test('rango de fechas: atajos y axe', async ({ pagina: p }) => {
    await p.click('#c-range')
    expect(await axe(p)).toEqual([])
    await enDialogo(p, '.preset').filter({ hasText: 'Quincena actual' }).click()
    await expect(enDialogo(p, '.preset[aria-pressed=true]')).toHaveText('Quincena actual')
    await boton(p, 'confirm').click()
    const r = await resultado(p)
    expect(r.confirmed).toBe(true)
    expect(r.value.periodo.from).toMatch(/^\d{4}-\d{2}-(01|16)$/)
  })

  test('código: escribir los dígitos envía solo', async ({ pagina: p }) => {
    await p.click('#c-otp')
    await expect(enDialogo(p, '.otp-input')).toBeFocused()
    expect(await axe(p)).toEqual([])
    await p.keyboard.type('123456')
    expect(await resultado(p)).toMatchObject({ confirmed: true, value: { codigo: '123456' } })
  })

  test('partidas: agregar, totales, validación por fila y axe', async ({ pagina: p }) => {
    await p.click('#c-items')
    await p.keyboard.type('PEM840101AB3')
    await p.keyboard.press('Tab')
    await p.keyboard.type('Hojas carta')
    await p.keyboard.press('Tab')
    await p.keyboard.press('Control+A')
    await p.keyboard.type('3')
    await p.keyboard.press('Tab')
    await p.keyboard.type('689')
    await p.keyboard.press('Tab')
    await expect(enDialogo(p, '.totals dd').last()).toHaveText('$ 2,397.72')
    await enDialogo(p, '.rows-foot button').click()
    await boton(p, 'confirm').click()
    await expect(enDialogo(p, '.summary')).toContainText('Partidas')
    expect(await axe(p)).toEqual([])
    await enDialogo(p, '.row[role=group] .btn-cancel').last().click()
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({
      confirmed: true,
      value: { rfc: 'PEM840101AB3', partidas: [{ concepto: 'Hojas carta', cantidad: 3, precio: 689, iva: '0.16' }] },
    })
  })
})
