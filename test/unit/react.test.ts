import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { createElement, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { NexusDialogsProvider, useDialog, useForm, useToast } from '../../src/react'
import { confirmDelete } from '../../src/patterns'
import { toast } from '../../src/toast'
import { configure, dialog, language } from '../../src/index'
import { $, abiertos, boton, escribir, esperar } from './utilidades'

// `act` salió de `react` en la 18.3; antes vivía en `react-dom/test-utils` (así se prueban también las 18.0 a 18.2).
const act: (fn: () => unknown) => Promise<void> =
  (React as unknown as { act?: typeof act }).act ?? ((await import('react-dom/test-utils')) as unknown as { act: typeof act }).act

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Monta un componente que llama al hook y deja `api.actual` con lo último que devolvió. */
async function montar<T>(hook: () => T, opciones: { strict?: boolean; envolver?: (n: ReactNode) => ReactNode } = {}) {
  const api = { actual: undefined as unknown as T, renders: 0 }
  function Componente() {
    api.actual = hook()
    api.renders++
    return null
  }
  const el = document.createElement('div')
  document.body.appendChild(el)
  const root = createRoot(el)
  let nodo: ReactNode = createElement(Componente)
  if (opciones.envolver) nodo = opciones.envolver(nodo)
  if (opciones.strict) nodo = createElement(StrictMode, null, nodo)
  await act(async () => root.render(nodo))
  return { api, desmontar: () => act(async () => root.unmount()) }
}

describe('React', () => {
  it('useDialog: abre, avisa con isOpen y cierra al desmontar el componente', async () => {
    const { api, desmontar } = await montar(() => ({ ...useDialog(), toast: useToast() }))
    let p!: Promise<unknown>
    await act(async () => {
      p = api.actual.confirm({ title: '¿Seguro?' })
    })
    expect(abiertos()).toBe(1)
    expect(api.actual.isOpen).toBe(true)
    await desmontar()
    expect(await p).toMatchObject({ confirmed: false, reason: 'program' })
    expect(abiertos()).toBe(0)
    expect(api.actual.toast).toBe(toast)
  })

  it('cerrar normalmente actualiza isOpen', async () => {
    const { api, desmontar } = await montar(() => useDialog())
    let p!: Promise<unknown>
    await act(async () => {
      p = api.actual.alert('Hola')
    })
    expect(api.actual.isOpen).toBe(true)
    await act(async () => {
      boton('confirm').click()
      await p
      await esperar(300)
    })
    expect(api.actual.isOpen).toBe(false)
    await desmontar()
  })

  it('las funciones son estables entre renders y isOpen vuelve a renderizar', async () => {
    const { api, desmontar } = await montar(() => useDialog())
    const antes = api.actual
    let p!: Promise<unknown>
    await act(async () => {
      p = antes.confirm({ title: 'x' })
    })
    expect(api.actual).not.toBe(antes)
    expect(api.actual.confirm).toBe(antes.confirm)
    expect(api.actual.scoped).toBe(antes.scoped)
    expect(api.actual.closeAll).toBe(antes.closeAll)
    await act(async () => api.actual.closeAll())
    await p
    await desmontar()
  })

  it('closeAll cierra lo que abrió el componente y no el diálogo de otro que ya estaba abierto', async () => {
    const a = await montar(() => useDialog())
    const b = await montar(() => useDialog())
    let pa!: Promise<unknown>
    let pb!: Promise<unknown>
    await act(async () => {
      pa = a.api.actual.confirm({ title: 'A' })
    })
    await act(async () => {
      pb = b.api.actual.confirm({ title: 'B' })
    })
    expect(abiertos()).toBe(2)
    await act(async () => b.api.actual.closeAll())
    expect(await pb).toMatchObject({ confirmed: false, reason: 'program' })
    await esperar(300)
    expect(abiertos()).toBe(1)
    expect(a.api.actual.isOpen).toBe(true)
    await a.desmontar()
    await pa
    await b.desmontar()
  })

  it('scoped: recetas también se cierran al desmontar', async () => {
    const { api, desmontar } = await montar(() => {
      const d = useDialog()
      return { borrar: d.scoped(confirmDelete) }
    })
    let p!: Promise<unknown>
    await act(async () => {
      p = api.actual.borrar({ what: 'a Laura' })
    })
    expect(abiertos()).toBe(1)
    await desmontar()
    expect(await p).toBe(false)
    expect(abiertos()).toBe(0)
  })

  it('useForm: el formulario se cierra al desmontar y devuelve lo mismo que form()', async () => {
    const { api, desmontar } = await montar(() => useForm())
    let p!: Promise<{ confirmed: boolean; reason?: string }>
    await act(async () => {
      p = api.actual.form({ title: 'Proveedor', fields: [{ name: 'rfc', label: 'RFC', type: 'text' }] })
    })
    expect(abiertos()).toBe(1)
    expect(api.actual.isOpen).toBe(true)
    await desmontar()
    expect(await p).toMatchObject({ confirmed: false, reason: 'program' })
    expect(api.actual.wizard).toBeTypeOf('function')
    expect(api.actual.formFromJSON).toBeTypeOf('function')
  })

  it('useForm: confirmar entrega el valor', async () => {
    const { api, desmontar } = await montar(() => useForm())
    let p!: Promise<{ confirmed: boolean; value?: Record<string, unknown> }>
    await act(async () => {
      p = api.actual.form({ title: 'Nombre', fields: [{ name: 'nombre', label: 'Nombre', type: 'text' }], draft: false })
    })
    escribir($<HTMLInputElement>('input'), 'Laura')
    await act(async () => {
      boton('confirm').click()
    })
    expect(await p).toMatchObject({ confirmed: true, value: { nombre: 'Laura' } })
    await desmontar()
  })

  it('StrictMode: el efecto se limpia y se vuelve a montar sin perder el control', async () => {
    const { api, desmontar } = await montar(() => useDialog(), { strict: true })
    let p!: Promise<unknown>
    await act(async () => {
      p = api.actual.confirm({ title: '¿Seguro?' })
    })
    expect(abiertos()).toBe(1)
    expect(api.actual.isOpen).toBe(true)
    await desmontar()
    expect(await p).toMatchObject({ reason: 'program' })
    expect(abiertos()).toBe(0)
  })

  it('NexusDialogsProvider: configura antes de que los hijos corran sus efectos y deja pasar a los hijos', async () => {
    let idiomaAlMontar = ''
    function Hijo() {
      idiomaAlMontar = language()
      return null
    }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    await act(async () =>
      root.render(createElement(NexusDialogsProvider, { lang: 'en', toast: { position: 'top-left' } }, createElement(Hijo))),
    )
    expect(idiomaAlMontar).toBe('en')
    await act(async () => root.unmount())
    configure({ lang: 'es' })
    toast.configure({ lang: 'es', position: 'bottom-right' })
  })

  it('dos componentes con diálogos a la vez: cada uno cierra solo lo suyo, abra quien abra primero', async () => {
    const a = await montar(() => useDialog())
    const b = await montar(() => useDialog())
    let pa!: Promise<unknown>
    let pb!: Promise<unknown>
    await act(async () => {
      pa = a.api.actual.confirm({ title: 'A' })
      pb = b.api.actual.confirm({ title: 'B' })
    })
    await esperar()
    expect(abiertos()).toBe(2)
    // Se desmonta A, que abrió primero: B conserva el suyo.
    await a.desmontar()
    expect(await pa).toMatchObject({ reason: 'program' })
    await esperar(300)
    expect(abiertos()).toBe(1)
    expect(b.api.actual.isOpen).toBe(true)
    await b.desmontar()
    await pb
    expect(abiertos()).toBe(0)
  })

  it('un diálogo anidado queda a nombre del mismo componente', async () => {
    const a = await montar(() => useDialog())
    const b = await montar(() => useDialog())
    let pa!: Promise<unknown>
    await act(async () => {
      pa = a.api.actual.scoped(async () => {
        const r = await dialog.confirm({ title: 'Uno' })
        return r.confirmed ? undefined : dialog.alert({ title: 'Dos, dentro de lo mismo' })
      })()
    })
    await esperar()
    boton('cancel').click()
    await esperar(300)
    expect($('.title').textContent).toBe('Dos, dentro de lo mismo')
    await b.desmontar()
    expect(abiertos()).toBe(1)
    await a.desmontar()
    await pa
    expect(abiertos()).toBe(0)
  })
})
