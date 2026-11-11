// Galería de ejemplos: cada bloque `@ejemplo` es un ejemplo que se ejecuta de verdad y cuyo código se muestra tal cual.
// El texto que ve la persona se arma con la línea `import:` y el cuerpo de la función; lo que devuelve `return` aparece
// como «Resultado» (y en el código mostrado el último `return x` se ve como `console.log(x)`).
import { dialog, configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { form, wizard, formFromJSON, type FormSchema } from 'nexus-dialogs/forms'
import { confirmDelete, unsavedChanges, sessionTimeout, approval, bulkAction, choose, loading } from 'nexus-dialogs/patterns'
import { isRFC, isCURP, isCLABE, businessDays, mexicanHolidays } from 'nexus-dialogs/mx'
import { importData, exportData } from 'nexus-dialogs/import'
import { pickRows } from 'nexus-dialogs/table'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'
import { themes } from 'nexus-dialogs/themes'

/* @ejemplo
 * id: alerta
 * grupo: Diálogos
 * titulo: Aviso con icono que se cierra solo
 * desc: Atajos con icono: success, error, warning e info. El timer se pausa con el mouse o el foco encima.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function alerta() {
  const r = await dialog.success({ title: 'Empleado guardado', text: 'Laura ya aparece en la nómina.', timer: 3000 })
  return r
}

/* @ejemplo
 * id: error
 * grupo: Diálogos
 * titulo: Error con explicación
 * desc: Título corto y texto con lo que pasó. El foco empieza en el botón y Esc cierra.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function error() {
  const r = await dialog.error('No se pudo timbrar', 'El SAT no respondió. Intenta de nuevo en unos minutos.')
  return r
}

/* @ejemplo
 * id: confirmar
 * grupo: Diálogos
 * titulo: Confirmar
 * desc: Siempre resuelve, nunca rechaza. `reason` dice cómo se cerró.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function confirmar() {
  const r = await dialog.confirm({ title: '¿Enviar a aprobación?', text: 'Tu jefe recibirá un aviso.', confirmText: 'Enviar' })
  return r
}

/* @ejemplo
 * id: preconfirm
 * grupo: Diálogos
 * titulo: Confirmar y esperar al servidor
 * desc: Mientras `preConfirm` corre, el botón dice «Procesando…» y nada se puede cerrar. Si lanza un Error, el mensaje aparece dentro. Prueba a fallar: la segunda vez sale bien.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function preconfirm() {
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let intentos = 0
  const r = await dialog.confirm({
    title: 'Timbrar 148 recibos',
    confirmText: 'Timbrar',
    preConfirm: async () => {
      await espera(1200)
      if (++intentos === 1) throw new Error('El SAT no respondió. Inténtalo otra vez.')
      return { folios: 148 }
    },
  })
  return r
}

/* @ejemplo
 * id: prompt
 * grupo: Diálogos
 * titulo: Pedir un dato
 * desc: Un campo con validación propia. El error aparece dentro y el foco vuelve al campo.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function prompt() {
  const r = await dialog.prompt({
    title: 'Nueva área',
    label: 'Nombre del área',
    input: 'text',
    validate: (v) => (v.length < 3 ? 'Escribe al menos 3 caracteres.' : null),
    confirmText: 'Crear área',
  })
  return r
}

/* @ejemplo
 * id: libre
 * grupo: Diálogos
 * titulo: Tus botones, tu contenido
 * desc: Tres salidas con roles distintos. `initialFocus: 'cancel'` deja el foco en «Seguir editando».
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function libre() {
  const r = await dialog.open({
    title: 'Tienes 2 cambios sin guardar',
    text: 'Si sales ahora, se pierden.',
    buttons: [
      { id: 'discard', role: 'deny', text: 'Descartar cambios' },
      { id: 'keep', role: 'cancel', text: 'Seguir editando', variant: 'secondary' },
      { id: 'save', role: 'confirm', text: 'Guardar y salir' },
    ],
    initialFocus: 'cancel',
  })
  return r
}

/* @ejemplo
 * id: panel
 * grupo: Diálogos
 * titulo: Panel lateral
 * desc: `placement` puede ser center, right, left o bottom. En pantallas angostas los centrados se vuelven hoja inferior.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function panel() {
  const r = await dialog.open({
    title: 'Filtros',
    placement: 'right',
    render: () => {
      const p = document.createElement('p')
      p.textContent = 'Aquí van tus filtros: área, puesto, fecha de ingreso…'
      return p
    },
    confirmText: 'Ver resultados',
  })
  return r
}

/* @ejemplo
 * id: borrar
 * grupo: Recetas
 * titulo: Confirmar un borrado
 * desc: El foco empieza en Cancelar y el botón rojo dice lo que borra. Devuelve true o false.
 * import: import { confirmDelete } from 'nexus-dialogs/patterns'
 */
export async function borrar() {
  const r = await confirmDelete({ what: 'a Laura Méndez' })
  return r
}

/* @ejemplo
 * id: borrar-grande
 * grupo: Recetas
 * titulo: Borrado grande: escribir el nombre
 * desc: Lista lo que se pierde y pide escribir el nombre. `onConfirm` muestra «Procesando…» y, si falla, el error.
 * import: import { confirmDelete } from 'nexus-dialogs/patterns'
 */
export async function borrarGrande() {
  const r = await confirmDelete({
    what: 'el periodo de nómina',
    name: 'Quincena 21',
    requireName: true,
    consequences: ['148 recibos calculados', '12 incidencias capturadas'],
    onConfirm: () => new Promise((ok) => setTimeout(ok, 1000)),
  })
  return r
}

/* @ejemplo
 * id: sin-guardar
 * grupo: Recetas
 * titulo: Salir con cambios sin guardar
 * desc: Muestra qué cambió. El foco empieza en «Seguir editando»; Esc también regresa al formulario.
 * import: import { unsavedChanges } from 'nexus-dialogs/patterns'
 */
export async function sinGuardar() {
  const r = await unsavedChanges({
    changes: [{ label: 'Salario diario', from: '$ 980.00', to: '$ 1,150.00' }],
    onSave: () => new Promise((ok) => setTimeout(ok, 800)),
  })
  return r
}

/* @ejemplo
 * id: sesion
 * grupo: Recetas
 * titulo: Sesión por expirar
 * desc: Cuenta regresiva visible (WCAG 2.2.1), foco en «Seguir trabajando». Aquí dura 20 segundos para que lo veas.
 * import: import { sessionTimeout } from 'nexus-dialogs/patterns'
 */
export async function sesion() {
  const r = await sessionTimeout({ seconds: 20 })
  return r
}

/* @ejemplo
 * id: aprobar
 * grupo: Recetas
 * titulo: Aprobar o rechazar
 * desc: Aprobar admite comentario; rechazar abre un segundo paso con motivos rápidos y explicación obligatoria.
 * import: import { approval } from 'nexus-dialogs/patterns'
 */
export async function aprobar() {
  const r = await approval({
    title: 'Vacaciones de Diego Ramírez',
    subtitle: 'Solicitud SOL-2026-0412 · hace 2 h',
    details: [
      { label: 'Fechas', value: '16 – 20 dic' },
      { label: 'Días hábiles', value: '5' },
    ],
    warning: '2 personas de Almacén ya tienen vacaciones esos días.',
    reasons: ['Cubre otro turno', 'Cierre de inventario', 'Sin saldo'],
    allowRequestInfo: true,
  })
  return r
}

/* @ejemplo
 * id: masiva
 * grupo: Recetas
 * titulo: Acción masiva con progreso
 * desc: Vista previa, confirmación, barra de progreso y resultado fila por fila. Si una falla, sigue con las demás y ofrece «Reintentar».
 * import: import { bulkAction } from 'nexus-dialogs/patterns'
 */
export async function masiva() {
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const empleados = [
    { id: 1, nombre: 'Ana Torres', area: 'Almacén' },
    { id: 2, nombre: 'Diego Ramírez', area: 'Logística' },
    { id: 3, nombre: 'Laura Méndez', area: 'Almacén' },
    { id: 4, nombre: 'Mateo Cruz', area: 'Ventas' },
  ]
  const r = await bulkAction({
    title: 'Cambiar de área a 4 empleados',
    items: empleados,
    label: (e) => e.nombre,
    describe: (e) => `${e.area} → Logística`,
    skip: (e) => e.area === 'Logística' && 'ya está en Logística',
    confirmText: (n) => `Mover ${n} empleados`,
    run: async (e) => {
      await espera(600)
      if (e.id === 4) throw new Error('Sin permiso en Ventas')
    },
  })
  return { hechos: r.done.length, fallidos: r.failed.length, omitidos: r.skipped.length }
}

/* @ejemplo
 * id: elegir
 * grupo: Recetas
 * titulo: Elegir entre opciones
 * desc: Lista con descripción por opción. Devuelve el valor elegido o null si se cierra.
 * import: import { choose } from 'nexus-dialogs/patterns'
 */
export async function elegir() {
  const formato = await choose({
    title: 'Exportar nómina',
    options: [
      { value: 'xlsx', label: 'Excel', description: 'Para revisar y filtrar' },
      { value: 'csv', label: 'CSV', description: 'Para importar en otro sistema' },
    ],
  })
  return formato
}

/* @ejemplo
 * id: espera
 * grupo: Recetas
 * titulo: Bloquear mientras termina algo
 * desc: Si la tarea falla, la espera se cierra y el error se relanza para que lo muestres.
 * import: import { loading } from 'nexus-dialogs/patterns'
 */
export async function espera() {
  const folios = await loading(
    'Timbrando 148 recibos…',
    () => new Promise<number>((ok) => setTimeout(() => ok(148), 1800)),
  )
  return folios
}

/* @ejemplo
 * id: gasto
 * grupo: Formularios
 * titulo: Formulario con validación
 * desc: RFC con formato real, importe en pesos, campo que aparece según otro y validación que mira varios campos. Los errores salen en un resumen con enlaces.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function gasto() {
  const r = await form({
    title: 'Nuevo gasto',
    columns: 2,
    submitText: 'Enviar a aprobación',
    fields: [
      { name: 'rfc', label: 'RFC del proveedor', type: 'rfc', required: true },
      { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
      { name: 'tipo', label: 'Tipo', type: 'segmented', options: ['Persona', 'Empresa'], value: 'Empresa' },
      { name: 'razon', label: 'Razón social', visible: (v) => v.tipo === 'Empresa', required: true },
      { name: 'concepto', label: 'Concepto', type: 'textarea', span: 2, maxLength: 200 },
    ],
    validate: (v) => (Number(v.importe) > 50000 ? { importe: 'Más de $50,000 requiere orden de compra.' } : undefined),
  })
  return r
}

/* @ejemplo
 * id: combobox
 * grupo: Formularios
 * titulo: Buscar y elegir (uno o varios)
 * desc: Busca sin acentos («nomina» encuentra «Nómina»). Flechas, Enter y Esc; en múltiple cada elegido es un chip.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function combobox() {
  const r = await form({
    title: 'Armar equipo',
    fields: [
      {
        name: 'lider',
        label: 'Líder',
        type: 'combobox',
        required: true,
        options: ['Ana Torres', 'Diego Ramírez', 'Laura Méndez', 'Mateo Cruz'],
      },
      {
        name: 'equipo',
        label: 'Equipo',
        type: 'combobox',
        multiple: true,
        maxItems: 3,
        options: [
          { value: 'ana', label: 'Ana Torres', description: 'Almacén', group: 'Almacén' },
          { value: 'laura', label: 'Laura Méndez', description: 'Almacén', group: 'Almacén' },
          { value: 'diego', label: 'Diego Ramírez', description: 'Logística', group: 'Logística' },
          { value: 'mateo', label: 'Mateo Cruz', description: 'Ventas', group: 'Ventas' },
        ],
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: vacaciones
 * grupo: Formularios
 * titulo: Vacaciones con calendario y días hábiles
 * desc: El rango se elige en un calendario (dos clics). Los fines de semana quedan rayados, los festivos de ley (art. 74 LFT) se marcan y `maxDays` cuenta solo días hábiles.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function vacaciones() {
  const r = await form({
    title: 'Solicitar vacaciones',
    fields: [
      {
        name: 'dias',
        label: 'Fechas',
        type: 'daterange',
        calendar: true,
        businessDays: true,
        holidays: ['2026-12-24', '2026-12-31'],
        maxDays: 12,
        required: true,
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: contacto
 * grupo: Formularios
 * titulo: Teléfono con lada y domicilio por código postal
 * desc: El teléfono se formatea al escribir y entrega +52…; el domicilio llena estado y municipio con el CP (aquí con 3 CP de ejemplo; tú conectas tu API o el catálogo SEPOMEX).
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function contacto() {
  const catalogo: Record<string, { state: string; municipality: string; neighborhoods: string[] }> = {
    '06600': { state: 'Ciudad de México', municipality: 'Cuauhtémoc', neighborhoods: ['Juárez', 'Roma Sur'] },
    '64000': { state: 'Nuevo León', municipality: 'Monterrey', neighborhoods: ['Centro'] },
    '44100': { state: 'Jalisco', municipality: 'Guadalajara', neighborhoods: ['Americana', 'Moderna'] },
  }
  const r = await form({
    title: 'Datos de contacto',
    fields: [
      { name: 'telefono', label: 'Teléfono', type: 'phone', required: true },
      {
        name: 'domicilio',
        label: 'Domicilio',
        type: 'address',
        required: true,
        lookupPostalCode: async (cp: string) => catalogo[cp] ?? null,
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: partidas
 * grupo: Formularios
 * titulo: Filas repetibles con totales
 * desc: Cada fila valida sus campos y los totales se recalculan al escribir.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function partidas() {
  const pesos = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
  const r = await form({
    title: 'Comprobación de gastos',
    size: 'lg',
    fields: [
      {
        name: 'partidas',
        label: 'Partidas',
        type: 'items',
        required: true,
        maxRows: 20,
        addText: 'Agregar partida',
        fields: [
          { name: 'concepto', label: 'Concepto', required: true },
          { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, value: 1 },
          { name: 'precio', label: 'Precio unitario', type: 'money', required: true },
        ],
        totals: (filas) => {
          const subtotal = filas.reduce((s, f) => s + (Number(f.cantidad) || 0) * (Number(f.precio) || 0), 0)
          return [
            { label: 'Subtotal', value: pesos(subtotal) },
            { label: 'IVA', value: pesos(subtotal * 0.16) },
            { label: 'Total', value: pesos(subtotal * 1.16) },
          ]
        },
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: firma
 * grupo: Formularios
 * titulo: Firma en pantalla
 * desc: Se firma con el dedo, el mouse o la pluma; con teclado, «Escribir mi nombre» la dibuja con letra manuscrita. El valor es un PNG.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function firma() {
  const r = await form({
    title: 'Recibí mi finiquito',
    fields: [{ name: 'firma', label: 'Firma del empleado', type: 'signature', required: true }],
  })
  return { confirmed: r.confirmed, firma: r.value ? `${String(r.value.firma).slice(0, 40)}…` : null }
}

/* @ejemplo
 * id: asistente
 * grupo: Asistentes
 * titulo: Asistente con pasos condicionales y revisión
 * desc: «Datos fiscales» solo aparece si el tipo es empresa. El último paso resume todo con «Editar» por sección.
 * import: import { wizard } from 'nexus-dialogs/forms'
 */
export async function asistente() {
  const r = await wizard({
    title: 'Alta de proveedor',
    review: true,
    submitText: 'Dar de alta',
    steps: [
      {
        title: 'Datos generales',
        fields: [
          { name: 'nombre', label: 'Nombre o razón social', required: true },
          { name: 'tipo', label: 'Tipo', type: 'segmented', options: ['persona', 'empresa'], value: 'persona' },
        ],
      },
      {
        title: 'Datos fiscales',
        when: { field: 'tipo', equals: 'empresa' },
        fields: [
          { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
          { name: 'regimen', label: 'Régimen', type: 'select', options: ['601 General', '603 Personas morales sin fines de lucro'] },
        ],
      },
      { title: 'Pago', fields: [{ name: 'clabe', label: 'CLABE', type: 'clabe', required: true }] },
    ],
  })
  return r
}

/* @ejemplo
 * id: json
 * grupo: Asistentes
 * titulo: Formulario guardado como JSON
 * desc: Para que cada empresa tenga sus formularios en tu base de datos. Las funciones van por nombre y las pasas en `resolvers`.
 * import: import { formFromJSON, type FormSchema } from 'nexus-dialogs/forms'
 */
export async function json() {
  const esquema: FormSchema = {
    title: 'Solicitud de permiso',
    columns: 2,
    fields: [
      { name: 'motivo', label: 'Motivo', type: 'select', required: true, options: ['Personal', 'Médico', 'Otro'] },
      { name: 'otro', label: '¿Cuál?', required: true, visibleIf: { field: 'motivo', equals: 'Otro' } },
      { name: 'rfc', label: 'RFC', type: 'rfc', validate: 'rfcLibre' },
    ],
  }
  const r = await formFromJSON(esquema, {
    resolvers: { rfcLibre: async (rfc: string) => (rfc === 'PEMJ900515AB3' ? 'Ya está registrado' : null) },
  })
  return r
}

/* @ejemplo
 * id: plantilla-alta
 * grupo: RR. HH. y México
 * titulo: Plantilla: alta de empleado
 * desc: Asistente de 4 pasos con revisión, listo en JSON. Usa funciones por nombre (rfcLibre, curpLibre, buscarCP): aquí se quitan con `sinResolvers`; en tu sistema las conectas a tu API.
 * import: import { formFromJSON } from 'nexus-dialogs/forms'\nimport { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'
 */
export async function plantillaAlta() {
  const r = await formFromJSON(sinResolvers(plantillas.altaEmpleado))
  return r
}

/* @ejemplo
 * id: plantilla-permiso
 * grupo: RR. HH. y México
 * titulo: Plantilla: permiso
 * desc: Seis plantillas de RR. HH.: alta, vacaciones, permiso, incapacidad, baja y gastos.
 * import: import { formFromJSON } from 'nexus-dialogs/forms'\nimport { plantillas } from 'nexus-dialogs/rrhh'
 */
export async function plantillaPermiso() {
  const r = await formFromJSON(plantillas.permiso, { values: { empleado: 'Ana Torres' } })
  return r
}

/* @ejemplo
 * id: validadores
 * grupo: RR. HH. y México
 * titulo: Validadores de RFC, CURP y CLABE
 * desc: Sin DOM: sirven también en tu API con Node. CURP y CLABE validan el dígito verificador, no solo el formato.
 * import: import { isRFC, isCURP, isCLABE } from 'nexus-dialogs/mx'
 */
export function validadores() {
  return {
    rfc: isRFC('PEMJ900515AB3'),
    curp: isCURP('PELJ900515HJCRPN03'),
    clabeBuena: isCLABE('002010077777777771'),
    clabeMala: isCLABE('002010077777777772'),
  }
}

/* @ejemplo
 * id: habiles
 * grupo: RR. HH. y México
 * titulo: Días hábiles y festivos de México
 * desc: Los festivos de ley salen del artículo 74 de la LFT (con los lunes movibles). Sirven en el servidor para calcular fechas límite.
 * import: import { businessDays, mexicanHolidays } from 'nexus-dialogs/mx'
 */
export function habiles() {
  return {
    festivos2026: mexicanHolidays(2026),
    habilesDel14al18dic: businessDays('2026-12-14', '2026-12-18'),
    habilesTodoDic: businessDays('2026-12-01', '2026-12-31'),
  }
}

/* @ejemplo
 * id: importar
 * grupo: Datos
 * titulo: Importar CSV o Excel
 * desc: Tres pasos: elegir el archivo, relacionar columnas (se relacionan solas por nombre) y revisar errores por fila. «Descargar plantilla» baja un CSV con los encabezados para probar.
 * import: import { importData } from 'nexus-dialogs/import'
 */
export async function importar() {
  const r = await importData({
    title: 'Importar empleados',
    columns: [
      { name: 'numero', label: 'Número de empleado', required: true, unique: true },
      { name: 'nombre', label: 'Nombre completo', required: true, aliases: ['empleado'] },
      { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
      { name: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
      { name: 'salario', label: 'Salario diario', type: 'number' },
    ],
    onImport: () => new Promise((ok) => setTimeout(ok, 800)),
  })
  return r
}

/* @ejemplo
 * id: tabla
 * grupo: Datos
 * titulo: Elegir filas de una tabla
 * desc: Búsqueda sin acentos, páginas y selección que se conserva al buscar. Con `onExport` aparece «Exportar seleccionados».
 * import: import { pickRows } from 'nexus-dialogs/table'
 */
export async function tabla() {
  const empleados = Array.from({ length: 37 }, (_, i) => ({
    numero: 1000 + i,
    nombre: ['Ana Torres', 'Diego Ramírez', 'Laura Méndez', 'Mateo Cruz', 'Sofía Núñez'][i % 5] + ` ${i + 1}`,
    area: ['Almacén', 'Logística', 'Ventas'][i % 3],
    baja: i === 3,
  }))
  const r = await pickRows({
    title: 'Agregar participantes',
    rows: empleados,
    rowKey: 'numero',
    columns: [
      { key: 'numero', label: 'Núm.' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'area', label: 'Área' },
    ],
    isDisabled: (e) => e.baja,
    max: 30,
  })
  return r.confirmed ? { elegidos: (r.value ?? []).length } : r
}

/* @ejemplo
 * id: exportar
 * grupo: Datos
 * titulo: Exportar a Excel
 * desc: Sin dependencias: arma el .xlsx con encabezados en negrita, fila fija, filtros y fechas y números reales. Descarga empleados.xlsx.
 * import: import { exportData } from 'nexus-dialogs/import'
 */
export async function exportar() {
  const empleados = [
    { numero: 1001, nombre: 'Ana Torres', ingreso: '2022-03-14', salario: 612.5 },
    { numero: 1002, nombre: 'Diego Ramírez', ingreso: '2021-08-02', salario: 700 },
    { numero: 1003, nombre: 'Laura Méndez', ingreso: '2023-01-09', salario: 580.25 },
  ]
  await exportData(empleados, {
    filename: 'empleados',
    sheet: 'Empleados',
    columns: [
      { key: 'numero', label: 'Número' },
      { key: 'nombre', label: 'Nombre completo' },
      { key: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
      { key: 'salario', label: 'Salario diario', type: 'number' },
    ],
  })
}

/* @ejemplo
 * id: toast
 * grupo: Toasts
 * titulo: Toast con acción «Deshacer»
 * desc: Cola de 3 visibles, se pausa con el mouse o el foco y se anuncia al lector de pantalla. Dentro de un modal se monta dentro de él para que «Deshacer» se pueda pulsar.
 * import: import { toast } from 'nexus-dialogs/toast'
 */
export function toastAccion() {
  toast('Se archivaron 3 recibos', { action: { label: 'Deshacer', onClick: () => toast.success('Recibos restaurados') } })
}

/* @ejemplo
 * id: toast-promesa
 * grupo: Toasts
 * titulo: Toast que sigue una promesa
 * desc: Pasa de «Calculando…» a éxito o error según lo que pase con la promesa.
 * import: import { toast } from 'nexus-dialogs/toast'
 */
export async function toastPromesa() {
  const calcularNomina = () => new Promise<number>((ok) => setTimeout(() => ok(148), 1800))
  await toast.promise(calcularNomina(), {
    loading: 'Calculando nómina…',
    success: (n) => `${n} recibos listos`,
    error: (e) => String(e),
  })
}

/* @ejemplo
 * id: tema
 * grupo: Temas e idioma
 * titulo: Cambiar de tema
 * desc: Todo color y medida sale de variables --nd-*. Hay temas listos para Bootstrap, Tailwind y Material. Aquí se aplica solo mientras el diálogo está abierto.
 * import: import { configure } from 'nexus-dialogs'\nimport { themes } from 'nexus-dialogs/themes'
 */
export async function tema() {
  configure({ theme: themes.material })
  try {
    const r = await dialog.confirm({ title: 'Con el tema Material', text: 'Los colores y las esquinas cambian en toda la app.' })
    return r
  } finally {
    configure({ theme: themes.light })
  }
}

/* @ejemplo
 * id: ingles
 * grupo: Temas e idioma
 * titulo: Inglés
 * desc: Español por omisión. `configure({ lang: 'en' })` cambia todos los textos propios; aquí vuelve a español al cerrar.
 * import: import { configure, dialog } from 'nexus-dialogs'
 */
export async function ingles() {
  configure({ lang: 'en' })
  try {
    const r = await dialog.confirm({ title: 'Delete this record?', danger: true, confirmText: 'Delete' })
    return r
  } finally {
    configure({ lang: 'es' })
  }
}
