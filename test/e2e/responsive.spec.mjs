import { axe, enDialogo, expect, sinDialogos, test } from './utilidades.mjs'

const CAMPOS = [
  { name: 'detalle', label: 'Detalle de baja', type: 'select', options: ['Renuncia', 'Abandono'], required: true },
  { name: 'ingreso', label: 'Fecha ingreso', type: 'date' },
  { name: 'baja', label: 'Fecha baja', type: 'date' },
  { name: 'tipo', label: 'Tipo (auto)' },
  { name: 'comentarios', label: 'Comentarios', type: 'textarea' },
]

/** Posiciones (x, y) de todos los elementos que coincidan con el selector dentro del diálogo de arriba. */
const cajas = async (p, q) => {
  const todos = await enDialogo(p, q).all()
  return Promise.all(todos.map((l) => l.boundingBox()))
}
/** Cuántas columnas distintas (por posición x) ocupan los campos visibles. */
const columnas = async (p) => new Set((await cajas(p, '.field')).map((c) => Math.round(c.x))).size

test.describe('formularios y botones responsive', () => {
  test('columns: auto reparte en 2 columnas en un teléfono, el textarea ocupa toda la fila y no hay desborde', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 390, height: 800 })
    await p.evaluate((campos) => void window.nd.form({ title: 'Agregar baja', columns: 'auto', fields: campos }).catch(() => {}), CAMPOS)
    await expect(enDialogo(p, '.field').first()).toBeVisible()
    expect(await columnas(p)).toBe(2)
    const textarea = await enDialogo(p, '.field:has(textarea)').boundingBox()
    const cuerpo = await enDialogo(p, '.body').boundingBox()
    expect(textarea.width).toBeGreaterThan(cuerpo.width - 48)
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    expect(await axe(p)).toEqual([])
  })

  test('columns: auto en escritorio usa tres columnas, y en 320 px baja a una', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 1280, height: 800 })
    await p.evaluate((campos) => void window.nd.form({ title: 'Agregar baja', columns: 'auto', fields: campos }).catch(() => {}), CAMPOS)
    await expect(enDialogo(p, '.field').first()).toBeVisible()
    expect(await columnas(p)).toBe(3)
    await p.setViewportSize({ width: 300, height: 800 })
    await expect.poll(() => columnas(p)).toBe(1)
  })

  test('columns: 2 sigue en dos columnas en un teléfono', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 390, height: 800 })
    await p.evaluate((campos) => void window.nd.form({ title: 'Agregar baja', columns: 2, fields: campos }).catch(() => {}), CAMPOS)
    await expect(enDialogo(p, '.field').first()).toBeVisible()
    expect(await columnas(p)).toBe(2)
  })

  test('los botones van en una sola fila en un teléfono (3 columnas)', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 390, height: 800 })
    await p.evaluate(
      () =>
        void window.nd
          .open({
            title: 'Encuesta de salida',
            text: 'La baja fue registrada.',
            buttons: [
              { id: 'omitir', text: 'Cancelar', role: 'cancel' },
              { id: 'ant', text: 'Anterior' },
              { id: 'sig', text: 'Siguiente', role: 'confirm' },
            ],
          })
          .catch(() => {}),
    )
    await expect(enDialogo(p, '.foot .btn').first()).toBeVisible()
    const ys = (await cajas(p, '.foot .btn')).map((c) => Math.round(c.y))
    expect(ys).toHaveLength(3)
    expect(new Set(ys).size).toBe(1)
    await p.keyboard.press('Escape')
    await sinDialogos(p)
  })

  test('con icono, el contenido html usa todo el ancho (no queda hueco bajo el icono)', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 1280, height: 800 })
    await p.evaluate(
      () =>
        void window.nd
          .confirm({ title: 'Encuesta de Salida', icon: 'question', html: '<div id="caja">Empleado: 138490</div>', sanitize: true })
          .catch(() => {}),
    )
    await expect(enDialogo(p, '.icon')).toBeVisible()
    const icono = await enDialogo(p, '.icon').boundingBox()
    const caja = await enDialogo(p, '.text.html').boundingBox()
    expect(caja.x).toBeLessThanOrEqual(icono.x + 1)
  })
})
