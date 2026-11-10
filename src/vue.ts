/**
 * Vue 3: plugin y composables.
 *
 * ```ts
 * // main.ts
 * import { NexusDialogs } from 'nexus-dialogs/vue'
 * app.use(NexusDialogs, { scheme: 'auto', toast: { position: 'top-right' } })
 *
 * // En un componente
 * import { useDialog, useToast } from 'nexus-dialogs/vue'
 * const dialog = useDialog()
 * const toast = useToast()
 * if ((await dialog.confirm({ title: '¿Eliminar?', danger: true })).confirmed) toast.success('Eliminado')
 * ```
 * Los diálogos que abre un componente se cierran solos si el componente se desmonta (por ejemplo, al cambiar de ruta).
 */
import { getCurrentInstance, onBeforeUnmount, readonly, ref, type App, type Ref } from 'vue'
import { closeDialog, configure, dialog as base, type GlobalConfig } from 'nexus-dialogs'
import { toast, type ToastConfig } from 'nexus-dialogs/toast'

type Fn = (...args: any[]) => Promise<unknown>

/**
 * Envuelve una función que abre diálogos (dialog.confirm, form, confirmDelete…) para que todo lo que abra,
 * incluidos los diálogos anidados, quede registrado en `propios` mientras su promesa no termine.
 */
function registrar<F extends Fn>(fn: F, propios: Set<HTMLDialogElement>): F {
  return ((...args: unknown[]) => {
    const alAbrir = (e: Event) => propios.add((e as CustomEvent<{ dialog: HTMLDialogElement }>).detail.dialog)
    const alCerrar = (e: Event) => propios.delete((e as CustomEvent<{ dialog: HTMLDialogElement }>).detail.dialog)
    document.addEventListener('nexus-dialogs:open', alAbrir)
    document.addEventListener('nexus-dialogs:close', alCerrar)
    const fin = () => {
      document.removeEventListener('nexus-dialogs:open', alAbrir)
      setTimeout(() => document.removeEventListener('nexus-dialogs:close', alCerrar), 300)
    }
    let p: Promise<unknown>
    try {
      p = fn(...args)
    } catch (e) {
      fin()
      throw e
    }
    return p.finally(fin)
  }) as F
}

export interface UseDialogReturn {
  alert: typeof base.alert
  confirm: typeof base.confirm
  prompt: typeof base.prompt
  open: typeof base.open
  success: typeof base.success
  error: typeof base.error
  warning: typeof base.warning
  info: typeof base.info
  /** ¿Este componente tiene algún diálogo abierto? (reactivo) */
  isOpen: Readonly<Ref<boolean>>
  /** Cierra los diálogos que abrió este componente. */
  closeAll: () => void
  /**
   * Para recetas y formularios: `const borrar = scoped(confirmDelete)`.
   * Lo que abran también se cierra al desmontar el componente.
   */
  scoped: <F extends Fn>(fn: F) => F
}

/** Diálogos ligados al componente: se cierran solos al desmontarlo. Fuera de un componente funciona igual, sin cierre automático. */
export function useDialog(): UseDialogReturn {
  const propios = new Set<HTMLDialogElement>()
  const isOpen = ref(false)
  const actualizar = () => (isOpen.value = [...propios].some((d) => d.isConnected))
  const scoped = <F extends Fn>(fn: F): F => {
    const envuelta = registrar(fn, propios)
    return ((...args: unknown[]) => {
      const p = envuelta(...args)
      actualizar()
      return p.finally(() => setTimeout(actualizar, 250))
    }) as F
  }
  const closeAll = () => {
    for (const d of [...propios]) closeDialog(d)
    propios.clear()
    isOpen.value = false
  }
  if (getCurrentInstance()) onBeforeUnmount(closeAll)
  return {
    alert: scoped(base.alert),
    confirm: scoped(base.confirm),
    prompt: scoped(base.prompt),
    open: scoped(base.open),
    success: scoped(base.success),
    error: scoped(base.error),
    warning: scoped(base.warning),
    info: scoped(base.info),
    isOpen: readonly(isOpen),
    closeAll,
    scoped,
  }
}

/** Los toasts no se cierran al desmontar: así «Guardado» sigue visible después de cambiar de ruta. */
export const useToast = (): typeof toast => toast

export interface PluginOptions extends GlobalConfig {
  /** Opciones de los toasts (posición, máximo visible, duración…). `lang`, `scheme` y `theme` se copian solos. */
  toast?: ToastConfig
}

declare module 'vue' {
  interface ComponentCustomProperties {
    /** nexus-dialogs: `this.$dialog.confirm(…)` en la Options API. */
    $dialog: typeof base
    /** nexus-dialogs: `this.$toast.success(…)` en la Options API. */
    $toast: typeof toast
  }
}

/** Plugin: `app.use(NexusDialogs, { lang: 'es', scheme: 'auto', theme, toast: { position: 'top-right' } })`. */
export const NexusDialogs = {
  install(app: App, opciones: PluginOptions = {}): void {
    const { toast: t, ...global } = opciones
    configure(global)
    toast.configure({ lang: global.lang, scheme: global.scheme, theme: global.theme, ...t })
    app.config.globalProperties.$dialog = base
    app.config.globalProperties.$toast = toast
  },
}
