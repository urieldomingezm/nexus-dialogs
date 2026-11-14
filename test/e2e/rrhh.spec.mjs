import { axe, boton, enDialogo, expect, resultado, test } from './utilidades.mjs'

test.describe('RR. HH.', () => {
  test('calendario: elegir el rango con el teclado, con axe', async ({ pagina: p }) => {
    await p.click('#h-vacaciones')
    const desde = enDialogo(p, '.dr-inputs input').first()
    await expect(desde).toBeFocused()
    await desde.fill('07/12/2026')
    await enDialogo(p, '.cal-day[data-d="2026-12-07"]').focus()
    await p.keyboard.press('Enter')
    await p.keyboard.press('ArrowRight')
    await p.keyboard.press('ArrowRight')
    await p.keyboard.press('ArrowDown')
    await p.keyboard.press('Enter')
    await expect(enDialogo(p, '.dr-inputs input').nth(1)).toHaveValue('16/12/2026')
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({ confirmed: true, value: { dias: { from: '2026-12-07', to: '2026-12-16' } } })
  })

  test('firma con el mouse', async ({ pagina: p }) => {
    await p.click('#h-firma')
    const lienzo = enDialogo(p, 'canvas.sig-pad')
    const caja = await lienzo.boundingBox()
    await p.mouse.move(caja.x + 30, caja.y + 80)
    await p.mouse.down()
    for (let i = 1; i <= 10; i++) await p.mouse.move(caja.x + 30 + i * 20, caja.y + 80 + (i % 2 ? -25 : 25))
    await p.mouse.up()
    await expect(enDialogo(p, '.sig')).toHaveClass(/has/)
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    const r = await resultado(p)
    expect(r.value.firma).toMatch(/^data:image\/png;base64,/)
  })

  test('importar CSV: columnas relacionadas solas y errores por fila', async ({ pagina: p }) => {
    await p.click('#h-importar')
    await enDialogo(p, 'input[type=file]').setInputFiles({
      name: 'empleados.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Num,Empleado,RFC,Fecha de ingreso,Salario diario\n1,Ana Torres,XAXX010101000,01/02/2024,"1,200.50"\n2,Leo,MAL,,300\n',
      ),
    })
    await expect(enDialogo(p, '.map')).toBeVisible()
    expect(await axe(p)).toEqual([])
    await boton(p, 'next').click()
    await expect(enDialogo(p, '.stats .ok b')).toHaveText('1')
    await expect(enDialogo(p, '.errs')).toContainText('Fila 3 · RFC no es válido')
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({
      confirmed: true,
      value: { rows: [{ numero: '1', nombre: 'Ana Torres', rfc: 'XAXX010101000', ingreso: '2024-02-01', salario: 1200.5 }] },
    })
  })

  test('elegir empleados de una lista grande', async ({ pagina: p }) => {
    await p.click('#h-elegir')
    const buscador = enDialogo(p, 'input[type=search]')
    await expect(buscador).toBeFocused()
    await p.keyboard.type('sofia')
    await expect(enDialogo(p, '.pager span')).toHaveText('1–25 de 60')
    await enDialogo(p, 'tbody tr').first().click()
    await enDialogo(p, 'tbody tr').nth(1).locator('input').check()
    await expect(enDialogo(p, '.pick-count')).toHaveText('2 seleccionados')
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    const r = await resultado(p)
    expect(r.value.map((e) => e.nombre)).toEqual(['Sofía Ruiz 5', 'Sofía Ruiz 13'])
  })

  test('domicilio con el catálogo SEPOMEX servido como archivos', async ({ pagina: p }) => {
    await p.click('#h-sepomex')
    await enDialogo(p, 'input[name="dom.postalCode"]').fill('44100')
    await expect(enDialogo(p, 'input[name="dom.state"]')).toHaveValue('Jalisco')
    await expect(enDialogo(p, 'input[name="dom.neighborhood"]')).toHaveValue('Centro')
  })
})

test('importar un .xlsx real (fechas con formato y acentos)', async ({ pagina: p }) => {
  await p.click('#h-importar')
  await enDialogo(p, 'input[type=file]').setInputFiles('test/fixtures/empleados.xlsx')
  await expect(enDialogo(p, '.map')).toBeVisible()
  await boton(p, 'next').click()
  await expect(enDialogo(p, '.stats .ok b')).toHaveText('2')
  await boton(p, 'confirm').click()
  expect(await resultado(p)).toMatchObject({
    confirmed: true,
    value: {
      rows: [
        { numero: '101', nombre: 'Ana Pérez', rfc: 'XAXX010101000', ingreso: '2024-02-01', salario: 412.5 },
        { numero: '102', nombre: 'Luis Ñúñez', rfc: 'XEXX010101000', ingreso: '2023-11-15', salario: 380 },
      ],
    },
  })
})

test.describe('RR. HH. (2)', () => {
  test('días hábiles: conteo, festivos y máximo', async ({ pagina: p }) => {
    await p.click('#h-vacaciones')
    await enDialogo(p, '.dr-inputs input').first().fill('21/12/2026')
    await enDialogo(p, '.dr-inputs input').nth(1).fill('30/12/2026')
    await expect(enDialogo(p, '.dr-count')).toHaveText('6 días hábiles')
    await expect(enDialogo(p, '.cal-day[data-d="2026-12-25"]')).toHaveClass(/hol/)
    expect(await axe(p)).toEqual([])
    await enDialogo(p, '.dr-inputs input').nth(1).fill('15/01/2027')
    await boton(p, 'confirm').click()
    await expect(enDialogo(p, '.field.daterange .msg')).toHaveText('Máximo 12 días hábiles.')
  })

  test('fecha con calendario desplegable: no la recorta el diálogo y se elige con teclado', async ({ pagina: p }) => {
    await p.click('#h-fecha')
    await enDialogo(p, 'input[name=puesto]').fill('Supervisora')
    const btn = enDialogo(p, '.cal-btn').first()
    await btn.click()
    const pop = enDialogo(p, '.cal-pop').first()
    await expect(pop).toBeVisible()
    // Visible por completo (no recortado por el cuerpo con overflow).
    const caja = await pop.boundingBox()
    expect(caja.height).toBeGreaterThan(250)
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('ArrowRight')
    await p.keyboard.press('Enter')
    await expect(pop).toBeHidden()
    await expect(enDialogo(p, '.datecal input').first()).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/)
    await boton(p, 'confirm').click()
    const r = await resultado(p)
    expect(r.value.desde).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('exportar a Excel descarga un .xlsx', async ({ pagina: p }) => {
    await p.click('#h-exportar')
    await enDialogo(p, 'tbody tr').nth(1).click()
    const descarga = p.waitForEvent('download')
    await enDialogo(p, '.exp .link').first().click()
    const d = await descarga
    expect(d.suggestedFilename()).toBe('empleados.xlsx')
  })

  test('plantilla de permiso desde JSON con campos condicionales', async ({ pagina: p }) => {
    await p.click('#h-permiso')
    await expect(enDialogo(p, 'input[name=otro]')).toBeHidden()
    await enDialogo(p, 'select[name=motivo]').selectOption('Otro')
    await expect(enDialogo(p, 'input[name=otro]')).toBeVisible()
    expect(await axe(p)).toEqual([])
  })

  test('lista del buscador se abre hacia abajo y sin recortarse', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 1100, height: 640 })
    await p.click('#c-combo')
    await p.keyboard.press('Tab')
    await p.keyboard.press('Tab')
    await p.keyboard.type('a')
    const lista = enDialogo(p, '.cb-list:not([hidden])')
    await expect(lista).toBeVisible()
    const caja = await lista.boundingBox()
    const opciones = await enDialogo(p, '[role=option]').count()
    expect(opciones).toBeGreaterThan(1)
    expect(caja.height).toBeGreaterThan(100)
    const entrada = await enDialogo(p, '.cb-input[aria-expanded=true]').boundingBox()
    expect(caja.y).toBeGreaterThanOrEqual(entrada.y + entrada.height)
  })
})
