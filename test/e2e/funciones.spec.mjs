import { axe, boton, enDialogo, expect, resultado, test } from './utilidades.mjs'

test.describe('funciones de formulario', () => {
  test('teléfono y dirección por CP, desde el teclado, con axe', async ({ pagina: p }) => {
    await p.evaluate(() => localStorage.clear())
    await p.click('#c-contacto')
    const tel = enDialogo(p, 'input[type=tel]')
    await expect(tel).toBeFocused()
    await p.keyboard.type('8112345678')
    await expect(tel).toHaveValue('81 1234 5678')
    await enDialogo(p, 'input[name="direccion.postalCode"]').fill('64000')
    await expect(enDialogo(p, 'input[name="direccion.state"]')).toHaveValue('Nuevo León')
    const colonias = enDialogo(p, '.ad-neighborhood select')
    await expect(colonias).toBeFocused()
    expect(await axe(p)).toEqual([])
    await colonias.selectOption('Obispado')
    await enDialogo(p, 'input[name="direccion.street"]').fill('Hidalgo 123')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({
      confirmed: true,
      value: {
        telefono: '+528112345678',
        direccion: { postalCode: '64000', state: 'Nuevo León', municipality: 'Monterrey', neighborhood: 'Obispado', street: 'Hidalgo 123' },
      },
    })
  })

  test('borrador: sobrevive a recargar la página', async ({ pagina: p }) => {
    await p.evaluate(() => localStorage.clear())
    await p.click('#c-contacto')
    await p.keyboard.type('5512345678')
    await p.waitForTimeout(500)
    await p.reload()
    await p.waitForFunction(() => window.nd)
    await p.click('#c-contacto')
    await expect(enDialogo(p, 'h2')).toHaveText('¿Continuar donde te quedaste?')
    expect(await axe(p)).toEqual([])
    await boton(p, 'resume').click()
    await expect(enDialogo(p, 'input[type=tel]')).toHaveValue('55 1234 5678')
  })

  test('asistente: el paso «Empresa» aparece solo para empresas', async ({ pagina: p }) => {
    await p.evaluate(() => localStorage.clear())
    await p.click('#c-cliente')
    const pasos = enDialogo(p, '.stepper li:not([hidden])')
    await expect(pasos).toHaveCount(3)
    await enDialogo(p, 'label.seg-item').filter({ hasText: 'Empresa' }).click()
    await expect(pasos).toHaveCount(4)
    await expect(enDialogo(p, '.step-count')).toHaveText('Paso 1 de 4')
    expect(await axe(p)).toEqual([])
    await boton(p, 'next').click()
    await expect(enDialogo(p, '.step-title')).toHaveText('Empresa')
  })

  test('formulario desde JSON con campo condicional', async ({ pagina: p }) => {
    await p.click('#c-json')
    const otro = enDialogo(p, 'input[name=otro]')
    await expect(otro).toBeHidden()
    await enDialogo(p, 'select[name=motivo]').selectOption('Otro')
    await expect(otro).toBeVisible()
    expect(await axe(p)).toEqual([])
  })
})
