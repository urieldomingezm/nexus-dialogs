// Cierre de quincena: pantalla de espera mientras se calcula, timbrado por lote con vista previa, progreso y
// reintento de los que fallaron, y un resumen al final.
import { toast } from 'nexus-dialogs/toast'
import { bulkAction, loading } from 'nexus-dialogs/patterns'
import { api, recibosDeLaQuincena } from './api-falsa'

export async function cerrarQuincena(): Promise<{ timbrados: number; fallidos: number } | null> {
  // 1. Algo que bloquea de verdad y no se puede cerrar: la pantalla de espera.
  const { recibos } = await loading('Calculando la quincena…', () => api.nomina.calcular())

  // 2. Vista previa, confirmación, barra de progreso y resultado fila por fila.
  const r = await bulkAction({
    title: `Timbrar ${recibos} recibos`,
    items: recibosDeLaQuincena,
    label: (x) => x.empleado,
    describe: (x) => `Neto $${x.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    confirmText: (n) => `Timbrar ${n} recibos`,
    run: (x) => api.nomina.timbrar(x), // si lanza, esa fila queda con error y sigue con las demás
  })
  if (!r.confirmed) return null

  const resumen = { timbrados: r.done.length, fallidos: r.failed.length }
  if (resumen.fallidos) toast.error(`${resumen.fallidos} sin timbrar`, { message: 'Revisa el resultado y reintenta.' })
  else toast.success(`${resumen.timbrados} recibos timbrados`)
  return resumen
}
