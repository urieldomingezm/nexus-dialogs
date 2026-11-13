// Aprobar vacaciones: el aprobador ve el detalle y un aviso de empalme; aprobar admite comentario y rechazar pide motivo.
import { toast } from 'nexus-dialogs/toast'
import { approval } from 'nexus-dialogs/patterns'
import { api, type Solicitud } from './api-falsa'

export async function aprobarVacaciones(
  s: Solicitud = { id: 'SOL-2026-0412', empleado: 'Diego Ramírez', fechas: '16 – 20 dic', dias: 5 },
): Promise<'aprobada' | 'rechazada' | null> {
  const r = await approval({
    title: `Vacaciones de ${s.empleado}`,
    subtitle: `Solicitud ${s.id}`,
    details: [
      { label: 'Fechas', value: s.fechas },
      { label: 'Días hábiles', value: String(s.dias) },
    ],
    warning: '2 personas de Almacén ya tienen vacaciones esos días.',
    reasons: ['Cubre otro turno', 'Cierre de inventario', 'Sin saldo'],
    // Cada botón corre su acción con «Procesando…»; si lanza, el error se muestra y el diálogo sigue abierto.
    onApprove: (comentario) => api.vacaciones.resolver(s, 'aprobada', comentario),
    onReject: (comentario, motivo) => api.vacaciones.resolver(s, 'rechazada', `${motivo ?? ''} ${comentario}`.trim()),
  })
  if (r.decision === 'approved') {
    toast.success(`Vacaciones de ${s.empleado} aprobadas`)
    return 'aprobada'
  }
  if (r.decision === 'rejected') {
    toast.info(`Vacaciones de ${s.empleado} rechazadas`)
    return 'rechazada'
  }
  return null
}
