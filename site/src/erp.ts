// Mini ERP de la documentación: varios módulos de nexus-dialogs trabajando juntos con datos en memoria.
import './comun'
import { toast } from 'nexus-dialogs/toast'
import { form, formFromJSON } from 'nexus-dialogs/forms'
import { confirmDelete, bulkAction } from 'nexus-dialogs/patterns'
import { importData, exportData } from 'nexus-dialogs/import'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'

interface Empleado {
  numero: number
  nombre: string
  area: string
  puesto: string
  ingreso: string
  salario: number
}

let empleados: Empleado[] = [
  { numero: 1001, nombre: 'Ana Torres', area: 'Almacén', puesto: 'Jefa de turno', ingreso: '2022-03-14', salario: 612.5 },
  { numero: 1002, nombre: 'Diego Ramírez', area: 'Logística', puesto: 'Coordinador', ingreso: '2021-08-02', salario: 700 },
  { numero: 1003, nombre: 'Laura Méndez', area: 'Almacén', puesto: 'Montacarguista', ingreso: '2023-01-09', salario: 580.25 },
  { numero: 1004, nombre: 'Mateo Cruz', area: 'Ventas', puesto: 'Ejecutivo', ingreso: '2020-11-23', salario: 655 },
  { numero: 1005, nombre: 'Sofía Núñez', area: 'Ventas', puesto: 'Ejecutiva', ingreso: '2024-02-05', salario: 598.75 },
]
let siguiente = 1006

const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E
const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function pintar(): void {
  const cuerpo = $('e-filas')
  cuerpo.replaceChildren()
  for (const e of empleados) {
    const fila = document.createElement('tr')
    for (const t of [String(e.numero), e.nombre, e.area, e.puesto, pesos.format(e.salario)]) {
      const td = document.createElement('td')
      td.textContent = t
      fila.appendChild(td)
    }
    const acc = document.createElement('td')
    acc.className = 'erp-fila-acc'
    const puesto = document.createElement('button')
    puesto.type = 'button'
    puesto.className = 'btn chico'
    puesto.textContent = 'Cambiar puesto'
    puesto.setAttribute('aria-label', `Cambiar puesto de ${e.nombre}`)
    puesto.addEventListener('click', () => void cambiarPuesto(e))
    const baja = document.createElement('button')
    baja.type = 'button'
    baja.className = 'btn chico peligro'
    baja.textContent = 'Baja'
    baja.setAttribute('aria-label', `Dar de baja a ${e.nombre}`)
    baja.addEventListener('click', () => void darDeBaja(e))
    acc.append(puesto, baja)
    fila.appendChild(acc)
    cuerpo.appendChild(fila)
  }
  $('e-total').textContent = String(empleados.length)
}

function registrar(texto: string): void {
  const li = document.createElement('li')
  li.textContent = `${new Date().toLocaleTimeString('es-MX')} · ${texto}`
  const lista = $('e-log')
  lista.prepend(li)
  while (lista.children.length > 8) lista.lastElementChild!.remove()
}

async function alta(): Promise<void> {
  const r = await formFromJSON(sinResolvers(plantillas.altaEmpleado))
  if (!r.confirmed) return registrar('Alta cancelada')
  const v = r.value as Record<string, any>
  const e: Empleado = {
    numero: siguiente++,
    nombre: `${v.nombre ?? ''} ${v.apellidos ?? ''}`.trim(),
    area: String(v.area ?? ''),
    puesto: String(v.puesto ?? ''),
    ingreso: String(v.ingreso ?? ''),
    salario: Number(v.salarioDiario ?? 0),
  }
  empleados = [...empleados, e]
  pintar()
  registrar(`Alta de ${e.nombre} (núm. ${e.numero})`)
  toast.success(`${e.nombre} ya está en la lista`)
}

async function importar(): Promise<void> {
  const r = await importData<Record<string, any>>({
    title: 'Importar empleados',
    columns: [
      { name: 'numero', label: 'Número de empleado', type: 'number', required: true, unique: true },
      { name: 'nombre', label: 'Nombre completo', required: true, aliases: ['empleado'] },
      { name: 'area', label: 'Área', aliases: ['departamento'] },
      { name: 'puesto', label: 'Puesto' },
      { name: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
      { name: 'salario', label: 'Salario diario', type: 'number' },
    ],
    onImport: (filas) => {
      const nuevos = filas
        .filter((f) => !empleados.some((e) => e.numero === f.numero))
        .map((f): Empleado => ({ numero: f.numero, nombre: f.nombre, area: f.area ?? '', puesto: f.puesto ?? '', ingreso: f.ingreso ?? '', salario: f.salario ?? 0 }))
      empleados = [...empleados, ...nuevos]
      siguiente = Math.max(siguiente, ...empleados.map((e) => e.numero + 1))
      pintar()
    },
  })
  if (r.confirmed) registrar(`Importación: ${r.value?.rows.length ?? 0} filas válidas, ${r.value?.errors.length ?? 0} con error`)
  else registrar('Importación cancelada')
}

async function exportar(): Promise<void> {
  await exportData(empleados, {
    filename: 'empleados',
    sheet: 'Empleados',
    columns: [
      { key: 'numero', label: 'Número' },
      { key: 'nombre', label: 'Nombre completo' },
      { key: 'area', label: 'Área' },
      { key: 'puesto', label: 'Puesto' },
      { key: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
      { key: 'salario', label: 'Salario diario', type: 'number' },
    ],
  })
  registrar(`Exportados ${empleados.length} empleados a empleados.xlsx`)
  toast.success('Se descargó empleados.xlsx')
}

async function vacaciones(): Promise<void> {
  const r = await formFromJSON(plantillas.vacaciones, { values: { empleado: empleados[0]?.nombre ?? '' } })
  if (!r.confirmed) return registrar('Solicitud de vacaciones cancelada')
  const v = r.value as Record<string, any>
  registrar(`Vacaciones de ${v.empleado}: ${JSON.stringify(v.fechas)}`)
  toast.success('Solicitud enviada a tu jefe')
}

async function masiva(): Promise<void> {
  const r = await bulkAction({
    title: `Mover a Logística a ${empleados.length} empleados`,
    items: empleados,
    label: (e) => e.nombre,
    describe: (e) => `${e.area} → Logística`,
    skip: (e) => e.area === 'Logística' && 'ya está en Logística',
    confirmText: (n) => `Mover ${n} empleados`,
    run: async (e) => {
      await new Promise((ok) => setTimeout(ok, 350))
      if (e.area === 'Ventas' && e.numero % 2 === 1) throw new Error('Sin permiso en Ventas')
      e.area = 'Logística'
    },
  })
  pintar()
  if (r.confirmed) registrar(`Mover de área: ${r.done.length} hechos, ${r.failed.length} con error, ${r.skipped.length} omitidos`)
}

async function darDeBaja(e: Empleado): Promise<void> {
  const ok = await confirmDelete({
    what: `a ${e.nombre}`,
    consequences: ['Se cancela su acceso a los sistemas', 'Se calcula su finiquito'],
    confirmText: 'Dar de baja',
  })
  if (!ok) return
  const indice = empleados.indexOf(e)
  empleados = empleados.filter((x) => x !== e)
  pintar()
  registrar(`Baja de ${e.nombre}`)
  toast.success(`Baja de ${e.nombre}`, {
    action: {
      label: 'Deshacer',
      onClick: () => {
        empleados = [...empleados.slice(0, indice), e, ...empleados.slice(indice)]
        pintar()
        registrar(`Baja deshecha: ${e.nombre}`)
      },
    },
  })
}

async function cambiarPuesto(e: Empleado): Promise<void> {
  const r = await form({
    title: `Cambiar puesto de ${e.nombre}`,
    fields: [
      { name: 'puesto', label: 'Nuevo puesto', required: true, value: e.puesto },
      { name: 'area', label: 'Área', type: 'select', options: ['Almacén', 'Logística', 'Ventas', 'Administración'], value: e.area },
      { name: 'salario', label: 'Salario diario', type: 'money', required: true, min: 278.8, value: e.salario },
    ],
  })
  if (!r.confirmed) return
  const v = r.value as { puesto: string; area: string; salario: number }
  Object.assign(e, { puesto: v.puesto, area: v.area, salario: Number(v.salario) })
  pintar()
  registrar(`Cambio de puesto de ${e.nombre}: ${e.puesto}, ${e.area}`)
}

$('e-alta').addEventListener('click', () => void alta())
$('e-importar').addEventListener('click', () => void importar())
$('e-exportar').addEventListener('click', () => void exportar())
$('e-vacaciones').addEventListener('click', () => void vacaciones())
$('e-masiva').addEventListener('click', () => void masiva())
pintar()
registrar('Lista cargada con 5 empleados de ejemplo')
