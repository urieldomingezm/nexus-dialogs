import { enDialogo, expect, test } from './utilidades.mjs'

// Android Chrome no cambia innerHeight al abrir el teclado: solo encoge visualViewport.
// Se simula con un visualViewport falso para comprobar que los botones y la lista quedan dentro de la zona visible.
const TECLADO = 300

test.describe('teclado en pantalla (visualViewport)', () => {
  test.use({ hasTouch: true })

  test('la hoja inferior y sus botones quedan sobre el teclado, y se restauran al cerrarlo', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 390, height: 780 })
    await p.evaluate(() => {
      const vv = new EventTarget()
      Object.assign(vv, { offsetTop: 0, height: window.innerHeight, width: 390 })
      Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
      window.__vv = vv
    })
    await p.evaluate(
      () =>
        void window.nd
          .form({
            title: 'Registrar',
            placement: 'bottom',
            fields: [
              { name: 'a', label: 'Líder', type: 'combobox', options: ['Ana', 'Beto', 'Carla', 'Diego'] },
              { name: 'b', label: 'Notas', type: 'textarea' },
            ],
          })
          .catch(() => {}),
    )
    await expect(enDialogo(p, '.foot button').first()).toBeVisible()
    await p.evaluate((k) => {
      window.__vv.height = window.innerHeight - k
      window.__vv.dispatchEvent(new Event('resize'))
    }, TECLADO)
    await expect.poll(async () => (await enDialogo(p, '.foot button').first().boundingBox()).y + 40).toBeLessThanOrEqual(780 - TECLADO)
    const panel = await enDialogo(p, '.panel').boundingBox()
    expect(panel.y).toBeGreaterThanOrEqual(0)
    expect(panel.y + panel.height).toBeLessThanOrEqual(780 - TECLADO + 1)

    await p.evaluate(() => {
      window.__vv.height = window.innerHeight
      window.__vv.dispatchEvent(new Event('resize'))
    })
    await expect
      .poll(async () => {
        const b = await enDialogo(p, '.panel').boundingBox()
        return b.y + b.height
      })
      .toBeGreaterThan(780 - 5)
  })

  test('la lista del combobox aparece pegada al campo y dentro de la zona visible', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 390, height: 780 })
    await p.evaluate(() => {
      const vv = new EventTarget()
      Object.assign(vv, { offsetTop: 0, height: window.innerHeight - 300, width: 390 })
      Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
    })
    await p.evaluate(
      () =>
        void window.nd
          .form({
            title: 'Registrar',
            placement: 'bottom',
            fields: [{ name: 'a', label: 'Líder', type: 'combobox', options: ['Ana', 'Beto', 'Carla', 'Diego'] }],
          })
          .catch(() => {}),
    )
    const input = enDialogo(p, '.field input').first()
    await input.click()
    await input.fill('a')
    const lista = enDialogo(p, '[role="listbox"]').first()
    await expect(lista).toBeVisible()
    const l = await lista.boundingBox()
    const i = await input.boundingBox()
    expect(l.y + l.height).toBeLessThanOrEqual(780 - 300 + 1)
    expect(Math.min(Math.abs(l.y - (i.y + i.height)), Math.abs(i.y - (l.y + l.height)))).toBeLessThan(24)
  })
})

test.describe('escritorio con visualViewport distinto', () => {
  test('sin puntero táctil no se altera la posición del diálogo', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 1000, height: 700 })
    await p.evaluate(() => {
      const vv = new EventTarget()
      Object.assign(vv, { offsetTop: 0, height: 300, width: 1000 })
      Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
    })
    await p.evaluate(() => void window.nd.confirm({ title: '¿Seguro?' }).catch(() => {}))
    await expect(enDialogo(p, '.panel')).toBeVisible()
    const b = await enDialogo(p, '.panel').boundingBox()
    expect(b.y + b.height / 2).toBeGreaterThan(250)
  })
})
