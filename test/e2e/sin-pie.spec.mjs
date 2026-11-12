import { enDialogo, expect, test } from './utilidades.mjs'

// Sin botones de pie, el contenido propio (por ejemplo un menú de acciones) no debe quedar pegado al borde inferior.
test.describe('diálogo sin pie de botones', () => {
  for (const [nombre, ancho] of [
    ['escritorio', 1024],
    ['celular', 390],
  ]) {
    test(`deja aire debajo del contenido (${nombre})`, async ({ page: p }) => {
      await p.setViewportSize({ width: ancho, height: 780 })
      await p.goto('/test/paginas/swal.html')
      await p.waitForFunction(() => window.Swal)
      await p.evaluate(
        () =>
          void window.Swal.fire({
            title: 'Requisición #28216',
            showConfirmButton: false,
            html: '<div id="acciones" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><button>Ver detalle</button><button>Aprobar</button><button>VoBo</button><button>Cancelar</button></div>',
          }),
      )
      const hueco = await enDialogo(p, '.panel').evaluate((panel) => {
        const ultimo = panel.querySelector('#acciones').lastElementChild.getBoundingClientRect()
        return panel.getBoundingClientRect().bottom - ultimo.bottom
      })
      expect(hueco).toBeGreaterThanOrEqual(20)
    })
  }
})
