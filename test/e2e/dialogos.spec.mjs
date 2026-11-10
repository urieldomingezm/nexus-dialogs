import { axe, boton, enDialogo, expect, resultado, sinDialogos, test } from './utilidades.mjs'

test.describe('diálogos', () => {
  test('confirmar peligro: foco en Cancelar, Tab no sale del diálogo, Esc cierra', async ({ pagina: p }) => {
    await p.click('#b-confirm')
    const cancelar = boton(p, 'cancel')
    await expect(cancelar).toBeFocused()
    await expect(boton(p, 'confirm')).toHaveClass('btn btn-danger')
    expect(await axe(p)).toEqual([])
    for (let i = 0; i < 6; i++) {
      await p.keyboard.press('Tab')
      const dentro = await p.evaluate(
        () => document.activeElement?.closest('dialog[data-nexus-dialog]') !== null || document.activeElement === document.body,
      )
      expect(dentro).toBe(true)
    }
    await p.keyboard.press('Escape')
    expect(await resultado(p)).toMatchObject({ confirmed: false, reason: 'escape' })
    await sinDialogos(p)
    await expect(p.locator('#b-confirm')).toBeFocused()
  })

  test('la página de atrás queda inerte y sin scroll', async ({ pagina: p }) => {
    await p.click('#b-confirm')
    expect(await p.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden')
    // Lo de atrás no recibe foco (inert del <dialog> modal).
    expect(await p.evaluate(() => (document.getElementById('b-alert').focus(), document.activeElement?.id))).not.toBe('b-alert')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({ confirmed: true })
    expect(await p.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden')
  })

  test('escribir para borrar: el botón se habilita solo con el texto exacto', async ({ pagina: p }) => {
    await p.click('#b-typed')
    const input = enDialogo(p, '.typed input')
    await expect(input).toBeFocused()
    await expect(boton(p, 'confirm')).toBeDisabled()
    await p.keyboard.type('Quincena 2')
    await expect(boton(p, 'confirm')).toBeDisabled()
    await p.keyboard.type('1')
    await expect(boton(p, 'confirm')).toBeEnabled()
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('Enter')
    expect(await resultado(p)).toMatchObject({ confirmed: true })
  })

  test('prompt: error del servidor dentro del diálogo, luego éxito', async ({ pagina: p }) => {
    await p.click('#b-prompt')
    await p.keyboard.type('Almacén')
    await p.keyboard.press('Enter')
    await expect(enDialogo(p, '.err')).toHaveText('Ya existe un área con ese nombre.')
    await p.keyboard.press('Control+A')
    await p.keyboard.type('Calidad')
    await p.keyboard.press('Enter')
    expect(await resultado(p)).toMatchObject({ confirmed: true, value: 'Calidad' })
  })

  test('alerta con timer: se cierra sola; el mouse encima la pausa', async ({ pagina: p }) => {
    await p.evaluate(() => {
      nd.dialog.alert({ title: 'Rápida', timer: 400 }).then((r) => (window.ultimo = r))
    })
    await enDialogo(p, '.panel').hover()
    await p.waitForTimeout(700)
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await p.mouse.move(2, 2)
    expect(await resultado(p)).toMatchObject({ reason: 'timer' })
  })

  test('diálogo sobre diálogo: el de abajo sigue abierto', async ({ pagina: p }) => {
    await p.click('#b-nested')
    await boton(p, 'otro').click()
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(2)
    await p.keyboard.press('Escape')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await expect(boton(p, 'otro')).toBeFocused()
  })

  test('panel lateral y hoja inferior en celular', async ({ pagina: p }) => {
    await p.click('#b-drawer')
    const panel = enDialogo(p, '.panel')
    const caja = await panel.boundingBox()
    const ancho = p.viewportSize().width
    expect(Math.round(caja.x + caja.width)).toBe(ancho)
    expect(await axe(p)).toEqual([])
    await enDialogo(p, '.x').click()
    await sinDialogos(p)

    await p.setViewportSize({ width: 390, height: 800 })
    await p.click('#b-confirm')
    const hoja = await enDialogo(p, '.panel').boundingBox()
    expect(Math.round(hoja.y + hoja.height)).toBe(800)
    expect(Math.round(hoja.width)).toBe(390)
  })
})

test.describe('formularios', () => {
  test('errores: resumen con enlaces, aria-invalid y foco; luego envía', async ({ pagina: p }) => {
    await p.click('#b-form')
    await expect(enDialogo(p, '[name=nombre]')).toBeFocused()
    await p.keyboard.press('Enter')
    const resumen = enDialogo(p, '.summary')
    await expect(resumen).toBeVisible()
    await expect(resumen).toBeFocused()
    await expect(enDialogo(p, '[name=nombre]')).toHaveAttribute('aria-invalid', 'true')
    expect(await axe(p)).toEqual([])
    await enDialogo(p, '.summary a').first().click()
    await expect(enDialogo(p, '[name=nombre]')).toBeFocused()
    await p.keyboard.type('Ana Torres')
    await enDialogo(p, '[name=correo]').fill('ana@empresa.mx')
    await enDialogo(p, 'select[name=area]').selectOption('Nómina')
    await enDialogo(p, '.seg-item').filter({ hasText: 'Empresa' }).click()
    await expect(enDialogo(p, '[name=rfc]')).toBeVisible()
    await enDialogo(p, '[name=rfc]').fill('pem840101ab3')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({
      confirmed: true,
      value: { nombre: 'Ana Torres', correo: 'ana@empresa.mx', area: 'Nómina', tipo: 'Empresa', rfc: 'PEM840101AB3', factura: false },
    })
  })

  test('cerrar con cambios pregunta; «Seguir editando» vuelve sin perder nada', async ({ pagina: p }) => {
    await p.click('#b-gasto')
    await p.keyboard.type('PEM840101AB3')
    await p.keyboard.press('Escape')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(2)
    await expect(boton(p, 'keep')).toBeFocused()
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('Enter')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await expect(enDialogo(p, '[name=rfc]')).toHaveValue('PEM840101AB3')
    await boton(p, 'cancel').click()
    await boton(p, 'discard').click()
    expect(await resultado(p)).toMatchObject({ confirmed: false, reason: 'cancel' })
  })

  test('asistente: Enter avanza, valida, revisa y envía', async ({ pagina: p }) => {
    await p.click('#b-wizard')
    await p.keyboard.press('Enter')
    await expect(enDialogo(p, '.summary')).toBeVisible()
    await enDialogo(p, '[name=nombre]').fill('Laura Méndez Ruiz')
    await enDialogo(p, '[name=curp]').fill('MERL900312MJCNZR05')
    await p.keyboard.press('Enter')
    await expect(enDialogo(p, '.step-title')).toHaveText('Puesto')
    await expect(enDialogo(p, '.step-title')).toBeFocused()
    await enDialogo(p, 'select[name=area]').selectOption('Logística')
    await enDialogo(p, '[name=salario]').fill('980.5')
    await enDialogo(p, '[name=ingreso]').fill('2026-12-01')
    await boton(p, 'next').click()
    await boton(p, 'next').click()
    await expect(enDialogo(p, '.step-title')).toHaveText('Revisar')
    await expect(enDialogo(p, '.review')).toContainText('$ 980.50 MXN')
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({
      confirmed: true,
      value: { nombre: 'Laura Méndez Ruiz', area: 'Logística', salario: 980.5, ingreso: '2026-12-01', vales: false, seguro: 'Básico' },
    })
  })
})

test.describe('toasts', () => {
  test('se ven, se anuncian y pasan axe', async ({ pagina: p }) => {
    await p.click('#t-undo')
    const toast = p.locator('[data-nexus-toast] li')
    await expect(toast).toHaveCount(1)
    expect(await axe(p, '[data-nexus-toast]')).toEqual([])
    await toast.locator('button', { hasText: 'Deshacer' }).click()
    await expect(p.locator('[data-nexus-toast] li', { hasText: 'Recuperados' })).toBeVisible()
  })

  test('con un diálogo abierto, el toast se puede usar (no queda inerte)', async ({ pagina: p }) => {
    await p.click('#t-in-dialog')
    const x = p.locator('[data-nexus-toast] li button.x')
    await expect(x).toBeVisible()
    await x.click()
    await expect(p.locator('[data-nexus-toast] li')).toHaveCount(0)
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
  })
})

test.describe('temas', () => {
  test('oscuro y Bootstrap pasan contraste de axe', async ({ pagina: p }) => {
    await p.click('#th-dark')
    await p.click('#b-form')
    await p.keyboard.press('Enter')
    expect(await axe(p)).toEqual([])
    await p.evaluate(() => nd.dialog.closeAll())
    await p.click('#th-bootstrap')
    await p.click('#b-typed')
    expect(await axe(p)).toEqual([])
  })
})
