import type { EngineOptions } from './core/engine'
import { configure, labels } from './config'
import type { DialogContext, DialogResult } from './types'

/** Lo que recibe `install`: la parte de la API pensada para extender. */
export interface PluginApi {
  configure: typeof configure
  labels: typeof labels
}

/**
 * Una extensión. Todo es opcional salvo `name`. Los ganchos corren para todos los diálogos, también los que abren
 * `form`, `wizard`, `confirmDelete`, etc., en el orden en que se instalaron los plugins. Un gancho que lanza un error se
 * registra en la consola y no impide abrir ni cerrar el diálogo.
 */
export interface Plugin {
  /** Nombre único. Instalar otro con el mismo nombre no hace nada. */
  name: string
  /** Se llama una vez al instalar. */
  install?(api: PluginApi): void
  /** Antes de abrir: puedes devolver las opciones cambiadas (o nada, si solo observas). */
  beforeOpen?(opciones: EngineOptions<any>): EngineOptions<any> | void
  /** Con el diálogo ya en pantalla. */
  afterOpen?(ctx: DialogContext, opciones: EngineOptions<any>): void
  /** Después de cerrar, con el resultado. */
  afterClose?(resultado: DialogResult<any>, opciones: EngineOptions<any>): void
}

const instalados: Plugin[] = []

/** Instala un plugin. Devuelve `false` si ya había uno con ese nombre. */
export function use(plugin: Plugin): boolean {
  if (!plugin?.name) throw new TypeError('Un plugin necesita un `name`.')
  if (plugins().includes(plugin.name)) return false
  plugin.install?.({ configure, labels })
  instalados.push(plugin)
  motor.preparar = preparar
  return true
}

/** Quita un plugin por nombre. Devuelve `false` si no estaba instalado. */
export function unuse(name: string): boolean {
  const i = plugins().indexOf(name)
  return i >= 0 && !!instalados.splice(i, 1)
}

/** Nombres de los plugins instalados, en orden. */
export const plugins = (): string[] => instalados.map((p) => p.name)

/**
 * Uso interno del motor. `motor.preparar` solo existe cuando se instaló algún plugin; así, los paquetes que no usan `use()` (como el
 * de `swal` para el navegador) no cargan nada de esto. Encadena los `beforeOpen` y envuelve `onOpen` y `onClose` para correr los
 * `afterOpen` y `afterClose`. Un gancho que lanza se registra en la consola y no detiene nada.
 */
export const motor: { preparar?: <T>(o: EngineOptions<T>) => EngineOptions<T> } = {}

const correr = (g: 'beforeOpen' | 'afterOpen' | 'afterClose', ...a: any[]): any => {
  for (const p of instalados)
    try {
      const v = (p[g] as ((...x: any[]) => unknown) | undefined)?.(...a)
      if (g[0] === 'b' && v) a[0] = v
    } catch (e) {
      console.error(p.name, g, e)
    }
  return a[0]
}

function preparar<T>(opciones: EngineOptions<T>): EngineOptions<T> {
  const o: EngineOptions<T> = correr('beforeOpen', opciones)
  const { onOpen, onClose } = o
  return {
    ...o,
    onOpen: (ctx) => (onOpen?.(ctx), correr('afterOpen', ctx, o)),
    onClose: (r) => (onClose?.(r), correr('afterClose', r, o)),
  }
}
