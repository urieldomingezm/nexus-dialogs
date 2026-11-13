// Importar un CSV o Excel con revisión: relaciona las columnas solo, marca las filas con error y guarda las válidas.
import { toast } from 'nexus-dialogs/toast'
import { importData } from 'nexus-dialogs/import'
import { api } from './api-falsa'

export async function importarEmpleados(): Promise<number> {
  const r = await importData<Record<string, unknown>>({
    title: 'Importar empleados',
    columns: [
      { name: 'numero', label: 'Número de empleado', required: true, unique: true },
      { name: 'nombre', label: 'Nombre completo', required: true, aliases: ['empleado'] },
      { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
      { name: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
      { name: 'salario', label: 'Salario diario', type: 'number' },
    ],
    onImport: (filas) => api.empleados.lote(filas),
  })
  if (!r.confirmed || !r.value) return 0
  const n = r.value.rows.length // solo las filas válidas; r.value.errors dice cuáles se dejaron fuera y por qué
  toast.success(`${n} empleados importados`)
  return n
}
