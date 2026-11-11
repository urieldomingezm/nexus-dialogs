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

  test('pasos, imagen, update y close(resultado) en un navegador real, accesibles', async ({ page: p }) => {
    await p.evaluate(() => {
      window.ultimo = null
      window.Swal.fire({
        title: 'Paso 1',
        html: '<span id="dentro">hola</span>',
        icon: 'info',
        imageUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22/%3E',
        imageAlt: 'logo',
        progressSteps: ['1', '2', '3'],
        currentProgressStep: 0,
      }).then((r) => (window.ultimo = r))
    })
    await expect(enDialogo(p, '.swal-step')).toHaveCount(3)
    await expect(enDialogo(p, '.swal-step[aria-current=step]')).toHaveText('1')
    expect(await axe(p)).toEqual([])
    expect(await p.evaluate(() => window.Swal.getHtmlContainer().querySelector('#dentro').textContent)).toBe('hola')
    await p.evaluate(() => window.Swal.update({ title: 'Paso 2', currentProgressStep: 1, showCancelButton: true }))
    await expect(enDialogo(p, '.title')).toHaveText('Paso 2')
    await expect(enDialogo(p, '.swal-step[aria-current=step]')).toHaveText('2')
    await expect(boton(p, 'cancel')).toBeVisible()
    await p.evaluate(() => window.Swal.close({ isConfirmed: true, value: 'cerrado desde fuera' }))
    expect(await resultado(p)).toMatchObject({ isConfirmed: true, value: 'cerrado desde fuera' })
  })

  test('draggable: arrastrar la cabecera mueve el panel', async ({ page: p }) => {
    await p.evaluate(() => {
      window.Swal.fire({ title: 'Muéveme', text: 'texto', draggable: true })
    })
    const titulo = enDialogo(p, '.title')
    const antes = await titulo.boundingBox()
    await p.mouse.move(antes.x + 10, antes.y + 5)
    await p.mouse.down()
    await p.mouse.move(antes.x + 90, antes.y + 65, { steps: 4 })
    await p.mouse.up()
    const despues = await titulo.boundingBox()
    expect(Math.round(despues.x - antes.x)).toBeGreaterThan(60)
    expect(Math.round(despues.y - antes.y)).toBeGreaterThan(40)
    await p.keyboard.press('Escape')
  })

  test('timer: stopTimer lo detiene y resumeTimer lo cierra', async ({ page: p }) => {
    await p.evaluate(() => {
      window.ultimo = null
      window.Swal.fire({ title: 'Con tiempo', timer: 600, timerProgressBar: true }).then((r) => (window.ultimo = r))
    })
    await expect(enDialogo(p, '.timer')).toBeAttached()
    await p.evaluate(() => window.Swal.stopTimer())
    await p.waitForTimeout(900)
    expect(await p.evaluate(() => window.ultimo)).toBeNull()
    expect(await p.evaluate(() => window.Swal.isTimerRunning())).toBe(false)
    await p.evaluate(() => window.Swal.resumeTimer())
    expect(await resultado(p)).toMatchObject({ isDismissed: true, dismiss: 'timer' })
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
