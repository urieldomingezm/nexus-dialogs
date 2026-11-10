import { axe, boton, enDialogo, expect, resultado, test } from './utilidades.mjs'

const dialogos = (p) => p.locator('dialog[data-nexus-dialog]')

test.describe('recetas', () => {
  test('confirmDelete: lo que se pierde, escribir el nombre y axe', async ({ pagina: p }) => {
    await p.click('#r-delete')
    await expect(enDialogo(p, '.loss li')).toHaveCount(3)
    expect(await axe(p)).toEqual([])
    await expect(boton(p, 'confirm')).toBeDisabled()
    await enDialogo(p, '.typed input').fill('Quincena 21')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toEqual({ ok: true })
  })

  test('unsavedChanges: foco en «Seguir editando» y guardar', async ({ pagina: p }) => {
    await p.click('#r-unsaved')
    await expect(boton(p, 'keep')).toBeFocused()
    expect(await axe(p)).toEqual([])
    await boton(p, 'save').click()
    expect(await resultado(p)).toEqual({ decision: 'save' })
  })

  test('sessionTimeout: cuenta regresiva accesible', async ({ pagina: p }) => {
    await p.click('#r-session')
    await expect(boton(p, 'extend')).toBeFocused()
    await expect(enDialogo(p, '.num')).toHaveText('1:30')
    await expect(enDialogo(p, '.num')).not.toHaveText('1:30', { timeout: 3000 })
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('Enter')
    expect(await resultado(p)).toEqual({ decision: 'extend' })
  })

  test('approval: rechazar con motivo desde el teclado', async ({ pagina: p }) => {
    await p.click('#r-approval')
    expect(await axe(p)).toEqual([])
    await boton(p, 'reject').click()
    await expect(dialogos(p)).toHaveCount(2)
    await expect(enDialogo(p, 'input[type=radio]').first()).toBeFocused()
    await p.keyboard.press('Space')
    await p.keyboard.press('Tab')
    await p.keyboard.type('Cubre el turno de Marta esa semana.')
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toEqual({ decision: 'rejected', comment: 'Cubre el turno de Marta esa semana.', reason: 'Cubre otro turno' })
  })

  test('bulkAction: progreso, error por fila y resumen', async ({ pagina: p }) => {
    await p.click('#r-bulk')
    await expect(boton(p, 'run')).toHaveText('Mover 6 empleados')
    expect(await axe(p)).toEqual([])
    await boton(p, 'run').click()
    await expect(enDialogo(p, '.results .bad')).toContainText('Pedro Salas')
    await expect(boton(p, 'done')).toBeFocused()
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('Escape')
    expect(await resultado(p)).toEqual({ confirmed: true, done: 5, failed: ['tiene una baja vigente'], skipped: 1 })
  })

  test('choose: flechas para elegir y Enter para continuar', async ({ pagina: p }) => {
    await p.click('#r-choose')
    expect(await axe(p)).toEqual([])
    await p.keyboard.press('ArrowDown')
    await p.keyboard.press('Enter')
    expect(await resultado(p)).toEqual({ value: 'csv' })
  })

  test('loading: no se cierra con Esc y devuelve el resultado', async ({ pagina: p }) => {
    await p.click('#r-loading')
    await expect(dialogos(p)).toHaveCount(1)
    await p.keyboard.press('Escape')
    await expect(dialogos(p)).toHaveCount(1)
    expect(await resultado(p)).toEqual({ n: 148 })
  })
})
