// Matriz de compatibilidad con SweetAlert2: cada parámetro que `nexus-dialogs/swal` reconoce está clasificado en
// docs/swal-compat.md y los que dicen funcionar o ignorarse tienen una prueba que lo demuestra.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configure } from 'nexus-dialogs'
import Swal from '../../src/swal'
import { $, boton, esperar, raiz } from './utilidades'

beforeEach(() => configure({ strictHtml: false }))

const RAIZ = join(__dirname, '../..')
const fuente = readFileSync(join(RAIZ, 'src/swal.ts'), 'utf8')
const doc = readFileSync(join(RAIZ, 'docs/swal-compat.md'), 'utf8')

const reconocidos = fuente.match(/'(title titleText[^']+)'\.split/)![1].split(' ')
const filas = [...doc.matchAll(/^\|\s*`([A-Za-z]+)`\s*\|\s*(compatible|parcial|ignorado|sin soporte)\s*\|/gm)].map((m) => ({
  param: m[1],
  estado: m[2],
}))

describe('la matriz documentada coincide con el código', () => {
  it('todo parámetro reconocido está clasificado, una sola vez', () => {
    const clasificados = filas.map((f) => f.param)
    expect(
      reconocidos.filter((p) => !clasificados.includes(p)),
      'sin clasificar en docs/swal-compat.md',
    ).toEqual([])
    expect(
      clasificados.filter((p, i) => clasificados.indexOf(p) !== i),
      'repetidos',
    ).toEqual([])
  })

  it('no hay filas de parámetros que el código no conozca', () => {
    expect(filas.map((f) => f.param).filter((p) => !reconocidos.includes(p))).toEqual([])
  })

  it('isValidParameter reconoce exactamente los clasificados', () => {
    for (const { param } of filas) expect(Swal.isValidParameter(param), param).toBe(true)
    expect(Swal.isValidParameter('noExisteEnSweetAlert')).toBe(false)
  })

  it('cada parámetro «compatible» o «parcial» aparece en alguna prueba', () => {
    const pruebas = ['test/unit/swal.test.ts', 'test/unit/swal2.test.ts', 'test/unit/swal-matriz.test.ts', 'test/e2e/compat.spec.mjs']
      .map((f) => readFileSync(join(RAIZ, f), 'utf8').replace(/const reconocidos[\s\S]*?\n/, ''))
      .join('\n')
    const sinPrueba = filas
      .filter((f) => f.estado === 'compatible' || f.estado === 'parcial')
      .map((f) => f.param)
      .filter((p) => !new RegExp(`\\b${p}\\b`).test(pruebas))
    expect(sinPrueba).toEqual([])
  })
})

describe('compatibles que faltaban por probar', () => {
  it('titleText nunca interpreta HTML', async () => {
    const p = Swal.fire({ titleText: '<b>no negrita</b>' })
    await esperar()
    expect($('.title').textContent).toBe('<b>no negrita</b>')
    expect(raiz().querySelector('.title b')).toBeNull()
    Swal.close()
    await p
  })

  it('focusCancel y focusDeny llevan el foco a su botón', async () => {
    let p = Swal.fire({ title: 'a', showCancelButton: true, focusCancel: true })
    await esperar()
    expect(raiz().activeElement).toBe(boton('cancel'))
    Swal.close()
    await p
    p = Swal.fire({ title: 'b', showDenyButton: true, focusDeny: true })
    await esperar()
    expect(raiz().activeElement).toBe(boton('deny'))
    Swal.close()
    await p
  })

  it('preDeny se ejecuta al negar y su resultado es el value', async () => {
    const preDeny = vi.fn(() => 'negado')
    const p = Swal.fire({ title: 'x', showDenyButton: true, preDeny })
    await esperar()
    boton('deny').click()
    const r = await p
    expect(preDeny).toHaveBeenCalledTimes(1)
    expect(r.isDenied).toBe(true)
    expect(r.value).toBe('negado')
  })

  it('preDeny que devuelve false mantiene el diálogo abierto', async () => {
    const p = Swal.fire({ title: 'x', showDenyButton: true, preDeny: () => false })
    await esperar()
    boton('deny').click()
    await esperar(20)
    expect(document.querySelectorAll('dialog[data-nexus-dialog]').length).toBe(1)
    Swal.close()
    await p
  })

  it('willOpen y didRender se llaman', async () => {
    const willOpen = vi.fn()
    const didRender = vi.fn()
    const p = Swal.fire({ title: 'x', willOpen, didRender })
    await esperar()
    expect(willOpen).toHaveBeenCalled()
    expect(didRender).toHaveBeenCalled()
    Swal.close()
    await p
  })

  it('imageHeight, progressStepsDistance y los aria-label de Negar y Cancelar', async () => {
    const p = Swal.fire({
      title: 'x',
      imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      imageHeight: 40,
      progressSteps: ['1', '2'],
      progressStepsDistance: '3em',
      showDenyButton: true,
      showCancelButton: true,
      denyButtonAriaLabel: 'Negar la solicitud',
      cancelButtonAriaLabel: 'Cancelar la solicitud',
    })
    await esperar()
    expect(raiz().querySelector('img')!.getAttribute('height') ?? (raiz().querySelector('img') as HTMLElement).style.height).toMatch(/40/)
    expect(raiz().querySelector<HTMLElement>('.swal-steps')!.style.getPropertyValue('--swal-d')).toBe('3em')
    expect(boton('deny').getAttribute('aria-label')).toBe('Negar la solicitud')
    expect(boton('cancel').getAttribute('aria-label')).toBe('Cancelar la solicitud')
    Swal.close()
    await p
  })
})

describe('parámetros que se aceptan y se ignoran a propósito', () => {
  const IGNORADOS: Record<string, unknown> = {
    confirmButtonColor: '#ff0000',
    denyButtonColor: '#00ff00',
    cancelButtonColor: '#0000ff',
    buttonsStyling: false,
    customClass: { popup: 'mi-clase', confirmButton: 'otro' },
    background: '#123456',
    color: '#fedcba',
    padding: '3em',
    iconColor: '#ff00ff',
    backdrop: false,
    grow: 'fullscreen',
    heightAuto: false,
    scrollbarPadding: false,
    stopKeydownPropagation: false,
    keydownListenerCapture: true,
    showLoaderOnConfirm: true,
    showLoaderOnDeny: true,
    focusConfirm: false,
    returnFocus: false,
  }

  it.each(Object.entries(IGNORADOS))('%s: no lanza y no cambia el aspecto estándar', async (param, valor) => {
    const p = Swal.fire({ title: 'x', icon: 'info', showCancelButton: true, [param]: valor } as never)
    await esperar()
    const panel = $('.panel')
    expect(panel.className).not.toContain('mi-clase')
    expect(panel.getAttribute('style') ?? '').not.toMatch(/123456|fedcba|3em/)
    expect(boton('confirm').className).toBe('btn btn-primary')
    expect(boton('confirm').getAttribute('style') ?? '').toBe('')
    Swal.close()
    await p
  })
})

describe('sin soporte: se aceptan en las opciones pero no hacen nada', () => {
  it.each(['animation', 'showClass', 'hideClass', 'topLayer'])('%s', async (param) => {
    const p = Swal.fire({ title: 'x', [param]: param === 'animation' || param === 'topLayer' ? false : { popup: 'x' } } as never)
    await esperar()
    expect(document.querySelectorAll('dialog[data-nexus-dialog]').length).toBe(1)
    Swal.close()
    await p
  })
})
