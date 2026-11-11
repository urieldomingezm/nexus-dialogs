/**
 * Lo que comparten los adaptadores de Vue y React: diálogos «de un dueño» (un componente) que se cierran con él,
 * y la configuración global con las opciones de los toasts. No es una entrada pública del paquete.
 */
import { closeDialog, configure, type GlobalConfig } from 'nexus-dialogs'
import { toast, type ToastConfig } from 'nexus-dialogs/toast'

export type Fn = (...args: any[]) => Promise<unknown>

interface Dueno {
  propios: Set<HTMLDialogElement>
  /** Avisa al componente de que cambió lo que tiene abierto. */
  refrescar: () => void
}

// Quién es dueño de cada diálogo abierto. Los diálogos se atribuyen así:
//  1. Es del componente cuya llamada lleva más tiempo esperando abrir su diálogo (o el siguiente paso del suyo).
//  2. Si nadie espera, es del dueño del diálogo que está arriba (diálogos anidados: «¿Salir sin guardar?» dentro de un formulario).
// Así dos componentes con diálogos a la vez ya no se mezclan; un diálogo que nadie reclama no es de nadie.
const duenos = new Map<HTMLDialogElement, Dueno>()
const enVuelo: Dueno[] = []
const orden: HTMLDialogElement[] = []
let instalado = false

const ocupado = (d: Dueno): boolean => [...d.propios].some((x) => x.isConnected)

function instalar(): void {
  if (instalado || typeof document === 'undefined') return
  instalado = true
  document.addEventListener('nexus-dialogs:open', (e) => {
    const nuevo = (e as CustomEvent<{ dialog: HTMLDialogElement }>).detail.dialog
    const arriba = [...orden].reverse().find((x) => x.isConnected && duenos.has(x))
    const dueno = enVuelo.find((d) => !ocupado(d)) ?? (arriba && duenos.get(arriba))
    orden.push(nuevo)
    if (!dueno) return
    duenos.set(nuevo, dueno)
    dueno.propios.add(nuevo)
    dueno.refrescar()
  })
  document.addEventListener('nexus-dialogs:close', (e) => {
    const cerrado = (e as CustomEvent<{ dialog: HTMLDialogElement }>).detail.dialog
    const i = orden.indexOf(cerrado)
    if (i >= 0) orden.splice(i, 1)
    const dueno = duenos.get(cerrado)
    if (!dueno) return
    duenos.delete(cerrado)
    dueno.propios.delete(cerrado)
    setTimeout(dueno.refrescar, 250)
  })
}

/** Envuelve una función que abre diálogos (dialog.confirm, form, confirmDelete…) para que lo que abra quede a nombre del dueño. */
function registrar<F extends Fn>(fn: F, dueno: Dueno): F {
  return ((...args: unknown[]) => {
    instalar()
    enVuelo.push(dueno)
    const fin = () => {
      const i = enVuelo.indexOf(dueno)
      if (i >= 0) enVuelo.splice(i, 1)
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
  const dueno: Dueno = {
    propios: new Set(),
    refrescar: () => a.activo && alCambiar(ocupado(dueno)),
  }
  const a: Alcance = {
    activo: true,
    scoped: (fn) => {
      const envuelta = registrar(fn, dueno)
      return ((...args: unknown[]) => {
        const p = envuelta(...args)
        dueno.refrescar()
        return p.finally(() => setTimeout(dueno.refrescar, 250))
      }) as typeof fn
    },
    closeAll: () => {
      for (const d of [...dueno.propios]) {
        duenos.delete(d)
        closeDialog(d)
      }
      dueno.propios.clear()
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
  toast.configure({ lang: global.lang, scheme: global.scheme, dir: global.dir, theme: global.theme, ...t })
}
