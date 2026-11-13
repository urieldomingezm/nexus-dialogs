// Lo que un lector de pantalla recibe: el árbol de accesibilidad del navegador (rol, nombre y estado de cada
// elemento) de los recorridos clave, y el orden de lectura. Si alguien cambia un rol, una etiqueta o el orden,
// estas pruebas fallan. NO sustituyen a una persona con NVDA, JAWS, VoiceOver o TalkBack: ver docs/accesibilidad.md.
import { boton, enDialogo, expect, test } from './utilidades.mjs'

const dialogo = (p) => p.locator('dialog[data-nexus-dialog]').last()

test.describe('árbol de accesibilidad (lo que lee un lector de pantalla)', () => {
  // Cada motor arma su propio árbol (nombres y roles intermedios cambian): se fija el de Chromium, que es el de NVDA/JAWS en Chrome y Edge.
  test.skip(({ browserName }) => browserName !== 'chromium', 'el árbol se fija en Chromium')

  test('confirmación de peligro: se anuncia como alertdialog con título, texto y dos botones, foco en «Cancelar»', async ({
    pagina: p,
  }) => {
    await p.click('#b-confirm')
    await expect(dialogo(p)).toMatchAriaSnapshot(`
      - alertdialog "¿Eliminar el registro?":
        - region "¿Eliminar el registro?":
          - heading "¿Eliminar el registro?" [level=2]
          - paragraph: Esta acción no se puede deshacer.
          - button "Cancelar"
          - button "Sí, eliminar"
    `)
    await expect(boton(p, 'cancel')).toBeFocused()
  })

  test('borrado grande: lo que se pierde es una lista y el campo y el botón desactivado tienen nombre y estado', async ({ pagina: p }) => {
    await p.click('#r-delete')
    await expect(dialogo(p)).toMatchAriaSnapshot(`
      - alertdialog "¿Eliminar el periodo de nómina?":
        - region "¿Eliminar el periodo de nómina?":
          - heading "¿Eliminar el periodo de nómina?" [level=2]
          - paragraph: Se eliminará Quincena 21. No se puede deshacer.
          - paragraph: "Se perderá:"
          - list:
            - listitem: 148 recibos calculados
            - listitem: 12 incidencias capturadas
            - listitem: El borrador de dispersión bancaria
          - text: Para confirmar, escribe
          - code: Quincena 21
          - textbox "Para confirmar, escribe Quincena 21"
          - text: Respeta mayúsculas y espacios. El botón se activa cuando coincide.
          - button "Cancelar"
          - button "Eliminar" [disabled]
    `)
    await enDialogo(p, '.typed input').fill('Quincena 21')
    await expect(boton(p, 'confirm')).toBeEnabled()
  })

  test('formulario con errores: resumen con enlaces, campos inválidos con su mensaje y grupos con nombre', async ({ pagina: p }) => {
    await p.click('#b-form')
    await expect(dialogo(p)).toBeVisible()
    await p.keyboard.press('Enter')
    await expect(dialogo(p).getByRole('textbox', { name: 'Nombre' })).toHaveAttribute('aria-invalid', 'true')
    await expect(dialogo(p)).toMatchAriaSnapshot(`
      - dialog "Nuevo cliente":
        - region "Nuevo cliente":
          - heading "Nuevo cliente" [level=2]
          - paragraph: "Revisa 3 campo(s):"
          - list:
            - listitem:
              - 'link "Nombre: Este campo es obligatorio."'
            - listitem:
              - 'link "Correo: Este campo es obligatorio."'
            - listitem:
              - 'link "Área: Este campo es obligatorio."'
          - textbox "Nombre" [invalid]
          - textbox "Correo" [invalid]
          - textbox "Teléfono"
          - combobox "Área" [invalid]
          - radiogroup "Tipo"
          - switch "Requiere factura"
          - button "Cancelar"
          - button "Crear cliente"
    `)
  })

  test('sesión por expirar: el tiempo restante está en una región de estado', async ({ pagina: p }) => {
    await p.click('#r-session')
    await expect(dialogo(p).getByRole('status')).toContainText('Quedan')
    await expect(dialogo(p)).toHaveAttribute('role', 'alertdialog')
  })

  test('toast: se anuncia en una región viva educada, sin llevarse el foco', async ({ pagina: p }) => {
    await p.click('#t-ok')
    const vivas = p.locator('[data-nexus-toast]').first().locator('[aria-live]')
    await expect(vivas.first()).toBeAttached()
    expect(await vivas.evaluateAll((l) => l.map((e) => e.getAttribute('aria-live')).sort())).toEqual(['assertive', 'polite'])
    await expect(p.locator('#t-ok')).toBeFocused()
  })
})
