// Mini ERP de la documentación: varios módulos de nexus-dialogs trabajando juntos con datos en memoria.
import './comun'
import { idioma } from './textos'
import { toast } from 'nexus-dialogs/toast'
import { form, formFromJSON } from 'nexus-dialogs/forms'
import { confirmDelete, bulkAction } from 'nexus-dialogs/patterns'
import { importData, exportData } from 'nexus-dialogs/import'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'

// Textos de la página y datos de muestra, en el idioma de la página (español e inglés; el resto sigue el contenido en español).
// Las plantillas de RR. HH. (alta, vacaciones) son JSON en español: se pueden traducir porque son datos.
const TXT = {
  es: {
    locale: 'es-MX',
    area: { alm: 'Almacén', log: 'Logística', ven: 'Ventas', adm: 'Administración' },
    puestos: ['Jefa de turno', 'Coordinador', 'Montacarguista', 'Ejecutivo', 'Ejecutiva'],
    changeJob: 'Cambiar puesto',
    changeJobOf: (n: string) => `Cambiar puesto de ${n}`,
    fire: 'Baja',
    fireOf: (n: string) => `Dar de baja a ${n}`,
    cancelledHire: 'Alta cancelada',
    hired: (n: string, k: number) => `Alta de ${n} (núm. ${k})`,
    inList: (n: string) => `${n} ya está en la lista`,
    importTitle: 'Importar empleados',
    colNumber: 'Número de empleado',
    colName: 'Nombre completo',
    aliasName: 'empleado',
    colArea: 'Área',
    aliasArea: 'departamento',
    colJob: 'Puesto',
    colHired: 'Fecha de ingreso',
    colSalary: 'Salario diario',
    imported: (ok: number, bad: number) => `Importación: ${ok} filas válidas, ${bad} con error`,
    importCancelled: 'Importación cancelada',
    file: 'empleados',
    sheet: 'Empleados',
    xNumber: 'Número',
    exported: (n: number) => `Exportados ${n} empleados a empleados.xlsx`,
    downloaded: 'Se descargó empleados.xlsx',
    vacCancelled: 'Solicitud de vacaciones cancelada',
    vacOf: (e: string, f: string) => `Vacaciones de ${e}: ${f}`,
    vacSent: 'Solicitud enviada a tu jefe',
    moveTitle: (n: number) => `Mover a Logística a ${n} empleados`,
    moveTo: (a: string) => `${a} → Logística`,
    already: 'ya está en Logística',
    moveBtn: (n: number) => `Mover ${n} empleados`,
    noPerm: 'Sin permiso en Ventas',
    moved: (d: number, f: number, s: number) => `Mover de área: ${d} hechos, ${f} con error, ${s} omitidos`,
    what: (n: string) => `a ${n}`,
    cons: ['Se cancela su acceso a los sistemas', 'Se calcula su finiquito'],
    fireBtn: 'Dar de baja',
    fired: (n: string) => `Baja de ${n}`,
    undo: 'Deshacer',
    undone: (n: string) => `Baja deshecha: ${n}`,
    newJob: 'Nuevo puesto',
    jobChanged: (n: string, p: string, a: string) => `Cambio de puesto de ${n}: ${p}, ${a}`,
    loaded: 'Lista cargada con 5 empleados de ejemplo',
  },
  en: {
    locale: 'en-US',
    area: { alm: 'Warehouse', log: 'Logistics', ven: 'Sales', adm: 'Administration' },
    puestos: ['Shift lead', 'Coordinator', 'Forklift operator', 'Executive', 'Executive'],
    changeJob: 'Change position',
    changeJobOf: (n: string) => `Change position of ${n}`,
    fire: 'Remove',
    fireOf: (n: string) => `Remove ${n}`,
    cancelledHire: 'Hire cancelled',
    hired: (n: string, k: number) => `Hired ${n} (no. ${k})`,
    inList: (n: string) => `${n} is now in the list`,
    importTitle: 'Import employees',
    colNumber: 'Employee number',
    colName: 'Full name',
    aliasName: 'employee',
    colArea: 'Area',
    aliasArea: 'department',
    colJob: 'Position',
    colHired: 'Hire date',
    colSalary: 'Daily salary',
    imported: (ok: number, bad: number) => `Import: ${ok} valid rows, ${bad} with errors`,
    importCancelled: 'Import cancelled',
    file: 'employees',
    sheet: 'Employees',
    xNumber: 'Number',
    exported: (n: number) => `Exported ${n} employees to employees.xlsx`,
    downloaded: 'employees.xlsx was downloaded',
    vacCancelled: 'Vacation request cancelled',
    vacOf: (e: string, f: string) => `Vacation of ${e}: ${f}`,
    vacSent: 'Request sent to your manager',
    moveTitle: (n: number) => `Move ${n} employees to Logistics`,
    moveTo: (a: string) => `${a} → Logistics`,
    already: 'already in Logistics',
    moveBtn: (n: number) => `Move ${n} employees`,
    noPerm: 'No permission in Sales',
    moved: (d: number, f: number, s: number) => `Move area: ${d} done, ${f} with errors, ${s} skipped`,
    what: (n: string) => n,
    cons: ['Their access to the systems is cancelled', 'Their severance is calculated'],
    fireBtn: 'Remove employee',
    fired: (n: string) => `Removed ${n}`,
    undo: 'Undo',
    undone: (n: string) => `Removal undone: ${n}`,
    newJob: 'New position',
    jobChanged: (n: string, p: string, a: string) => `Position change of ${n}: ${p}, ${a}`,
    loaded: 'List loaded with 5 sample employees',
  },
}
const T = idioma === 'en' ? TXT.en : TXT.es

interface Empleado {
  numero: number
  nombre: string
  area: string
  puesto: string
  ingreso: string
  salario: number
}

let empleados: Empleado[] = [
  { numero: 1001, nombre: 'Ana Torres', area: T.area.alm, puesto: T.puestos[0], ingreso: '2022-03-14', salario: 612.5 },
  { numero: 1002, nombre: 'Diego Ramírez', area: T.area.log, puesto: T.puestos[1], ingreso: '2021-08-02', salario: 700 },
  { numero: 1003, nombre: 'Laura Méndez', area: T.area.alm, puesto: T.puestos[2], ingreso: '2023-01-09', salario: 580.25 },
  { numero: 1004, nombre: 'Mateo Cruz', area: T.area.ven, puesto: T.puestos[3], ingreso: '2020-11-23', salario: 655 },
  { numero: 1005, nombre: 'Sofía Núñez', area: T.area.ven, puesto: T.puestos[4], ingreso: '2024-02-05', salario: 598.75 },
]
let siguiente = 1006

const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E
const pesos = new Intl.NumberFormat(T.locale, { style: 'currency', currency: 'MXN' })

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
    puesto.textContent = T.changeJob
    puesto.setAttribute('aria-label', T.changeJobOf(e.nombre))
    puesto.addEventListener('click', () => void cambiarPuesto(e))
    const baja = document.createElement('button')
    baja.type = 'button'
    baja.className = 'btn chico peligro'
    baja.textContent = T.fire
    baja.setAttribute('aria-label', T.fireOf(e.nombre))
    baja.addEventListener('click', () => void darDeBaja(e))
    acc.append(puesto, baja)
    fila.appendChild(acc)
    cuerpo.appendChild(fila)
  }
  $('e-total').textContent = String(empleados.length)
}

function registrar(texto: string): void {
  const li = document.createElement('li')
  li.textContent = `${new Date().toLocaleTimeString(T.locale)} · ${texto}`
  const lista = $('e-log')
  lista.prepend(li)
  while (lista.children.length > 8) lista.lastElementChild!.remove()
}

async function alta(): Promise<void> {
  const r = await formFromJSON(sinResolvers(plantillas.altaEmpleado))
  if (!r.confirmed) return registrar(T.cancelledHire)
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
  registrar(T.hired(e.nombre, e.numero))
  toast.success(T.inList(e.nombre))
}

async function importar(): Promise<void> {
  const r = await importData<Record<string, any>>({
    title: T.importTitle,
    columns: [
      { name: 'numero', label: T.colNumber, type: 'number', required: true, unique: true },
      { name: 'nombre', label: T.colName, required: true, aliases: [T.aliasName] },
      { name: 'area', label: T.colArea, aliases: [T.aliasArea] },
      { name: 'puesto', label: T.colJob },
      { name: 'ingreso', label: T.colHired, type: 'date' },
      { name: 'salario', label: T.colSalary, type: 'number' },
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
  if (r.confirmed) registrar(T.imported(r.value?.rows.length ?? 0, r.value?.errors.length ?? 0))
  else registrar(T.importCancelled)
}

async function exportar(): Promise<void> {
  await exportData(empleados, {
    filename: T.file,
    sheet: T.sheet,
    columns: [
      { key: 'numero', label: T.xNumber },
      { key: 'nombre', label: T.colName },
      { key: 'area', label: T.colArea },
      { key: 'puesto', label: T.colJob },
      { key: 'ingreso', label: T.colHired, type: 'date' },
      { key: 'salario', label: T.colSalary, type: 'number' },
    ],
  })
  registrar(T.exported(empleados.length))
  toast.success(T.downloaded)
}

async function vacaciones(): Promise<void> {
  const r = await formFromJSON(plantillas.vacaciones, { values: { empleado: empleados[0]?.nombre ?? '' } })
  if (!r.confirmed) return registrar(T.vacCancelled)
  const v = r.value as Record<string, any>
  registrar(T.vacOf(v.empleado, JSON.stringify(v.fechas)))
  toast.success(T.vacSent)
}

async function masiva(): Promise<void> {
  const r = await bulkAction({
    title: T.moveTitle(empleados.length),
    items: empleados,
    label: (e) => e.nombre,
    describe: (e) => T.moveTo(e.area),
    skip: (e) => e.area === T.area.log && T.already,
    confirmText: (n) => T.moveBtn(n),
    run: async (e) => {
      await new Promise((ok) => setTimeout(ok, 350))
      if (e.area === T.area.ven && e.numero % 2 === 1) throw new Error(T.noPerm)
      e.area = T.area.log
    },
  })
  pintar()
  if (r.confirmed) registrar(T.moved(r.done.length, r.failed.length, r.skipped.length))
}

async function darDeBaja(e: Empleado): Promise<void> {
  const ok = await confirmDelete({
    what: T.what(e.nombre),
    consequences: T.cons,
    confirmText: T.fireBtn,
  })
  if (!ok) return
  const indice = empleados.indexOf(e)
  empleados = empleados.filter((x) => x !== e)
  pintar()
  registrar(T.fired(e.nombre))
  toast.success(T.fired(e.nombre), {
    action: {
      label: T.undo,
      onClick: () => {
        empleados = [...empleados.slice(0, indice), e, ...empleados.slice(indice)]
        pintar()
        registrar(T.undone(e.nombre))
      },
    },
  })
}

async function cambiarPuesto(e: Empleado): Promise<void> {
  const r = await form({
    title: T.changeJobOf(e.nombre),
    fields: [
      { name: 'puesto', label: T.newJob, required: true, value: e.puesto },
      { name: 'area', label: T.colArea, type: 'select', options: [T.area.alm, T.area.log, T.area.ven, T.area.adm], value: e.area },
      { name: 'salario', label: T.colSalary, type: 'money', required: true, min: 278.8, value: e.salario },
    ],
  })
  if (!r.confirmed) return
  const v = r.value as { puesto: string; area: string; salario: number }
  Object.assign(e, { puesto: v.puesto, area: v.area, salario: Number(v.salario) })
  pintar()
  registrar(T.jobChanged(e.nombre, e.puesto, e.area))
}

$('e-alta').addEventListener('click', () => void alta())
$('e-importar').addEventListener('click', () => void importar())
$('e-exportar').addEventListener('click', () => void exportar())
$('e-vacaciones').addEventListener('click', () => void vacaciones())
$('e-masiva').addEventListener('click', () => void masiva())
pintar()
registrar(T.loaded)
