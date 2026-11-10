import { expect, test } from '@playwright/test'
import { axe, boton, enDialogo } from './utilidades.mjs'

const resultado = (p) => p.waitForFunction(() => window.ultimo).then(() => p.evaluate(() => window.ultimo))

test.describe('SweetAlert2 (nexus-dialogs/swal)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/test/paginas/swal.html')
    await page.waitForFunction(() => window.Swal)
  })

  test('el ejemplo de borrado de su documentación sale con el estándar y pasa axe', async ({ page: p }) => {
    await p.click('#s-delete')
    await expect(boton(p, 'confirm')).toHaveClass('btn btn-danger')
    await expect(boton(p, 'cancel')).toBeFocused()
    expect(await axe(p)).toEqual([])
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toEqual({ isConfirmed: true, isDenied: false, isDismissed: false, value: true })
  })

  test('deny e input con validación', async ({ page: p }) => {
    await p.click('#s-deny')
    await boton(p, 'deny').click()
    expect(await resultado(p)).toMatchObject({ isDenied: true })
    await p.evaluate(() => (window.ultimo = null))
    await p.click('#s-input')
    await p.keyboard.press('Enter')
    await expect(enDialogo(p, '.err')).toHaveText('You need to write something!')
    expect(await axe(p)).toEqual([])
    await p.keyboard.type('urieldomingezm')
    await p.keyboard.press('Enter')
    expect(await resultado(p)).toMatchObject({ isConfirmed: true, value: 'urieldomingezm' })
  })

  test('toast con timer', async ({ page: p }) => {
    await p.click('#s-toast')
    await expect(p.locator('[data-nexus-toast] li')).toContainText('Signed in successfully')
    expect(await resultado(p)).toMatchObject({ isDismissed: true, dismiss: 'timer' })
  })
})

test.describe('Vue (nexus-dialogs/vue)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/test/paginas/vue.html')
    await page.waitForFunction(() => window.listo)
  })

  test('useDialog + useToast', async ({ page: p }) => {
    await p.click('#v-confirm')
    await expect(p.locator('#v-abierto')).toHaveText('hay diálogo')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({ confirmed: true })
    await expect(p.locator('[data-nexus-toast] li')).toContainText('Enviado')
  })

  test('al cambiar de ruta se cierran los diálogos de la página (también las recetas)', async ({ page: p }) => {
    await p.click('#v-delete')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await p.evaluate(() => window.cambiarRuta())
    await expect(p.locator('#otra')).toBeVisible()
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(0)
    expect(await resultado(p)).toEqual({ ok: false })
  })
})
