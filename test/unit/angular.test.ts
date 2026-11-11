// Angular: funciones de inyección y señales, probadas con inyectores reales de @angular/core (sin TestBed ni zone.js).
import { describe, expect, it } from 'vitest'
import { createEnvironmentInjector, Injector, runInInjectionContext, type EnvironmentInjector } from '@angular/core'
import { injectDialog, injectForm, injectToast, provideNexusDialogs } from '../../src/angular'
import { confirmDelete } from '../../src/patterns'
import { toast } from '../../src/toast'
import { configure, language } from '../../src/index'
import { $, abiertos, boton, escribir, esperar } from './utilidades'

/** Un «componente»: un inyector propio que se destruye como lo haría Angular al quitarlo de pantalla. */
function componente<T>(fn: () => T): { api: T; destruir: () => void } {
  const raiz = Injector.create({ providers: [] }) as EnvironmentInjector
  const inyector = createEnvironmentInjector([], raiz)
  return { api: runInInjectionContext(inyector, fn), destruir: () => inyector.destroy() }
}

describe('Angular', () => {
  it('provideNexusDialogs aplica la configuración y devuelve proveedores válidos', () => {
    const p = provideNexusDialogs({ lang: 'en', toast: { position: 'top-right' } })
    expect(p).toBeTruthy()
    expect(language()).toBe('en')
    configure({ lang: 'es' })
  })

  it('injectDialog: confirm, isOpen como señal y cierre al destruir el componente', async () => {
    const { api, destruir } = componente(() => injectDialog())
    expect(api.isOpen()).toBe(false)
    const p = api.confirm({ title: '¿Seguro?' })
    await esperar()
    expect(api.isOpen()).toBe(true)
    expect(abiertos()).toBe(1)
    destruir()
    expect(await p).toMatchObject({ confirmed: false, reason: 'program' })
    await esperar(300)
    expect(abiertos()).toBe(0)
  })

  it('el diálogo se resuelve normal si el componente sigue vivo', async () => {
    const { api, destruir } = componente(() => injectDialog())
    const p = api.confirm({ title: 'x' })
    await esperar()
    boton('confirm').click()
    expect(await p).toMatchObject({ confirmed: true })
    await esperar(300)
    expect(api.isOpen()).toBe(false)
    destruir()
  })

  it('scoped: las recetas también se cierran al destruir', async () => {
    const { api, destruir } = componente(() => {
      const d = injectDialog()
      return { borrar: d.scoped(confirmDelete) }
    })
    const p = api.borrar({ what: 'a Laura' })
    await esperar()
    expect(abiertos()).toBe(1)
    destruir()
    await p
    await esperar(300)
    expect(abiertos()).toBe(0)
  })

  it('injectForm: el formulario devuelve lo mismo que form() y se cierra al destruir', async () => {
    const a = componente(() => injectForm())
    const p = a.api.form({ title: 'Nuevo', fields: [{ name: 'n', label: 'Nombre' }] })
    await esperar()
    escribir($('input'), 'Ana')
    boton('confirm').click()
    expect(await p).toMatchObject({ confirmed: true, value: { n: 'Ana' } })
    const q = a.api.form({ title: 'Otro', fields: [{ name: 'n', label: 'Nombre' }] })
    await esperar()
    a.destruir()
    expect(await q).toMatchObject({ confirmed: false })
  })

  it('dos componentes a la vez: destruir uno no cierra el del otro', async () => {
    const a = componente(() => injectDialog())
    const b = componente(() => injectDialog())
    const pa = a.api.confirm({ title: 'A' })
    const pb = b.api.confirm({ title: 'B' })
    await esperar()
    expect(abiertos()).toBe(2)
    a.destruir()
    await pa
    await esperar(300)
    expect(abiertos()).toBe(1)
    expect(b.api.isOpen()).toBe(true)
    b.destruir()
    await pb
  })

  it('injectToast devuelve el toast global y no se cierra al destruir', () => {
    const t = componente(() => injectToast())
    expect(t.api).toBe(toast)
    t.destruir()
  })

  it('fuera de un contexto de inyección Angular avisa', () => {
    expect(() => injectDialog()).toThrow()
  })
})
