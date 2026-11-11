// Fugas: abrir y cerrar cientos de diálogos no debe dejar nodos del DOM ni escuchas de eventos colgados.
// Usa los contadores del DOM de Chromium (CDP), así que solo corre ahí.
import { test, expect } from './utilidades.mjs'

const contadores = async (cdp) => {
  await cdp.send('HeapProfiler.collectGarbage')
  await cdp.send('HeapProfiler.collectGarbage')
  const { documents, nodes, jsEventListeners } = await cdp.send('Memory.getDOMCounters')
  return { documents, nodes, escuchas: jsEventListeners }
}

test('300 diálogos, formularios y toasts abiertos y cerrados no dejan nodos ni escuchas', async ({ pagina: p, browserName }) => {
  test.skip(browserName !== 'chromium', 'los contadores del DOM son de Chromium')
  test.setTimeout(90_000)
  const cdp = await p.context().newCDPSession(p)
  await cdp.send('Memory.getDOMCounters')

  const ronda = (n) =>
    p.evaluate(async (n) => {
      const { dialog, form, toast } = window.nd
      for (let i = 0; i < n; i++) {
        let r = dialog.confirm({ title: `Pregunta ${i}`, text: 'texto', danger: i % 2 === 0 })
        dialog.close()
        await r
        r = form({
          title: `Formulario ${i}`,
          fields: [
            { name: 'a', label: 'A', required: true },
            { name: 'b', label: 'B', type: 'email' },
          ],
        })
        dialog.close()
        await r
        toast({ title: `Aviso ${i}`, text: 'listo' })
      }
      await new Promise((ok) => setTimeout(ok, 200))
      toast.dismissAll?.()
      dialog.closeAll()
    }, n)

  await ronda(20) // calentamiento: caches de hojas de estilo, fuentes, etc.
  const antes = await contadores(cdp)
  await ronda(300)
  await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(0)
  const despues = await contadores(cdp)

  // Sin fuga, las cifras vuelven a lo de antes (con un margen para los toasts que aún se despiden).
  expect(despues.nodes - antes.nodes, 'nodos del DOM').toBeLessThan(60)
  expect(despues.escuchas - antes.escuchas, 'escuchas de eventos').toBeLessThan(40)
  expect(despues.documents - antes.documents, 'documentos').toBeLessThanOrEqual(1)
})
