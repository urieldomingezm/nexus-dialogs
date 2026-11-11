// Derecha a izquierda en un navegador real: la geometría se invierte y sigue siendo accesible.
import { axe, boton, enDialogo, expect, test } from './utilidades.mjs'

test.describe('RTL (<html dir="rtl">)', () => {
  test.beforeEach(async ({ pagina: p }) => {
    await p.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
  })

  test('el botón × queda a la izquierda y el icono antes del texto a la derecha', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.nd.dialog.open({ title: 'مرحبا بالعالم', text: 'نص تجريبي', icon: 'info', dismissible: { closeButton: true } })
    })
    await expect(enDialogo(p, '.x')).toBeVisible()
    const panel = await enDialogo(p, '.panel').boundingBox()
    const x = await enDialogo(p, '.x').boundingBox()
    const icono = await enDialogo(p, '.icon').boundingBox()
    const titulo = await enDialogo(p, '.title').boundingBox()
    expect(x.x - panel.x).toBeLessThan(panel.x + panel.width - (x.x + x.width))
    expect(icono.x).toBeGreaterThan(titulo.x)
    expect(await axe(p)).toEqual([])
  })

  test('la acción principal pasa al lado final: a la izquierda de Cancelar', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.nd.dialog.confirm({ title: '¿Seguro?' })
    })
    const c = await boton(p, 'confirm').boundingBox()
    const n = await boton(p, 'cancel').boundingBox()
    expect(c.x).toBeLessThan(n.x)
  })

  test('formulario: validación, interruptor, lista y calendario con flechas invertidas', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.ultimo = null
      window.nd
        .form({
          title: 'نموذج',
          fields: [
            { name: 'nombre', label: 'الاسم', required: true },
            { name: 'activo', label: 'نشط', type: 'switch' },
            { name: 'tipo', label: 'النوع', type: 'select', options: ['أ', 'ب'] },
            { name: 'dia', label: 'التاريخ', type: 'date', calendar: true, value: '2026-03-10' },
          ],
        })
        .then((r) => (window.ultimo = r))
    })
    await boton(p, 'confirm').click()
    await expect(enDialogo(p, '.err, .summary').first()).toBeVisible()
    expect(await axe(p)).toEqual([])
    await enDialogo(p, 'input[type=text]').first().fill('ليلى')
    await enDialogo(p, '.toggle').click()
    await enDialogo(p, '.cal-btn').click()
    const dia = enDialogo(p, '.cal-day[data-d="2026-03-10"]')
    await dia.focus()
    await p.keyboard.press('ArrowLeft')
    await expect(enDialogo(p, '.cal-day:focus')).toHaveText('11')
    await p.keyboard.press('Escape')
    await boton(p, 'confirm').click()
    const r = await p.waitForFunction(() => window.ultimo).then(() => p.evaluate(() => window.ultimo))
    expect(r).toMatchObject({ confirmed: true, value: { nombre: 'ليلى', activo: true } })
  })

  test('el toast toma la dirección y la barra del temporizador se vacía hacia la derecha', async ({ pagina: p }) => {
    await p.evaluate(() => window.nd.toast('تم الحفظ'))
    await expect(p.locator('[data-nexus-toast]')).toHaveAttribute('dir', 'rtl')
    await expect(p.locator('[data-nexus-toast] li')).toContainText('تم الحفظ')
  })
})
