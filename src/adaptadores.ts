/**
 * Lo que comparten los adaptadores de Vue y React: diálogos «de un dueño» (un componente) que se cierran con él,
 * y la configuración global con las opciones de los toasts. No es una entrada pública del paquete.
 */
import { closeDialog, configure, type GlobalConfig } from 'nexus-dialogs'
import { toast, type ToastConfig } from 'nexus-dialogs/toast'

export type Fn = (...args: any[]) => Promise<unknown>

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

export interface Alcance {
  /** Mientras es `false` (componente desmontado) ya no se avisa de cambios. */
  activo: boolean
  /** Envuelve una función de diálogos para que lo que abra quede ligado a este dueño. */
  scoped: <F extends Fn>(fn: F) => F
  /** Cierra los diálogos del dueño. */
  closeAll: () => void
}

/** `alCambiar(abierto)` se llama cuando el dueño abre o termina de cerrar un diálogo. */
export function crearAlcance(alCambiar: (abierto: boolean) => void): Alcance {
  const propios = new Set<HTMLDialogElement>()
  const a: Alcance = {
    activo: true,
    scoped: (fn) => {
      const envuelta = registrar(fn, propios)
      const actualizar = () => a.activo && alCambiar([...propios].some((d) => d.isConnected))
      return ((...args: unknown[]) => {
        const p = envuelta(...args)
        actualizar()
        return p.finally(() => setTimeout(actualizar, 250))
      }) as typeof fn
    },
    closeAll: () => {
      for (const d of [...propios]) closeDialog(d)
      propios.clear()
      if (a.activo) alCambiar(false)
    },
  }
  return a
}

export interface PluginOptions extends GlobalConfig {
  /** Opciones de los toasts (posición, máximo visible, duración…). `lang`, `scheme` y `theme` se copian solos. */
  toast?: ToastConfig
}

/** Aplica la configuración global y la de los toasts. Se puede llamar las veces que haga falta. */
export function aplicarConfig(opciones: PluginOptions): void {
  const { toast: t, ...global } = opciones
  configure(global)
  toast.configure({ lang: global.lang, scheme: global.scheme, theme: global.theme, ...t })
}
