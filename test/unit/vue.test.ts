import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { NexusDialogs, useDialog, useToast } from '../../src/vue'
import { confirmDelete } from '../../src/patterns'
import { toast } from '../../src/toast'
import { abiertos, boton, esperar } from './utilidades'

function montar(setup: () => Record<string, unknown>) {
  let api: Record<string, any> = {}
  const app = createApp(
    defineComponent({
      setup() {
        api = setup()
        return () => h('div')
      },
    }),
  )
  const el = document.createElement('div')
  document.body.appendChild(el)
  app.mount(el)
  return { app, api }
}

describe('Vue', () => {
  it('useDialog: abre, avisa con isOpen y cierra al desmontar el componente', async () => {
    const { app, api } = montar(() => ({ ...useDialog(), toast: useToast() }))
    const p = api.confirm({ title: '¿Seguro?' })
    expect(abiertos()).toBe(1)
    expect(api.isOpen.value).toBe(true)
    app.unmount()
    expect(await p).toMatchObject({ confirmed: false, reason: 'program' })
    expect(abiertos()).toBe(0)
    expect(api.toast).toBe(toast)
  })

  it('scoped: recetas y diálogos anidados también se cierran al desmontar', async () => {
    const { app, api } = montar(() => {
      const d = useDialog()
      return { borrar: d.scoped(confirmDelete), d }
    })
    const p = api.borrar({ what: 'a Laura' })
    await nextTick()
    expect(abiertos()).toBe(1)
    app.unmount()
    expect(await p).toBe(false)
  })

  it('cerrar normalmente actualiza isOpen', async () => {
    const { app, api } = montar(() => useDialog())
    const p = api.alert('Hola')
    boton('confirm').click()
    await p
    await esperar(300)
    expect(api.isOpen.value).toBe(false)
    app.unmount()
  })

  it('plugin: configura y expone $dialog y $toast', () => {
    const app = createApp({ render: () => null })
    app.use(NexusDialogs, { lang: 'en', toast: { position: 'top-left' } })
    expect(app.config.globalProperties.$dialog.confirm).toBeTypeOf('function')
    expect(app.config.globalProperties.$toast.success).toBeTypeOf('function')
    app.use({ install: () => {} })
    // deja el idioma como estaba para las demás pruebas
    NexusDialogs.install(createApp({ render: () => null }), { lang: 'es', toast: { position: 'bottom-right' } })
  })
})
