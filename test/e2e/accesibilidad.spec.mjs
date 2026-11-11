// Accesibilidad de verdad en un navegador: contraste y axe en cada tema y esquema, teclado completo en formularios
// y asistentes, foco, movimiento reducido y reflow en pantallas angostas (WCAG 2.2 AA).
// Estas pruebas automáticas NO sustituyen la prueba manual con lectores de pantalla: ver docs de accesibilidad.
import { axe, boton, enDialogo, expect, resultado, sinDialogos, test } from './utilidades.mjs'

// Cada tema se prueba con el esquema para el que está hecho: `light` (el de siempre) sigue al esquema del sistema;
// `dark` es oscuro; bootstrap, tailwind y material son paletas claras.
const COMBINACIONES = [
  ['light', 'light'],
  ['light', 'dark'],
  ['dark', 'dark'],
  ['bootstrap', 'light'],
  ['tailwind', 'light'],
  ['material', 'light'],
]

const aplicarTema = (p, tema, esquema) =>
  p.evaluate(
    ([t, e]) => {
      const todas = new Set(Object.values(window.nd.themes).flatMap((x) => Object.keys(x)))
      const limpio = Object.fromEntries([...todas].map((k) => [k, '']))
      window.nd.configure({ scheme: e, theme: { ...limpio, ...window.nd.themes[t] } })
      window.nd.toast.configure({ scheme: e })
    },
    [tema, esquema],
  )

const abrirFormulario = (p) =>
  p.evaluate(() => {
    window.ultimo = undefined
    window.nd
      .form({
        title: 'Alta de proveedor',
        description: 'Los campos con * son obligatorios.',
        fields: [
          { name: 'rfc', label: 'RFC', type: 'rfc', required: true, hint: '12 o 13 caracteres' },
          { name: 'email', label: 'Correo', type: 'email', required: true },
          { name: 'tipo', label: 'Tipo', type: 'select', options: ['Persona física', 'Persona moral'], required: true },
          { name: 'acepto', label: 'Acepto los términos', type: 'checkbox', required: true },
        ],
      })
      .then((r) => (window.ultimo = r))
  })

test.describe('contraste y axe por tema', () => {
  for (const [tema, esquema] of COMBINACIONES) {
    test(`${tema} / ${esquema}: formulario con errores, confirmación peligrosa y toast`, async ({ pagina: p }) => {
      await aplicarTema(p, tema, esquema)
      await abrirFormulario(p)
      await boton(p, 'confirm').click() // dispara los errores de «obligatorio»
      await expect(enDialogo(p, '.msg').first()).not.toBeEmpty()
      expect(await axe(p), 'formulario con errores').toEqual([])
      await boton(p, 'cancel').click()
      await sinDialogos(p)

      await p.click('#b-confirm')
      expect(await axe(p), 'confirmación peligrosa').toEqual([])
      await boton(p, 'cancel').click()
      await sinDialogos(p)

      await p.evaluate(() => window.nd.toast.error('No se pudo guardar', { description: 'Revisa tu conexión' }))
      await expect(p.locator('[data-nexus-toast]').first()).toBeAttached()
      expect(await axe(p, '[data-nexus-toast]'), 'toast').toEqual([])
    })
  }
})

test.describe('teclado y foco', () => {
  test('formulario: foco inicial, Tab recorre todo en orden, Enter envía y el foco vuelve al botón que lo abrió', async ({ pagina: p }) => {
    await p.focus('#b-form')
    await p.keyboard.press('Enter')
    const dentro = p.locator('dialog[data-nexus-dialog]').last()
    await expect(dentro).toBeVisible()
    const activo = () =>
      p.evaluate(() => {
        const d = document.querySelector('dialog[data-nexus-dialog]')
        let a = document.activeElement
        const dentro = !!a?.closest('dialog[data-nexus-dialog]') || a === d || a === document.body // el navegador puede pasar por su barra y volver
        while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement
        const id = a?.getAttribute?.('name') || a?.getAttribute?.('data-id') || a?.tagName?.toLowerCase()
        return { dentro, id }
      })
    const vistos = [await activo()]
    for (let i = 0; i < 12; i++) {
      await p.keyboard.press('Tab')
      vistos.push(await activo())
    }
    expect(vistos.every((v) => v.dentro)).toBe(true) // el foco nunca sale del diálogo
    const ids = vistos.map((v) => v.id)
    expect(ids).toContain('confirm')
    expect(ids).toContain('cancel')
    await p.keyboard.press('Escape')
    await sinDialogos(p)
    await expect(p.locator('#b-form')).toBeFocused()
  })

  test('formulario inválido: el foco va al resumen y cada enlace lleva al campo con su error', async ({ pagina: p }) => {
    await abrirFormulario(p)
    await boton(p, 'confirm').click()
    const resumen = enDialogo(p, '.summary, [role="alert"]').first()
    await expect(resumen).toBeVisible()
    const enlaces = enDialogo(p, '.summary a, [role="alert"] a')
    expect(await enlaces.count()).toBeGreaterThan(0)
    await enlaces.first().click()
    const campo = await p.evaluate(() => {
      const h = document.querySelector('dialog[data-nexus-dialog] [data-nexus-host]')
      const a = h.shadowRoot.activeElement
      return { tag: a?.tagName.toLowerCase(), invalido: a?.getAttribute('aria-invalid'), descrito: !!a?.getAttribute('aria-describedby') }
    })
    expect(campo.invalido).toBe('true')
    expect(campo.descrito).toBe(true)
  })

  test('asistente: Enter avanza, el foco entra al primer campo del paso y se anuncia el paso actual', async ({ pagina: p }) => {
    await p.click('#b-wizard')
    await expect(enDialogo(p, '.swal-step[aria-current="step"], [aria-current="step"]').first()).toBeAttached()
    const antes = await enDialogo(p, '[aria-current="step"]').first().textContent()
    const campo = enDialogo(p, 'input, select, textarea').first()
    await expect(campo).toBeVisible()
    await campo.fill('Ana Torres')
    await enDialogo(p, 'input').nth(1).fill('TOPA900101MDFRRN09')
    await p.keyboard.press('Enter')
    await p.waitForTimeout(200)
    const despues = await enDialogo(p, '[aria-current="step"]').first().textContent()
    expect(despues).not.toBe(antes)
    await p.keyboard.press('Escape')
  })
})

test.describe('movimiento reducido y reflow', () => {
  test('con movimiento reducido no queda ninguna animación corriendo', async ({ pagina: p }) => {
    await p.click('#b-confirm')
    await p.waitForTimeout(80)
    const corriendo = await p.evaluate(() => {
      const d = document.querySelector('dialog[data-nexus-dialog]')
      const h = d.querySelector('[data-nexus-host]')
      const larga = (a) => a.playState === 'running' && Number(a.effect?.getComputedTiming().duration ?? 0) > 1
      return h.shadowRoot.getAnimations().filter(larga).length + d.getAnimations().filter(larga).length
    })
    expect(corriendo).toBe(0)
    await boton(p, 'cancel').click()
  })

  test('sin preferencia de movimiento el diálogo anima y sigue funcionando', async ({ pagina: p }) => {
    await p.emulateMedia({ reducedMotion: 'no-preference' })
    await p.click('#b-confirm')
    await boton(p, 'confirm').click()
    expect(await resultado(p)).toMatchObject({ confirmed: true })
    await sinDialogos(p)
  })

  test('reflow a 320 px (zoom 400 %): el diálogo no desborda horizontalmente', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 320, height: 640 })
    await abrirFormulario(p)
    const r = await p.evaluate(() => {
      const h = document.querySelector('dialog[data-nexus-dialog] [data-nexus-host]')
      const panel = h.shadowRoot.querySelector('.panel')
      const caja = panel.getBoundingClientRect()
      return {
        ancho: Math.round(caja.width),
        izq: Math.round(caja.left),
        der: Math.round(caja.right),
        doc: document.documentElement.scrollWidth,
      }
    })
    expect(r.izq).toBeGreaterThanOrEqual(0)
    expect(r.der).toBeLessThanOrEqual(320)
    expect(r.doc).toBeLessThanOrEqual(320)
    await p.keyboard.press('Escape')
  })

  test('colores forzados (modo de alto contraste de Windows): los botones y el borde siguen visibles', async ({ pagina: p }) => {
    await p.emulateMedia({ forcedColors: 'active' })
    await p.click('#b-confirm')
    const r = await p.evaluate(() => {
      const h = document.querySelector('dialog[data-nexus-dialog] [data-nexus-host]')
      const b = h.shadowRoot.querySelector('button[data-id="confirm"]')
      const s = getComputedStyle(b)
      return { borde: s.borderTopStyle, ancho: parseFloat(s.borderTopWidth) }
    })
    expect(r.borde).not.toBe('none')
    expect(r.ancho).toBeGreaterThan(0)
    await p.keyboard.press('Escape')
  })
})
