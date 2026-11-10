// Diagnóstico temporal: qué paso de bulkAction hace caer a Firefox.
import { expect, test } from './utilidades.mjs'

const abrir = (p, cuerpo) =>
  p.evaluate((cuerpo) => {
    window.listo = false
    nd.dialog.open({
      title: 'Diag',
      buttons: [{ id: 'run', text: 'Correr', variant: 'primary' }],
      render: () => {
        const d = document.createElement('div')
        d.textContent = 'contenido'
        return d
      },
      onAction: async (b, ctx) => {
        await new Function('ctx', `return (async () => { ${cuerpo} })()`)(ctx)
        window.listo = true
        return true
      },
    })
  }, cuerpo)

const casos = {
  titulo: `ctx.setTitle('Nuevo')`,
  quitarBotones: `ctx.setButtons([])`,
  reemplazarCuerpo: `ctx.body.firstChild.replaceChildren(document.createElement('p'))`,
  progressbar: `const b = document.createElement('div'); b.setAttribute('role','progressbar'); b.setAttribute('aria-valuemax','5'); ctx.body.append(b); for (let i=0;i<5;i++){ b.setAttribute('aria-valuenow', String(i)); await new Promise(r=>setTimeout(r,50)) }`,
  statusVivo: `const s = document.createElement('p'); s.setAttribute('role','status'); ctx.body.append(s); for (let i=0;i<5;i++){ s.textContent = i + ' de 5'; await new Promise(r=>setTimeout(r,50)) }`,
  botonesYFoco: `ctx.setButtons([]); await new Promise(r=>setTimeout(r,200)); ctx.setButtons([{ id: 'done', role: 'confirm', text: 'Cerrar' }]); ctx.button('done').focus()`,
}

for (const [nombre, cuerpo] of Object.entries(casos)) {
  test(`diag ${nombre}`, async ({ pagina: p, browserName }) => {
    test.skip(browserName !== 'firefox')
    await abrir(p, cuerpo)
    await p.locator('dialog button[data-id=run]').click()
    await p.waitForFunction(() => window.listo, null, { timeout: 5000 })
    await p.waitForTimeout(300)
    expect(await p.evaluate(() => 1)).toBe(1)
  })
}

test('diag bulkAction sin axe', async ({ pagina: p, browserName }) => {
  test.skip(browserName !== 'firefox')
  await p.click('#r-bulk')
  await p.locator('dialog button[data-id=run]').click()
  await expect(p.locator('dialog .results .bad')).toContainText('Pedro Salas')
})
