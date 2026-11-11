/**
 * Angular 16+: funciones de inyección y señales, sin decoradores (no hace falta compilar la librería con ngc).
 *
 * ```ts
 * // app.config.ts (opcional: solo para idioma, tema, esquema, dirección o toasts)
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideNexusDialogs({ scheme: 'auto', toast: { position: 'top-right' } })],
 * }
 *
 * // En un componente o servicio (contexto de inyección)
 * import { injectDialog, injectToast } from 'nexus-dialogs/angular'
 * export class Empleados {
 *   private dialog = injectDialog()
 *   private toast = injectToast()
 *   async borrar() {
 *     if ((await this.dialog.confirm({ title: '¿Eliminar?', danger: true })).confirmed) this.toast.success('Eliminado')
 *   }
 * }
 * // En la plantilla: @if (dialog.isOpen()) { … }
 * ```
 * Los diálogos que abre un componente se cierran solos cuando Angular lo destruye (por ejemplo, al cambiar de ruta).
 * `isOpen` es una señal: funciona con zone.js y sin él. Importar el paquete no toca el DOM, así que SSR no falla.
 */
import { DestroyRef, inject, makeEnvironmentProviders, signal, type EnvironmentProviders, type Signal } from '@angular/core'
import { dialog as base } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { form, formFromJSON, wizard } from 'nexus-dialogs/forms'
import { aplicarConfig, crearAlcance, type Alcance, type Fn, type PluginOptions } from './adaptadores'

export type { PluginOptions }

/**
 * Configura idioma, tema, esquema, dirección y toasts para toda la aplicación.
 * Se aplica en el momento de llamarla (al evaluar `app.config.ts`), antes de que se cree cualquier componente.
 */
export function provideNexusDialogs(opciones: PluginOptions = {}): EnvironmentProviders {
  aplicarConfig(opciones)
  return makeEnvironmentProviders([])
}

/** Dueño de diálogos ligado al componente (o servicio) que lo inyecta: lo que abre se cierra al destruirlo. */
function crearDueno(): [Alcance, Signal<boolean>] {
  const abierto = signal(false)
  const alcance = crearAlcance((v) => abierto.set(v))
  inject(DestroyRef).onDestroy(() => {
    alcance.activo = false
    alcance.closeAll()
  })
  return [alcance, abierto.asReadonly()]
}

export interface InjectDialogReturn {
  alert: typeof base.alert
  confirm: typeof base.confirm
  prompt: typeof base.prompt
  open: typeof base.open
  success: typeof base.success
  error: typeof base.error
  warning: typeof base.warning
  info: typeof base.info
  /** ¿Este componente tiene algún diálogo abierto? */
  isOpen: Signal<boolean>
  /** Cierra los diálogos que abrió este componente. */
  closeAll: () => void
  /** Para recetas y otras funciones que abren diálogos: `const borrar = scoped(confirmDelete)`. */
  scoped: <F extends Fn>(fn: F) => F
}

/** Diálogos ligados al componente: se cierran solos al destruirlo. Llámala en un contexto de inyección (campo, constructor, `inject`). */
export function injectDialog(): InjectDialogReturn {
  const [alcance, isOpen] = crearDueno()
  const { scoped } = alcance
  return {
    alert: scoped(base.alert),
    confirm: scoped(base.confirm),
    prompt: scoped(base.prompt),
    open: scoped(base.open),
    success: scoped(base.success),
    error: scoped(base.error),
    warning: scoped(base.warning),
    info: scoped(base.info),
    isOpen,
    closeAll: alcance.closeAll,
    scoped,
  }
}

export interface InjectFormReturn {
  /** `form()` de `nexus-dialogs/forms`, ligado al componente. */
  form: typeof form
  /** `wizard()` de `nexus-dialogs/forms`, ligado al componente. */
  wizard: typeof wizard
  /** `formFromJSON()` de `nexus-dialogs/forms`, ligado al componente. */
  formFromJSON: typeof formFromJSON
  isOpen: Signal<boolean>
  closeAll: () => void
  /** Para otras funciones que abren diálogos: `scoped(pickRows)`, `scoped(importData)`… */
  scoped: <F extends Fn>(fn: F) => F
}

/** Formularios y asistentes ligados al componente: se cierran solos al destruirlo. */
export function injectForm(): InjectFormReturn {
  const [alcance, isOpen] = crearDueno()
  const { scoped } = alcance
  return { form: scoped(form), wizard: scoped(wizard), formFromJSON: scoped(formFromJSON), isOpen, closeAll: alcance.closeAll, scoped }
}

/** Los toasts no se cierran al destruir el componente: así «Guardado» sigue visible después de cambiar de ruta. */
export const injectToast = (): typeof toast => toast
