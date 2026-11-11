// Paridad con SweetAlert2: acceso a las piezas, update, close(resultado), timers, campos y opciones nuevas.
import { describe, expect, it, vi } from 'vitest'
import Swal from '../../src/swal'
import { $, $$, abiertos, boton, escribir, esperar, raiz } from './utilidades'

describe('swal: acceso a las piezas', () => {
  it('getters devuelven el contenido del diálogo abierto', async () => {
    const p = Swal.fire({
      title: 'Hola',
      html: '<b id="x">dentro</b>',
      icon: 'info',
      footer: 'pie',
      showCloseButton: true,
      showCancelButton: true,
    })
    await esperar()
    expect(Swal.getContainer()).toBe(document.querySelector('dialog[data-nexus-dialog]'))
    expect(Swal.getPopup()).toBe($('.panel'))
    expect(Swal.getTitle()!.textContent).toBe('Hola')
    expect(Swal.getHtmlContainer()!.querySelector('#x')!.textContent).toBe('dentro')
    expect(Swal.getPopup()!.querySelector('#x')).toBeTruthy()
    expect(Swal.getIcon()).toBeTruthy()
    expect(Swal.getIconContent()).toBeTruthy()
    expect(Swal.getFooter()!.textContent).toBe('pie')
    expect(Swal.getCloseButton()).toBeTruthy()
    expect(Swal.getActions()).toBeTruthy()
    expect(Swal.getValidationMessage()).toBeTruthy()
    expect(Swal.getFocusableElements().length).toBeGreaterThan(0)
    Swal.clickCancel()
    await p
    expect(Swal.getTitle()).toBeNull()
    expect(Swal.getFocusableElements()).toEqual([])
  })

  it('los callbacks reciben el panel y willClose se llama antes de cerrar', async () => {
    const orden: string[] = []
    let panel: HTMLElement | undefined
    const p = Swal.fire({
      title: 'x',
      didOpen: (el) => ((panel = el), orden.push('didOpen')),
      willClose: (el) => orden.push(el === panel ? 'willClose(panel)' : 'willClose(otro)'),
      didClose: () => orden.push('didClose'),
      didDestroy: () => orden.push('didDestroy'),
    })
    await esperar()
    expect(panel!.classList.contains('panel')).toBe(true)
    boton('confirm').click()
    await p
    expect(orden).toEqual(['didOpen', 'willClose(panel)', 'didClose', 'didDestroy'])
  })
})

describe('swal: update y close(resultado)', () => {
  it('update cambia título, texto, html, icono, pie y botones', async () => {
    const p = Swal.fire({ title: 'Cargando', text: 'espera', icon: 'info' })
    await esperar()
    Swal.update({
      title: 'Listo',
      text: undefined,
      html: '<i>ok</i>',
      icon: 'success',
      footer: 'fin',
      showCancelButton: true,
      cancelButtonText: 'Nop',
    })
    expect($('.title').textContent).toBe('Listo')
    expect($('.text:not(.html)')).toBeNull()
    expect($('.html i').textContent).toBe('ok')
    expect($('.icon.i-success')).toBeTruthy()
    expect($('.note').textContent).toBe('fin')
    expect(boton('cancel').textContent).toBe('Nop')
    expect(raiz().host.closest('dialog')!.getAttribute('aria-label')).toBe('Listo')
    Swal.update({ showConfirmButton: false, footer: undefined })
    expect(boton('confirm')).toBeNull()
    expect($('.note')).toBeNull()
    Swal.clickCancel()
    expect((await p).dismiss).toBe('cancel')
  })

  it('update avisa de lo que no se puede cambiar', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const p = Swal.fire({ title: 'x' })
    await esperar()
    Swal.update({ input: 'text' } as any)
    expect(aviso).toHaveBeenCalled()
    aviso.mockRestore()
    Swal.close()
    await p
  })

  it('close(resultado) resuelve fire con ese resultado', async () => {
    const p = Swal.fire({ title: 'x' })
    await esperar()
    Swal.close({ isConfirmed: true, value: 42 })
    expect(await p).toEqual({ isConfirmed: true, isDenied: false, isDismissed: false, value: 42 })
    expect(abiertos()).toBe(0)
  })

  it('close() sin resultado cuenta como cerrada', async () => {
    const p = Swal.fire({ title: 'x' })
    await esperar()
    Swal.close()
    expect(await p).toMatchObject({ isConfirmed: false, isDismissed: true })
  })

  it('close no toca diálogos que no son de Swal', async () => {
    Swal.close()
    expect(abiertos()).toBe(0)
  })
})

describe('swal: campos', () => {
  it('inputAutoTrim recorta por omisión y se puede apagar', async () => {
    let p = Swal.fire({ input: 'text' })
    await esperar()
    escribir($('input'), '  hola  ')
    boton('confirm').click()
    expect((await p).value).toBe('hola')
    p = Swal.fire({ input: 'text', inputAutoTrim: false })
    await esperar()
    escribir($('input'), '  hola  ')
    boton('confirm').click()
    expect((await p).value).toBe('  hola  ')
  })

  it('returnInputValueOnDeny devuelve el texto al denegar', async () => {
    const p = Swal.fire({ input: 'text', showDenyButton: true, returnInputValueOnDeny: true })
    await esperar()
    escribir($('input'), 'abc')
    boton('deny').click()
    expect(await p).toEqual({ isConfirmed: false, isDenied: true, isDismissed: false, value: 'abc' })
  })

  it('range muestra el valor y week y file se pintan', async () => {
    const p = Swal.fire({ input: 'range', inputValue: 40, inputAttributes: { min: '0', max: '100' } })
    await esperar()
    expect($('output').textContent).toBe('40')
    escribir($('input'), '70')
    expect($('output').textContent).toBe('70')
    boton('confirm').click()
    expect((await p).value).toBe('70')
    const q = Swal.fire({ input: 'week' })
    await esperar()
    expect($<HTMLInputElement>('input').type).toBe('week')
    Swal.close()
    await q
    const f = Swal.fire({ input: 'file' })
    await esperar()
    expect($<HTMLInputElement>('input').type).toBe('file')
    boton('confirm').click()
    expect((await f).value).toBeNull()
  })

  it('inputAutoFocus: false deja el foco en el botón', async () => {
    const p = Swal.fire({ input: 'text', inputAutoFocus: false })
    await esperar()
    expect(raiz().activeElement).toBe(boton('confirm'))
    Swal.close()
    await p
  })

  it('enableInput y disableInput', async () => {
    const p = Swal.fire({ input: 'text' })
    await esperar()
    Swal.disableInput()
    expect(Swal.getInput()).toHaveProperty('disabled', true)
    Swal.enableInput()
    expect(Swal.getInput()).toHaveProperty('disabled', false)
    Swal.close()
    await p
  })

  it('enableButtons y disableButtons', async () => {
    const p = Swal.fire({ title: 'x', showCancelButton: true })
    await esperar()
    Swal.disableButtons()
    expect($$('.foot button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
    Swal.enableButtons()
    expect($$('.foot button').some((b) => (b as HTMLButtonElement).disabled)).toBe(false)
    Swal.clickCancel()
    await p
  })
})

describe('swal: contenido', () => {
  it('imageUrl, iconHtml y progressSteps', async () => {
    const p = Swal.fire({
      title: 'Paso',
      icon: 'info',
      iconHtml: '<b>?</b>',
      imageUrl: 'https://example.com/a.png',
      imageWidth: 120,
      imageAlt: 'logo',
      progressSteps: ['1', '2', '3'],
      currentProgressStep: 1,
    })
    await esperar()
    expect(Swal.getImage()!.getAttribute('alt')).toBe('logo')
    expect(Swal.getImage()!.style.width).toBe('120px')
    expect(Swal.getIconContent()).toBeNull()
    expect($('.icon b').textContent).toBe('?')
    const pasos = $$('.swal-step')
    expect(pasos).toHaveLength(3)
    expect(pasos[0]!.classList.contains('is-done')).toBe(true)
    expect(pasos[1]!.getAttribute('aria-current')).toBe('step')
    expect(Swal.getProgressSteps()).toBeTruthy()
    Swal.update({ currentProgressStep: 2 })
    expect($$('.swal-step')[2]!.getAttribute('aria-current')).toBe('step')
    Swal.clickConfirm()
    await p
  })

  it('reverseButtons, aria-labels, closeButtonHtml y allowEnterKey', async () => {
    const p = Swal.fire({
      title: 'x',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonAriaLabel: 'Aceptar todo',
      showCloseButton: true,
      closeButtonAriaLabel: 'Cerrar ya',
      closeButtonHtml: '&times;',
    })
    await esperar()
    expect($$('.foot button').map((b) => b.dataset.id)).toEqual(['confirm', 'cancel'])
    expect(boton('confirm').getAttribute('aria-label')).toBe('Aceptar todo')
    expect(Swal.getCloseButton()!.getAttribute('aria-label')).toBe('Cerrar ya')
    expect(Swal.getCloseButton()!.innerHTML).toBe('×')
    Swal.clickCancel()
    await p

    const q = Swal.fire({ input: 'text', allowEnterKey: false })
    await esperar()
    $('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }))
    await esperar()
    expect(abiertos()).toBe(1)
    Swal.close()
    await q
  })

  it('theme, target y draggable', async () => {
    const zona = document.createElement('div')
    document.body.appendChild(zona)
    const p = Swal.fire({ title: 'x', theme: 'dark', target: zona, draggable: true })
    await esperar()
    expect(zona.querySelector('dialog')).toBeTruthy()
    expect(raiz().host.getAttribute('data-scheme')).toBe('dark')
    expect($('.head').classList.contains('drag')).toBe(true)
    Swal.clickConfirm()
    await p
    const q = Swal.fire({ title: 'y', target: '#no-existe' })
    await esperar()
    expect(document.body.querySelector(':scope > dialog')).toBeTruthy()
    Swal.clickConfirm()
    await q
  })

  it('template lee swal-title, swal-html, swal-button y swal-param', async () => {
    document.body.innerHTML = `<template id="t"><swal-title>Desde plantilla</swal-title><swal-html><b>hola</b></swal-html>
      <swal-icon>warning</swal-icon><swal-button type="confirm">Sí</swal-button><swal-button type="cancel" aria-label="No gracias">No</swal-button>
      <swal-param name="allowEscapeKey" value="false" /></template>`
    const p = Swal.fire({ template: '#t', title: 'Mío' })
    await esperar()
    expect($('.title').textContent).toBe('Mío')
    expect($('.html b').textContent).toBe('hola')
    expect($('.icon.i-warning')).toBeTruthy()
    expect(boton('confirm').textContent).toBe('Sí')
    expect(boton('cancel').getAttribute('aria-label')).toBe('No gracias')
    Swal.clickCancel()
    await p
  })
})

describe('swal: timer', () => {
  it('stop, resume, toggle, increase y left', async () => {
    const p = Swal.fire({ title: 'x', timer: 5000 })
    await esperar()
    expect(Swal.isTimerRunning()).toBe(true)
    const antes = Swal.getTimerLeft()!
    expect(antes).toBeGreaterThan(4000)
    expect(Swal.stopTimer()).toBeGreaterThan(4000)
    expect(Swal.isTimerRunning()).toBe(false)
    const parado = Swal.getTimerLeft()!
    await esperar(30)
    expect(Swal.getTimerLeft()).toBe(parado)
    expect(Swal.increaseTimer(1000)).toBeGreaterThanOrEqual(parado + 1000)
    expect(Swal.toggleTimer()).toBeGreaterThan(0)
    expect(Swal.isTimerRunning()).toBe(true)
    Swal.toggleTimer()
    expect(Swal.isTimerRunning()).toBe(false)
    Swal.close()
    await p
  })

  it('sin timer devuelven undefined', async () => {
    const p = Swal.fire({ title: 'x' })
    await esperar()
    expect(Swal.getTimerLeft()).toBeUndefined()
    expect(Swal.stopTimer()).toBeUndefined()
    expect(Swal.isTimerRunning()).toBeUndefined()
    expect(Swal.getTimerProgressBar()).toBeNull()
    Swal.close()
    await p
  })

  it('un timer detenido no se reanuda solo ni cierra el diálogo', async () => {
    const p = Swal.fire({ title: 'x', timer: 40 })
    await esperar()
    Swal.stopTimer()
    await esperar(120)
    expect(abiertos()).toBe(1)
    Swal.resumeTimer()
    expect(await p).toMatchObject({ dismiss: 'timer' })
  })

  it('increaseTimer alarga la espera', async () => {
    const t0 = performance.now()
    const p = Swal.fire({ title: 'x', timer: 40 })
    await esperar()
    Swal.increaseTimer(80)
    const r = await p
    expect(r.dismiss).toBe('timer')
    expect(performance.now() - t0).toBeGreaterThanOrEqual(110)
  })
})
