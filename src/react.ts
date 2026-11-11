/**
 * React 18+: hooks y proveedor.
 *
 * ```tsx
 * // main.tsx (opcional: solo si quieres configurar idioma, tema o toasts)
 * <NexusDialogsProvider scheme="auto" toast={{ position: 'top-right' }}><App /></NexusDialogsProvider>
 *
 * // En un componente
 * import { useDialog, useToast } from 'nexus-dialogs/react'
 * const dialog = useDialog()
 * const toast = useToast()
 * if ((await dialog.confirm({ title: '¿Eliminar?', danger: true })).confirmed) toast.success('Eliminado')
 * ```
 * Los diálogos que abre un componente se cierran solos si el componente se desmonta (por ejemplo, al cambiar de ruta).
 * Las funciones que devuelven los hooks son estables entre renders: puedes ponerlas en las dependencias de un efecto.
 * Con Next.js úsalos en componentes de cliente (`'use client'`); importar el paquete no toca el DOM, así que SSR no falla.
 */
import { createElement, Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { dialog as base } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { form, formFromJSON, wizard } from 'nexus-dialogs/forms'
import { aplicarConfig, crearAlcance, type Alcance, type Fn, type PluginOptions } from './adaptadores'

export type { PluginOptions }

/** Dueño de diálogos ligado al componente que llama al hook: lo que abre se cierra al desmontarlo. */
function useAlcance(): [Alcance, boolean] {
  const [isOpen, setOpen] = useState(false)
  const ref = useRef<Alcance | null>(null)
  if (!ref.current) ref.current = crearAlcance(setOpen)
  const alcance = ref.current
  // En StrictMode (desarrollo) el efecto corre, se limpia y vuelve a correr: `activo` se reactiva solo.
  useEffect(() => {
    alcance.activo = true
    return () => {
      alcance.activo = false
      alcance.closeAll()
    }
  }, [alcance])
  return [alcance, isOpen]
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
  /** ¿Este componente tiene algún diálogo abierto? Hace que el componente se vuelva a renderizar al cambiar. */
  isOpen: boolean
  /** Cierra los diálogos que abrió este componente. */
  closeAll: () => void
  /**
   * Para recetas y formularios: `const borrar = scoped(confirmDelete)`.
   * Lo que abran también se cierra al desmontar el componente. Envuélvelo una vez (fuera del render o con `useMemo`).
   */
  scoped: <F extends Fn>(fn: F) => F
}

/** Diálogos ligados al componente: se cierran solos al desmontarlo. */
export function useDialog(): UseDialogReturn {
  const [alcance, isOpen] = useAlcance()
  const funciones = useMemo(() => {
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
    }
  }, [alcance])
  return useMemo(() => ({ ...funciones, isOpen, closeAll: alcance.closeAll, scoped: alcance.scoped }), [funciones, isOpen, alcance])
}

export interface UseFormReturn {
  /** `form()` de `nexus-dialogs/forms`, ligado al componente. */
  form: typeof form
  /** `wizard()` de `nexus-dialogs/forms`, ligado al componente. */
  wizard: typeof wizard
  /** `formFromJSON()` de `nexus-dialogs/forms`, ligado al componente. */
  formFromJSON: typeof formFromJSON
  isOpen: boolean
  closeAll: () => void
  /** Para otras funciones que abren diálogos: `scoped(pickRows)`, `scoped(importData)`… */
  scoped: <F extends Fn>(fn: F) => F
}

/** Formularios y asistentes ligados al componente: se cierran solos al desmontarlo. */
export function useForm(): UseFormReturn {
  const [alcance, isOpen] = useAlcance()
  const funciones = useMemo(() => {
    const { scoped } = alcance
    return { form: scoped(form), wizard: scoped(wizard), formFromJSON: scoped(formFromJSON) }
  }, [alcance])
  return useMemo(() => ({ ...funciones, isOpen, closeAll: alcance.closeAll, scoped: alcance.scoped }), [funciones, isOpen, alcance])
}

/** Los toasts no se cierran al desmontar: así «Guardado» sigue visible después de cambiar de ruta. */
export const useToast = (): typeof toast => toast

export interface NexusDialogsProviderProps extends PluginOptions {
  children?: ReactNode
}

/**
 * Configura idioma, tema, esquema y toasts para todo el árbol. No pinta nada propio.
 * Se aplica antes de que los hijos corran sus efectos, así que un diálogo que se abre al montar ya sale configurado.
 */
export function NexusDialogsProvider({ children, ...opciones }: NexusDialogsProviderProps): ReactNode {
  const { lang, labels, theme, scheme, defaults, sheetOnMobile, toast: t } = opciones
  // Configurar es idempotente, así que no importa que React repita o descarte este cálculo.
  useMemo(
    () => aplicarConfig({ lang, labels, theme, scheme, defaults, sheetOnMobile, toast: t }),
    [lang, labels, theme, scheme, defaults, sheetOnMobile, t],
  )
  return createElement(Fragment, null, children)
}
