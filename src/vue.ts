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
import { dialog as base } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { aplicarConfig, crearAlcance, type Fn, type PluginOptions } from './adaptadores'

export type { PluginOptions }

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
  const isOpen = ref(false)
  const alcance = crearAlcance((abierto) => (isOpen.value = abierto))
  const { scoped, closeAll } = alcance
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
    aplicarConfig(opciones)
    app.config.globalProperties.$dialog = base
    app.config.globalProperties.$toast = toast
  },
}
