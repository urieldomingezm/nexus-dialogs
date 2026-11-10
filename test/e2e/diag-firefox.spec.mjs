// Diagnóstico temporal (solo Firefox): estado del formulario de partidas al enviar.
import { boton, enDialogo, test } from './utilidades.mjs'

test('diag partidas firefox', async ({ pagina: p, browserName }) => {
  test.skip(browserName !== 'firefox')
  const log = []
  p.on('console', (m) => log.push(m.type() + ': ' + m.text()))
  await p.click('#c-items')
  await p.keyboard.type('PEM840101AB3')
  await p.keyboard.press('Tab')
  await p.keyboard.type('Hojas carta')
  await p.keyboard.press('Tab')
  await p.keyboard.press('Control+A')
  await p.keyboard.type('3')
  await p.keyboard.press('Tab')
  await p.keyboard.type('689')
  await p.keyboard.press('Tab')
  const foco1 = await p.evaluate(() => {
    const r = [...document.querySelectorAll('dialog [data-nexus-host]')].pop().shadowRoot
    return r.activeElement?.outerHTML.slice(0, 120)
  })
  await enDialogo(p, '.rows-foot button').click()
  const filas = await enDialogo(p, '.row[role=group]').count()
  await boton(p, 'confirm').click()
  await p.waitForTimeout(1500)
  const estado = await p.evaluate(() => {
    const r = [...document.querySelectorAll('dialog [data-nexus-host]')].pop()?.shadowRoot
    return {
      dialogos: document.querySelectorAll('dialog[data-nexus-dialog]').length,
      summary: r?.querySelector('.summary')?.outerHTML.slice(0, 300),
      err: r?.querySelector('.err')?.textContent,
      msgs: [...(r?.querySelectorAll('.msg') ?? [])].map((m) => m.textContent),
      ultimo: window.ultimo,
      busy: r?.querySelector('.panel')?.getAttribute('aria-busy'),
      confirm: r?.querySelector('button[data-role=confirm]')?.outerHTML,
    }
  })
  console.log('DIAG', JSON.stringify({ foco1, filas, estado, log }))
})
