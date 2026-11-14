// Huecos que la auditoría de cobertura encontró: fallos de red, el ciclo del foco con el teclado, diálogos apilados,
// archivos que no sirven, plugins e idiomas en un navegador de verdad.
import { axe, boton, enDialogo, expect, sinDialogos, test } from './utilidades.mjs'

test.describe('huecos de cobertura', () => {
  test('combobox con búsqueda que falla: lo dice, no se rompe y se puede seguir', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.fin = window.nd.form({
        title: 'Proveedor',
        fields: [
          {
            name: 'prov',
            label: 'Proveedor',
            type: 'combobox',
            search: async () => {
              throw new Error('sin red')
            },
          },
        ],
      })
    })
    const campo = enDialogo(p, '[role=combobox]').first()
    await expect(campo).toBeFocused()
    await p.keyboard.type('ace')
    await expect(enDialogo(p, '.cb-note')).toHaveText('No se pudo buscar')
    expect(await axe(p)).toEqual([])
    // Sigue vivo: al borrar y escribir otra vez vuelve a intentarlo sin lanzar errores.
    await p.keyboard.press('Backspace')
    await p.keyboard.type('x')
    await expect(enDialogo(p, '.cb-note')).toHaveText('No se pudo buscar')
    // La lista se abre hacia abajo y tapa el pie: Escape la cierra primero y el diálogo sigue abierto.
    await p.keyboard.press('Escape')
    await expect(enDialogo(p, '.cb-note')).toBeHidden()
    await boton(p, 'cancel').click()
    expect((await p.evaluate(() => window.fin)).confirmed).toBe(false)
  })

  test('importar: un archivo que no es CSV ni Excel se explica y el diálogo sigue abierto', async ({ pagina: p }) => {
    await p.click('#h-importar')
    await enDialogo(p, 'input[type=file]').setInputFiles({
      name: 'foto.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 0, 1, 2, 3]),
    })
    await expect(enDialogo(p, '[role=alert], .err, .msg').first()).not.toBeEmpty()
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    expect(await axe(p)).toEqual([])
    await boton(p, 'cancel').click()
  })

  test('el foco nunca cae en la página de atrás con Tab y Mayús+Tab, y vuelve al botón que abrió al cerrar', async ({ pagina: p }) => {
    await p.setContent('<button id="abre">Abrir</button>')
    await p.evaluate(() => {
      document.getElementById('abre').addEventListener('click', () => {
        window.fin = window.nd.dialog.confirm({ title: 'Eliminar', text: 'Seguro' })
      })
    })
    await p.focus('#abre')
    await p.keyboard.press('Enter')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    // Con un <dialog> modal nativo, tras el último control el foco pasa un instante al navegador (aquí se ve como <body>) y vuelve
    // al primero; lo que no puede pasar es que caiga en un elemento de la página, que está inerte.
    const dentro = () =>
      p.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest('dialog[data-nexus-dialog]'))
    for (let i = 0; i < 6; i++) {
      await p.keyboard.press('Tab')
      expect(await dentro()).toBe(true)
    }
    for (let i = 0; i < 6; i++) {
      await p.keyboard.press('Shift+Tab')
      expect(await dentro()).toBe(true)
    }
    await expect(p.locator('#abre')).not.toBeFocused()
    await p.keyboard.press('Escape')
    await sinDialogos(p)
    await expect(p.locator('#abre')).toBeFocused()
  })

  test('con dos diálogos apilados, Escape cierra solo el de arriba', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.a = window.nd.dialog.alert({ title: 'Abajo' })
      window.b = window.nd.dialog.alert({ title: 'Arriba' })
    })
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(2)
    await p.keyboard.press('Escape')
    await expect(p.locator('dialog[data-nexus-dialog]')).toHaveCount(1)
    await expect(enDialogo(p, '.title')).toHaveText('Abajo')
    await p.keyboard.press('Escape')
    await sinDialogos(p)
  })

  test('plugins: instalar, cambiar opciones, ver el resultado y quitar, con diálogos reales', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.visto = []
      window.nd.use({
        name: 'auditoria',
        beforeOpen: (o) => ({ ...o, title: `${o.title} (auditado)` }),
        afterOpen: (ctx) => window.visto.push('abrió:' + ctx.dialog.getAttribute('aria-label')),
        afterClose: (r) => window.visto.push('cerró:' + r.confirmed),
      })
      window.fin = window.nd.dialog.confirm({ title: 'Pagar' })
    })
    await expect(enDialogo(p, '.title')).toHaveText('Pagar (auditado)')
    await boton(p, 'confirm').click()
    await p.evaluate(() => window.fin)
    expect(await p.evaluate(() => window.visto)).toEqual(['abrió:Pagar (auditado)', 'cerró:true'])
    expect(await p.evaluate(() => window.nd.plugins())).toEqual(['auditoria'])
    await p.evaluate(() => window.nd.unuse('auditoria'))
    await p.evaluate(() => {
      window.fin = window.nd.dialog.confirm({ title: 'Pagar' })
    })
    await expect(enDialogo(p, '.title')).toHaveText('Pagar')
    await boton(p, 'cancel').click()
  })

  test('idiomas: registrar uno nuevo cambia botones y validaciones; pageLanguage() sigue a la página', async ({ pagina: p }) => {
    await p.evaluate(() => {
      window.nd.registerLanguage('pt', { ok: 'Entendi', cancel: 'Cancelar', required: 'Campo obrigatório.' })
      document.documentElement.lang = 'pt-BR'
      window.nd.configure({ lang: window.nd.pageLanguage() })
      window.fin = window.nd.form({ title: 'Cadastro', fields: [{ name: 'n', label: 'Nome', required: true }] })
    })
    await expect(boton(p, 'cancel')).toHaveText('Cancelar')
    await boton(p, 'confirm').click()
    await expect(enDialogo(p, '.msg').first()).toContainText('Campo obrigatório.')
    await boton(p, 'cancel').click()
    await p.evaluate(() => {
      document.documentElement.lang = ''
      window.nd.configure({ lang: 'es' })
    })
  })
})
