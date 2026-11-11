// Política de HTML: los textos se insertan siempre como texto; el HTML en cadena solo entra por `html` y pasa por `sanitize`.
import { afterEach, describe, expect, it } from 'vitest'
import { dialog, configure } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'
import Swal from '../../src/swal'
import { $, boton, esperar, raiz } from './utilidades'

const ATAQUE = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script><b>negrita</b>'
const identidad = (s: string) => s

afterEach(() => {
  configure({ sanitize: identidad })
  delete (window as any).__xss
})

describe('textos: siempre texto, nunca HTML', () => {
  it('title y text de un diálogo no crean elementos', async () => {
    const p = dialog.confirm({ title: ATAQUE, text: ATAQUE })
    expect(raiz().querySelector('img, script, b')).toBeNull()
    expect($('.title').textContent).toBe(ATAQUE)
    expect($('.text').textContent).toBe(ATAQUE)
    boton('cancel').click()
    await p
  })

  it('etiquetas, ayudas y errores de un formulario no crean elementos', async () => {
    const p = form({
      title: ATAQUE,
      fields: [{ name: 'a', label: ATAQUE, type: 'text', hint: ATAQUE, required: true }],
    })
    expect(raiz().querySelector('img, script, b')).toBeNull()
    boton('confirm').click()
    await esperar()
    expect(raiz().querySelector('img, script, b')).toBeNull()
    boton('cancel').click()
    await p
  })

  it('un toast no interpreta su mensaje como HTML', async () => {
    toast({ title: ATAQUE, text: ATAQUE })
    await esperar(5)
    const host = document.querySelector('[data-nexus-toast]') as HTMLElement
    expect(host.shadowRoot?.querySelector('img, script, b') ?? host.querySelector('img, script, b')).toBeNull()
  })

  it('el adaptador swal tampoco interpreta title, text ni footer', async () => {
    const p = Swal.fire({ title: ATAQUE, text: ATAQUE, footer: ATAQUE })
    await esperar()
    expect(raiz().querySelector('img, script, b')).toBeNull()
    Swal.close()
    await p
  })
})

describe('html en cadena: responsabilidad de quien lo pasa, con gancho sanitize', () => {
  it('sin sanitize se inserta tal cual (documentado)', async () => {
    const p = dialog.alert({ html: '<b>hola</b>' })
    expect($('.html b').textContent).toBe('hola')
    boton('confirm').click()
    await p
  })

  it('con sanitize, el filtro recibe la cadena y se inserta su resultado', async () => {
    const vistos: string[] = []
    configure({
      sanitize: (s) => {
        vistos.push(s)
        return s.replace(/<(script|img)[^>]*>/gi, '')
      },
    })
    const p = dialog.alert({ html: ATAQUE })
    expect(vistos).toEqual([ATAQUE])
    expect(raiz().querySelector('img, script')).toBeNull()
    expect($('.html b').textContent).toBe('negrita')
    boton('confirm').click()
    await p
  })

  it('swal: html, iconHtml y closeButtonHtml pasan por el filtro', async () => {
    const vistos: string[] = []
    configure({ sanitize: (s) => (vistos.push(s), '[limpio]') })
    const p = Swal.fire({ html: ATAQUE, iconHtml: '<i>x</i>', icon: 'info', showCloseButton: true, closeButtonHtml: '<u>c</u>' })
    await esperar()
    for (const v of [ATAQUE, '<i>x</i>', '<u>c</u>']) expect(vistos).toContain(v)
    expect(raiz().querySelector('img, script, i, u')).toBeNull()
    Swal.close()
    await p
  })

  it('un Node se inserta tal cual: es contenido que ya construyó quien llama', async () => {
    configure({ sanitize: () => 'no debe usarse' })
    const n = document.createElement('em')
    n.textContent = 'mío'
    const p = dialog.alert({ html: n })
    expect($('.html em').textContent).toBe('mío')
    boton('confirm').click()
    await p
  })
})
