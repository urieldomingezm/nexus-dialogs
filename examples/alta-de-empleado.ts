// Alta de empleado: asistente de tres pasos con validadores de México, revisión final y aviso al terminar.
import { toast } from 'nexus-dialogs/toast'
import { wizard } from 'nexus-dialogs/forms'
import { api, type Empleado } from './api-falsa'

export async function altaDeEmpleado(): Promise<Empleado | null> {
  const r = await wizard<{ nombre: string; rfc: string; curp: string; area: string; salario: string }>({
    title: 'Alta de empleado',
    review: true, // paso final «Revisar» con «Editar» por sección
    submitText: 'Dar de alta',
    steps: [
      {
        title: 'Datos personales',
        fields: [
          { name: 'nombre', label: 'Nombre completo', required: true },
          { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
          { name: 'curp', label: 'CURP', type: 'curp', required: true },
        ],
      },
      {
        title: 'Puesto',
        fields: [
          { name: 'area', label: 'Área', type: 'select', options: ['Almacén', 'Compras', 'Logística', 'Nómina'], required: true },
          { name: 'salario', label: 'Salario diario', type: 'money', required: true },
        ],
      },
    ],
    // Con «Dar de alta» el diálogo muestra «Procesando…»; si esto lanza, el error se muestra y el asistente sigue abierto.
    // Lo que devuelve reemplaza al valor del resultado: aquí, el empleado que contestó el servidor.
    preConfirm: (v) => {
      if (!v) return false
      return api.empleados.crear({ numero: 'E-0001', nombre: v.nombre, rfc: v.rfc, curp: v.curp, area: v.area, salario: Number(v.salario) })
    },
  })
  if (!r.confirmed) return null
  const empleado = r.value as unknown as Empleado
  toast.success(`${empleado.nombre} ya está dada de alta`)
  return empleado
}
