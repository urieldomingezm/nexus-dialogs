// Los ejemplos completos de examples/ corren de verdad en un navegador, con una persona (el guion) contestándolos.
import { axe, boton, enDialogo, expect, test as base } from './utilidades.mjs'

const test = base.extend({
  ej: async ({ page }, use) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/test/paginas/ejemplos.html')
    await page.waitForFunction(() => window.ready)
    await use(page)
    expect(errores).toEqual([])
  },
})

test('alta de empleado: tres pasos, revisión y aviso', async ({ ej: p }) => {
  await p.evaluate(() => {
    window.fin = window.ejemplos.altaDeEmpleado()
  })
  await enDialogo(p, 'input[name=nombre]').fill('Laura Méndez Ruiz')
  await enDialogo(p, 'input[name=rfc]').fill('PEM840101AB3')
  await enDialogo(p, 'input[name=curp]').fill('PELJ900515HJCRPN03')
  expect(await axe(p)).toEqual([])
  await p.keyboard.press('Enter')
  await enDialogo(p, 'select[name=area]').selectOption('Nómina')
  await enDialogo(p, 'input[name=salario]').fill('480')
  await p.keyboard.press('Enter')
  await expect(enDialogo(p, 'h3')).toContainText(/revis/i)
  await boton(p, 'confirm').click()
  const r = await p.evaluate(() => window.fin)
  expect(r).toMatchObject({ nombre: 'Laura Méndez Ruiz', area: 'Nómina', salario: 480 })
  await expect(p.locator('[data-nexus-toast]').first()).toBeAttached()
})

test('cierre de quincena: espera, timbrado por lote y un error parcial', async ({ ej: p }) => {
  await p.evaluate(() => {
    window.fin = window.ejemplos.cerrarQuincena()
  })
  await expect(enDialogo(p, '.title')).toContainText('Timbrar 4 recibos')
  expect(await axe(p)).toEqual([])
  await boton(p, 'run').click()
  await expect(boton(p, 'retry')).toBeVisible({ timeout: 8000 }) // el recibo 3 falla: se ofrece reintentar solo ese
  await boton(p, 'done').click()
  await expect.poll(() => p.evaluate(() => window.fin.then((r) => JSON.stringify(r)))).toBe('{"timbrados":3,"fallidos":1}')
})

test('importar empleados: elegir el archivo, relacionar columnas y revisar', async ({ ej: p }) => {
  await p.evaluate(() => {
    window.fin = window.ejemplos.importarEmpleados()
  })
  const csv =
    'Número de empleado,empleado,RFC,Fecha de ingreso,Salario diario\nE-1,Ana Torres,TOAA900101AB1,01/02/2024,450\nE-2,Diego Ramírez,,15/03/2023,500\n,Sin número,,,\n'
  await enDialogo(p, 'input[type=file]').setInputFiles({ name: 'empleados.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(boton(p, 'next')).toBeVisible()
  await boton(p, 'next').click()
  await expect(boton(p, 'confirm')).toBeVisible()
  expect(await axe(p)).toEqual([])
  await boton(p, 'confirm').click()
  await expect.poll(() => p.evaluate(() => window.fin.then((n) => n))).toBe(2)
})

test('baja de empleado: hay que escribir el nombre y el aviso permite deshacer', async ({ ej: p }) => {
  await p.evaluate(() => {
    window.fin = window.ejemplos.bajaDeEmpleado()
  })
  await expect(boton(p, 'confirm')).toBeDisabled()
  expect(await axe(p)).toEqual([])
  await enDialogo(p, 'input').first().fill('Laura Méndez Ruiz')
  await expect(boton(p, 'confirm')).toBeEnabled()
  await boton(p, 'confirm').click()
  expect(await p.evaluate(() => window.fin)).toBe(true)
  await expect(p.locator('[data-nexus-toast]').first()).toBeAttached()
})

test('aprobar vacaciones: aprobar con comentario y rechazar con motivo', async ({ ej: p }) => {
  await p.evaluate(() => {
    window.fin = window.ejemplos.aprobarVacaciones()
  })
  expect(await axe(p)).toEqual([])
  await boton(p, 'confirm').click()
  expect(await p.evaluate(() => window.fin)).toBe('aprobada')

  await p.evaluate(() => {
    window.fin = window.ejemplos.aprobarVacaciones()
  })
  await boton(p, 'reject').click()
  await expect(enDialogo(p, 'input[type=radio]').first()).toBeFocused()
  await p.keyboard.press('Space')
  await p.keyboard.press('Tab')
  await p.keyboard.type('Cubre el turno de Marta esa semana.')
  await boton(p, 'confirm').click()
  expect(await p.evaluate(() => window.fin)).toBe('rechazada')
})

test('sesión por expirar: seguir trabajando la extiende y no responder la cierra', async ({ ej: p }) => {
  await p.evaluate(() => {
    window.fin = window.ejemplos.sesionPorExpirar(60)
  })
  await expect(boton(p, 'extend')).toBeFocused()
  expect(await axe(p)).toEqual([])
  await p.keyboard.press('Enter')
  expect(await p.evaluate(() => window.fin)).toBe('extendida')

  await p.evaluate(() => {
    window.fin = window.ejemplos.sesionPorExpirar(2)
  })
  expect(await p.evaluate(() => window.fin)).toBe('cerrada') // se acabó el tiempo
})
