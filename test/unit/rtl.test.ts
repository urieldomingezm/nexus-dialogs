// Derecha a izquierda: la dirección sale de la página o de `configure({ dir })` y llega al Shadow DOM.
import { afterEach, describe, expect, it } from 'vitest'
import { configure, dialog } from '../../src/index'
import { toast } from '../../src/toast'
import { form } from '../../src/forms'
import { CORE_CSS } from '../../src/styles'
import { $, $$, boton, esperar, raiz } from './utilidades'

const dirDelHost = () => raiz().host.getAttribute('dir')

afterEach(() => {
  configure({ dir: 'auto' })
  document.documentElement.removeAttribute('dir')
})

describe('derecha a izquierda (RTL)', () => {
  it('por omisión sigue a la página y sin dir es ltr', async () => {
    const p = dialog.alert({ title: 'Hola' })
    await esperar()
    expect(dirDelHost()).toBe('ltr')
    boton('confirm').click()
    await p
  })

  it('<html dir="rtl"> pone el diálogo en rtl', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const p = dialog.alert({ title: 'مرحبا' })
    await esperar()
    expect(dirDelHost()).toBe('rtl')
    boton('confirm').click()
    await p
  })

  it('configure({ dir }) y la opción dir de un diálogo mandan sobre la página', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    configure({ dir: 'ltr' })
    let p = dialog.alert({ title: 'x' })
    await esperar()
    expect(dirDelHost()).toBe('ltr')
    boton('confirm').click()
    await p
    configure({ dir: 'auto' })
    p = dialog.alert({ title: 'x', dir: 'ltr' })
    await esperar()
    expect(dirDelHost()).toBe('ltr')
    boton('confirm').click()
    await p
  })

  it('los toasts toman la dirección de la página', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    toast('مرحبا')
    const host = document.querySelector('[data-nexus-toast]')!
    expect(host.getAttribute('dir')).toBe('rtl')
    toast.dismissAll?.()
  })

  it('el CSS usa propiedades lógicas: el botón × va al final y el temporizador reacciona a rtl', () => {
    expect(CORE_CSS).toContain('inset-inline-end:12px')
    expect(CORE_CSS).toContain(':host([dir=rtl]) .timer')
    expect(CORE_CSS).not.toMatch(/\.x\{[^}]*\bright:12px/)
    expect(CORE_CSS).not.toMatch(/padding-right|margin-right|padding-left|margin-left/)
  })

  it('el calendario invierte las flechas izquierda y derecha en rtl', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const p = form({ title: 'x', fields: [{ name: 'f', label: 'Fecha', type: 'date', calendar: true, value: '2026-03-10' }] })
    await esperar()
    $('.cal-btn').click()
    await esperar()
    const dia = $$('.cal-day').find((d) => d.getAttribute('data-iso') === '2026-03-10' || d.textContent === '10')!
    dia.focus()
    dia.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await esperar()
    expect(raiz().activeElement?.textContent).toBe('11')
    boton('cancel').click()
    await p
  })
})
