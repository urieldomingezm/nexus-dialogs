import { describe, expect, it, vi } from 'vitest'
import Swal from '../../src/swal'
import { $, $$, abiertos, boton, escribir, esperar, raiz } from './utilidades'

describe('adaptador de SweetAlert2', () => {
  it('Swal.fire(título, html, icono)', async () => {
    const p = Swal.fire('Guardado', 'Todo <b>bien</b>', 'success')
    await esperar()
    expect($('.title').textContent).toBe('Guardado')
    expect($('.html b').textContent).toBe('bien')
    expect($('.icon.i-success')).toBeTruthy()
    boton('confirm').click()
    expect(await p).toEqual({ isConfirmed: true, isDenied: false, isDismissed: false, value: true })
  })

  it('confirmación típica de borrado: se vuelve «peligro» sola y Cancelar recibe el foco', async () => {
    const p = Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertirlo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    })
    await esperar()
    expect(boton('confirm').className).toBe('btn btn-danger')
    expect(boton('cancel').className).toBe('btn btn-secondary')
    expect(raiz().activeElement).toBe(boton('cancel'))
    boton('cancel').click()
    expect(await p).toEqual({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: Swal.DismissReason.cancel })
  })

  it('showDenyButton: Guardar / No guardar / Cancelar', async () => {
    const p = Swal.fire({
      title: '¿Guardar cambios?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      denyButtonText: 'No guardar',
    })
    await esperar()
    expect($$('.foot button').map((b) => b.textContent)).toEqual(['Cancelar', 'No guardar', 'Guardar'])
    boton('deny').click()
    expect(await p).toEqual({ isConfirmed: false, isDenied: true, isDismissed: false, value: false })
  })

  it('Esc y clic fuera dan el motivo de SweetAlert2', async () => {
    let p = Swal.fire({ title: 'A' })
    await esperar()
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect((await p).dismiss).toBe('esc')
    p = Swal.fire({ title: 'B', allowOutsideClick: false })
    await esperar()
    $('.overlay').click()
    await esperar()
    expect(abiertos()).toBe(1)
    Swal.close()
    expect((await p).isDismissed).toBe(true)
  })

  it('input con inputValidator y preConfirm', async () => {
    const preConfirm = vi.fn(async (v: string) => ({ login: v }))
    const p = Swal.fire({
      title: 'Usuario de GitHub',
      input: 'text',
      inputLabel: 'Usuario',
      inputValidator: (v) => !v && '¡Escribe algo!',
      preConfirm,
    })
    await esperar()
    const input = $<HTMLInputElement>('input')
    expect(raiz().activeElement).toBe(input)
    expect(Swal.getInput()).toBe(input)
    boton('confirm').click()
    await esperar()
    expect($('.err').textContent).toBe('¡Escribe algo!')
    escribir(input, 'devmedina')
    boton('confirm').click()
    expect(await p).toMatchObject({ isConfirmed: true, value: { login: 'devmedina' } })
    expect(preConfirm).toHaveBeenCalledWith('devmedina')
  })

  it('select con inputOptions (objeto o promesa) y validación de correo', async () => {
    let p = Swal.fire({
      title: 'Área',
      input: 'select',
      inputOptions: Promise.resolve({ alm: 'Almacén', nom: 'Nómina' }),
      inputPlaceholder: 'Elige',
    })
    await esperar(5)
    const s = $<HTMLSelectElement>('select')
    expect([...s.options].map((o) => o.textContent)).toEqual(['Elige', 'Almacén', 'Nómina'])
    escribir(s, 'nom')
    boton('confirm').click()
    expect((await p).value).toBe('nom')

    p = Swal.fire({ input: 'email', validationMessage: 'Correo inválido' })
    await esperar()
    escribir($('input'), 'malo')
    boton('confirm').click()
    await esperar()
    expect($('.err').textContent).toBe('Correo inválido')
    Swal.close()
    await p
  })

  it('métodos estáticos: showValidationMessage, showLoading, getConfirmButton, clickConfirm', async () => {
    const p = Swal.fire({
      title: 'Timbrar',
      showCancelButton: true,
      preConfirm: () => {
        Swal.showValidationMessage('El SAT no responde')
        return false
      },
    })
    await esperar()
    expect(Swal.isVisible()).toBe(true)
    expect(Swal.getConfirmButton()).toBe(boton('confirm'))
    Swal.clickConfirm()
    await esperar()
    expect($('.err').textContent).toBe('El SAT no responde')
    Swal.resetValidationMessage()
    expect($('.err').hidden).toBe(true)
    Swal.showLoading()
    expect(Swal.isLoading()).toBe(true)
    Swal.hideLoading()
    Swal.update({ title: 'Nuevo' })
    expect($('.title').textContent).toBe('Nuevo')
    Swal.clickCancel()
    expect((await p).dismiss).toBe('cancel')
  })

  it('mixin + toast va a los toasts de nexus-dialogs', async () => {
    const Toast = Swal.mixin({ toast: true, position: 'top-end', timer: 30, showConfirmButton: false })
    const p = Toast.fire({ icon: 'success', title: 'Guardado' })
    const host = document.querySelector('[data-nexus-toast]') as HTMLElement
    expect(host.shadowRoot!.querySelector('li.success')!.textContent).toContain('Guardado')
    expect(host.shadowRoot!.querySelector('ol')!.classList.contains('top-right')).toBe(true)
    expect(await p).toEqual({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: 'timer' })
    expect(abiertos()).toBe(0)
  })
})
