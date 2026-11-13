// Baja de empleado: borrado grande que pide escribir el nombre, lista lo que se pierde y, al terminar, un aviso con «Deshacer».
import { toast } from 'nexus-dialogs/toast'
import { confirmDelete } from 'nexus-dialogs/patterns'
import { api } from './api-falsa'

export async function bajaDeEmpleado(numero = 'E-0042', nombre = 'Laura Méndez Ruiz'): Promise<boolean> {
  const hecho = await confirmDelete({
    what: 'a la persona',
    name: nombre,
    requireName: true, // el botón se habilita hasta escribir el nombre
    consequences: ['Su expediente y sus recibos', '3 solicitudes de vacaciones abiertas'],
    confirmText: 'Dar de baja',
    // Con «Dar de baja» el diálogo muestra «Procesando…»; si esto lanza, el error se muestra y el diálogo sigue abierto.
    onConfirm: () => api.empleados.baja(numero),
  })
  if (!hecho) return false
  toast.success(`${nombre} fue dada de baja`, {
    action: { label: 'Deshacer', onClick: () => api.empleados.restaurar(numero).then(() => toast(`${nombre} fue restaurada`)) },
  })
  return true
}
