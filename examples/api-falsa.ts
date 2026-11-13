// Un «servidor» en memoria para que los ejemplos corran solos. En tu aplicación esto son tus llamadas reales.
const espera = (ms = 30) => new Promise((r) => setTimeout(r, ms))

export interface Empleado {
  numero: string
  nombre: string
  rfc: string
  curp: string
  area: string
  salario: number
}
export interface Recibo {
  id: number
  empleado: string
  neto: number
}

export const recibosDeLaQuincena: Recibo[] = [
  { id: 1, empleado: 'Ana Torres', neto: 5120.4 },
  { id: 2, empleado: 'Diego Ramírez', neto: 6034.1 },
  { id: 3, empleado: 'Laura Méndez', neto: 4875 },
  { id: 4, empleado: 'Mateo Silva', neto: 5210.75 },
]

export const api = {
  empleados: {
    async crear(e: Empleado): Promise<Empleado> {
      await espera()
      return e
    },
    async lote(filas: Record<string, unknown>[]): Promise<{ guardadas: number }> {
      await espera()
      return { guardadas: filas.length }
    },
  },
  nomina: {
    async calcular(): Promise<{ recibos: number }> {
      await espera(80)
      return { recibos: recibosDeLaQuincena.length }
    },
    /** Falla con el recibo 3 para mostrar cómo se ve un error parcial. */
    async timbrar(r: Recibo): Promise<string> {
      await espera()
      if (r.id === 3) throw new Error('El SAT no respondió')
      return `FOLIO-${r.id}`
    },
  },
}
