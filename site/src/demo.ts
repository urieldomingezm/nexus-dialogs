// «Míralo en acción»: una pantalla de muestra (decorativa) que repite un borrado y un formulario con los colores de cada tema,
// y el selector de apariencia, que también cambia los diálogos y toasts reales de la página.
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { confirmDelete } from 'nexus-dialogs/patterns'
import { themes, type Theme } from 'nexus-dialogs/themes'
import { chispas } from './animaciones'
import { decorarCodigo } from './comun'

const $ = <T extends HTMLElement>(q: string) => document.querySelector<T>(q)
const pantalla = $('.demo-pantalla')
const controles = document.querySelector('.demo-apariencia')

type Apariencia = 'nexus' | 'material' | 'bootstrap' | 'tailwind' | 'oscuro'
const NOMBRES: Record<Apariencia, string> = { nexus: 'Nexus', material: 'Material', bootstrap: 'Bootstrap', tailwind: 'Tailwind', oscuro: 'Oscuro' }
// Cada apariencia con su paleta clara y oscura (Bootstrap y Material no traen oscura: en oscuro vale la de Nexus), como en la mesa de pruebas.
// El sitio define su propio `--nd-accent-contrast` en :root; los temas claros de otros sistemas no lo traen y lo heredarían (texto casi
// blanco violeta sobre su azul), así que aquí se fija al blanco de siempre de la librería.
const BLANCO: Theme = { '--nd-accent-contrast': '#fff' }
const PARES: Record<Apariencia, { claro: Theme; oscuro: Theme }> = {
  nexus: { claro: {}, oscuro: {} },
  material: { claro: { ...BLANCO, ...themes.material }, oscuro: {} },
  bootstrap: { claro: { ...BLANCO, ...themes.bootstrap }, oscuro: {} },
  tailwind: { claro: { ...BLANCO, ...themes.tailwind }, oscuro: themes.tailwindDark },
  oscuro: { claro: themes.dark, oscuro: themes.dark },
}

let actual: Apariencia = 'nexus'
let tocado = false // hasta que se elija una apariencia, la configuración de la página no se toca
let puestas: string[] = []

const paginaOscura = (): boolean => {
  const t = document.documentElement.dataset.tema
  return t === 'oscuro' || (t !== 'claro' && matchMedia('(prefers-color-scheme: dark)').matches)
}

function aplicar(): void {
  const oscuro = actual === 'oscuro' || paginaOscura()
  const vars = PARES[actual][oscuro ? 'oscuro' : 'claro']
  if (pantalla) {
    for (const k of puestas) pantalla.style.removeProperty(k)
    puestas = Object.keys(vars)
    for (const k of puestas) pantalla.style.setProperty(k, vars[k])
    pantalla.classList.toggle('oscuro', oscuro)
  }
  for (const b of controles?.querySelectorAll<HTMLButtonElement>('button[data-apariencia]') ?? [])
    b.setAttribute('aria-pressed', String(b.dataset.apariencia === actual))
  if (!tocado) return
  // Los diálogos y toasts de verdad (el botón «Ejecutar», los ejemplos) salen con la misma apariencia.
  configure({ theme: vars })
  toast.configure({ theme: vars })
  const estado = $('#demo-estado')
  if (estado) estado.textContent = `Los diálogos de esta página salen ahora con la apariencia ${NOMBRES[actual]}.`
}

controles?.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>('button[data-apariencia]')
  if (!b) return
  actual = b.dataset.apariencia as Apariencia
  tocado = true
  aplicar()
})
new MutationObserver(aplicar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicar)
aplicar()

$('#b-demo')?.addEventListener('click', async (e) => {
  if (await confirmDelete({ what: 'a Laura Méndez' })) {
    toast.success('Laura Méndez eliminada')
    chispas(e.currentTarget as Element)
  }
})

// ── La maqueta ───────────────────────────────────────────────────────────────
// Botones y campos de verdad, con validación, que se pueden usar. Mientras nadie la toca, un cursor la recorre sola como invitación
// (no con «reducir movimiento»); en cuanto alguien la usa, la animación se detiene y todo queda en sus manos.
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)')
const dialogo = pantalla?.querySelector<HTMLElement>('.demo-dialogo') ?? null
const avisoToast = pantalla?.querySelector<HTMLElement>('.demo-toast') ?? null
const textoToast = avisoToast?.querySelector('span') ?? null
const deshacer = avisoToast?.querySelector<HTMLButtonElement>('.demo-deshacer') ?? null
const cursor = pantalla?.querySelector<HTMLElement>('.demo-cursor') ?? null

type Escena = 'borrar' | 'formulario' | 'aprobar' | 'vacaciones' | 'asistente' | 'importar' | 'descartar'
const ESCENAS: Escena[] = ['borrar', 'formulario', 'aprobar', 'vacaciones', 'asistente', 'importar', 'descartar']

// Estado de las escenas con varios pasos (se reinicia al abrir la escena).
const datos = { paso: 1, nombre: '', puesto: 'Ventas', cargado: false }
const PUESTOS = ['Ventas', 'Contabilidad', 'Operaciones']
const FILAS = [
  ['Laura Méndez', true],
  ['Mario Ruiz', true],
  ['Ana Soto', true],
  ['Pedro Vega', false],
] as const

const botones = (cancelar: [string, string], principal: [string, string]): string =>
  `<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="${cancelar[0]}">${cancelar[1]}</button><button type="button" class="demo-btn primario" data-accion="${principal[0]}">${principal[1]}</button></div>`

// Plantillas propias de este archivo, sin datos de nadie.
const HTML_ESCENA: Record<Escena, () => string> = {
  borrar: () => `<p class="demo-titulo">¿Eliminar a Laura Méndez?</p>
<p class="demo-texto">Se eliminará su registro. Esta acción no se puede deshacer.</p>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="cancelar">Cancelar</button><button type="button" class="demo-btn peligro" data-accion="eliminar">Eliminar</button></div>`,
  formulario: () => `<p class="demo-titulo">Nuevo gasto</p>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-rfc">RFC del proveedor</label><input class="demo-entrada" id="demo-rfc" autocomplete="off" spellcheck="false" aria-describedby="demo-rfc-e" /><span class="demo-error" id="demo-rfc-e"></span></div>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-importe">Importe</label><input class="demo-entrada" id="demo-importe" inputmode="decimal" autocomplete="off" aria-describedby="demo-importe-e" /><span class="demo-error" id="demo-importe-e"></span></div>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="cancelar">Cancelar</button><button type="button" class="demo-btn primario" data-accion="guardar">Guardar</button></div>`,
  aprobar: () => `<p class="demo-titulo">Solicitud de vacaciones</p>
<p class="demo-texto">Laura Méndez pide 5 días hábiles, del 18 al 22 de diciembre.</p>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-motivo">Motivo (obligatorio al rechazar)</label><textarea class="demo-entrada" id="demo-motivo" rows="2" aria-describedby="demo-motivo-e"></textarea><span class="demo-error" id="demo-motivo-e"></span></div>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="rechazar">Rechazar</button><button type="button" class="demo-btn primario" data-accion="aprobar">Aprobar</button></div>`,
  vacaciones: () => `<p class="demo-titulo">Solicitar vacaciones</p>
<div class="demo-fechas">
<div class="demo-campo"><label class="demo-etiqueta" for="demo-desde">Desde</label><input class="demo-entrada" id="demo-desde" type="date" aria-describedby="demo-desde-e" /><span class="demo-error" id="demo-desde-e"></span></div>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-hasta">Hasta</label><input class="demo-entrada" id="demo-hasta" type="date" aria-describedby="demo-hasta-e" /><span class="demo-error" id="demo-hasta-e"></span></div>
</div>
<p class="demo-texto" id="demo-dias" role="status">Elige las fechas: se cuentan solo días hábiles (máximo 12).</p>
${botones(['cancelar', 'Cancelar'], ['enviar', 'Enviar'])}`,
  asistente: () => {
    const p = datos.paso
    const cabeza = `<p class="demo-titulo">Alta de empleado</p><p class="demo-texto" id="demo-paso">Paso ${p} de 3</p><div class="demo-progreso" aria-hidden="true"><i style="width:${Math.round((p / 3) * 100)}%"></i></div>`
    if (p === 1)
      return `${cabeza}<div class="demo-campo"><label class="demo-etiqueta" for="demo-nombre">Nombre completo</label><input class="demo-entrada" id="demo-nombre" autocomplete="off" value="${datos.nombre}" aria-describedby="demo-nombre-e" /><span class="demo-error" id="demo-nombre-e"></span></div>${botones(['cancelar', 'Cancelar'], ['siguiente', 'Siguiente'])}`
    if (p === 2)
      return `${cabeza}<div class="demo-campo"><label class="demo-etiqueta" for="demo-puesto">Área</label><select class="demo-entrada" id="demo-puesto">${PUESTOS.map((x) => `<option${x === datos.puesto ? ' selected' : ''}>${x}</option>`).join('')}</select></div>${botones(['atras', 'Atrás'], ['siguiente', 'Siguiente'])}`
    return `${cabeza}<p class="demo-texto">Revisa antes de terminar:</p><dl class="demo-resumen"><div><dt>Nombre</dt><dd>${datos.nombre}</dd></div><div><dt>Área</dt><dd>${datos.puesto}</dd></div></dl>${botones(['atras', 'Atrás'], ['terminar', 'Dar de alta'])}`
  },
  importar: () => {
    const ok = FILAS.filter((f) => f[1]).length
    const vista = datos.cargado
      ? `<ul class="demo-filas" aria-label="Vista previa del archivo">${FILAS.map((f) => `<li class="${f[1] ? 'bien' : 'mal'}"><span>${f[0]}</span><b>${f[1] ? 'Lista' : 'RFC no válido'}</b></li>`).join('')}</ul><p class="demo-texto">${ok} filas listas y 1 con error (se omitirá).</p>`
      : `<button type="button" class="demo-btn demo-archivo" data-accion="cargar">Elegir empleados.csv</button><span class="demo-error" id="demo-archivo-e"></span>`
    return `<p class="demo-titulo">Importar empleados</p>${vista}${botones(['cancelar', 'Cancelar'], ['importar', datos.cargado ? `Importar ${ok}` : 'Importar'])}`
  },
  descartar: () => `<p class="demo-titulo">¿Salir sin guardar?</p>
<p class="demo-texto">Cambiaste el salario diario de $ 980.00 a $ 1,150.00. Si sales, se pierde.</p>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="descartar">Descartar</button><button type="button" class="demo-btn primario" data-accion="seguir">Seguir editando</button></div>`,
}

// «Ver código»: lo que se escribe de verdad en la librería para cada escena.
const CODIGO: Record<Escena, string> = {
  borrar: `import { confirmDelete } from 'nexus-dialogs/patterns'

if (await confirmDelete({ what: 'a Laura Méndez' })) {
  // eliminar
}`,
  formulario: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Nuevo gasto',
  fields: [
    { name: 'rfc', label: 'RFC del proveedor', type: 'rfc', required: true },
    { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
  ],
})
if (r.confirmed) guardar(r.values)`,
  aprobar: `import { approval } from 'nexus-dialogs/patterns'

const r = await approval({
  title: 'Vacaciones de Laura Méndez',
  details: [{ label: 'Días hábiles', value: '5' }],
  reasons: ['Cubre otro turno', 'Sin saldo'],
})`,
  vacaciones: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Solicitar vacaciones',
  fields: [
    { name: 'dias', label: 'Fechas', type: 'daterange',
      calendar: true, businessDays: true, maxDays: 12, required: true },
  ],
})`,
  asistente: `import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'Alta de empleado',
  review: true,
  steps: [
    { title: 'Datos', fields: [{ name: 'nombre', label: 'Nombre completo', required: true }] },
    { title: 'Área', fields: [{ name: 'area', label: 'Área', type: 'select', options: ['Ventas', 'Contabilidad'] }] },
  ],
})`,
  importar: `import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Importar empleados',
  columns: [
    { name: 'nombre', label: 'Nombre completo', required: true },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
  ],
  onImport: (filas) => api.importar(filas),
})`,
  descartar: `import { unsavedChanges } from 'nexus-dialogs/patterns'

const r = await unsavedChanges({
  changes: [{ label: 'Salario diario', from: '$ 980.00', to: '$ 1,150.00' }],
  onSave: () => guardar(),
})`,
}

class Cancelado extends Error {}
let ciclo = 0 // sube cada vez que alguien usa la maqueta: la animación se corta
let automatico = !sinMovimiento.matches
let escenaActual: Escena = 'borrar'
let avisoId = 0 // cuál es el aviso vigente: uno nuevo reemplaza al anterior
let pausas: Array<() => void> = []
let visible = true

const pausado = (): boolean => !visible || document.hidden
function reanudar(): void {
  if (pausado()) return
  const p = pausas
  pausas = []
  for (const f of p) f()
}

const activos = new Set<() => void>()
/** Espera `ms` (y mientras la maqueta no se vea, se queda quieta). Se corta al instante si alguien la toma (`detener`). */
function esperar(token: number, ms: number): Promise<void> {
  return new Promise<void>((res, rej) => {
    if (token !== ciclo) return rej(new Cancelado())
    const seguir = (): void => {
      activos.delete(cancelar)
      if (token === ciclo) res()
      else rej(new Cancelado())
    }
    const t = setTimeout(() => (pausado() ? pausas.push(seguir) : seguir()), ms)
    const cancelar = (): void => {
      clearTimeout(t)
      activos.delete(cancelar)
      pausas = pausas.filter((f) => f !== seguir)
      rej(new Cancelado())
    }
    activos.add(cancelar)
  })
}

const campo = (id: string): HTMLInputElement | HTMLTextAreaElement | null => dialogo?.querySelector(`#${id}`) ?? null
const pausa = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function marcarEscena(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('button[data-escena]'))
    b.setAttribute('aria-pressed', String(b.dataset.escena === escenaActual))
}

const panelCodigo = document.querySelector<HTMLElement>('.demo-codigo pre')
function mostrarCodigo(e: Escena): void {
  if (!panelCodigo) return
  panelCodigo.querySelector('button.copiar')?.remove()
  panelCodigo.removeAttribute('data-listo')
  const c = panelCodigo.querySelector('code')
  if (c) c.textContent = CODIGO[e]
  decorarCodigo(panelCodigo.parentElement!)
}

function pintar(): void {
  if (dialogo) dialogo.innerHTML = HTML_ESCENA[escenaActual]()
}

function abrirEscena(e: Escena): void {
  if (!dialogo) return
  if (e !== escenaActual) mostrarCodigo(e)
  escenaActual = e
  Object.assign(datos, { paso: 1, nombre: '', puesto: 'Ventas', cargado: false })
  pintar()
  dialogo.classList.remove('sale')
  dialogo.classList.add('entra')
  dialogo.removeAttribute('inert')
  marcarEscena()
}

function cerrarDialogo(): void {
  dialogo?.classList.replace('entra', 'sale')
  dialogo?.setAttribute('inert', '')
}

function error(id: string, mensaje: string): void {
  const input = campo(id)
  const aviso = dialogo?.querySelector<HTMLElement>(`#${id}-e`)
  if (aviso) aviso.textContent = mensaje
  input?.setAttribute('aria-invalid', String(mensaje !== ''))
}

/** Valida lo que haga falta para la acción. Devuelve si se puede seguir (y deja los avisos en los campos). */
function valida(accion: string): boolean {
  if (accion === 'guardar') {
    const rfc = campo('demo-rfc')?.value.trim() ?? ''
    const importe = campo('demo-importe')?.value.trim().replace(/[$,\s]/g, '') ?? ''
    const rfcOk = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(rfc)
    const importeOk = importe !== '' && Number(importe) > 0
    error('demo-rfc', rfcOk ? '' : rfc ? 'El RFC no es válido (13 caracteres, como XAXX010101000).' : 'El RFC es obligatorio.')
    error('demo-importe', importeOk ? '' : importe ? 'Escribe un importe mayor a cero.' : 'El importe es obligatorio.')
    ;(!rfcOk ? campo('demo-rfc') : !importeOk ? campo('demo-importe') : null)?.focus({ preventScroll: true })
    return rfcOk && importeOk
  }
  if (accion === 'rechazar') {
    const ok = (campo('demo-motivo')?.value.trim() ?? '') !== ''
    error('demo-motivo', ok ? '' : 'Cuéntale el motivo para poder rechazar.')
    if (!ok) campo('demo-motivo')?.focus({ preventScroll: true })
    return ok
  }
  if (accion === 'enviar') {
    const d = campo('demo-desde')?.value ?? ''
    const h = campo('demo-hasta')?.value ?? ''
    const dOk = d !== ''
    const hOk = h !== '' && (!dOk || h >= d)
    const largo = dOk && hOk && diasHabiles(d, h) > 12
    error('demo-desde', dOk ? '' : 'Elige el primer día.')
    error('demo-hasta', !h ? 'Elige el último día.' : !hOk ? 'No puede ser antes del primer día.' : largo ? 'Máximo 12 días hábiles.' : '')
    ;(!dOk ? campo('demo-desde') : !hOk || largo ? campo('demo-hasta') : null)?.focus({ preventScroll: true })
    return dOk && hOk && !largo
  }
  if (accion === 'siguiente' && datos.paso === 1) {
    const ok = (campo('demo-nombre')?.value.trim() ?? '') !== ''
    error('demo-nombre', ok ? '' : 'El nombre es obligatorio.')
    if (!ok) campo('demo-nombre')?.focus({ preventScroll: true })
    return ok
  }
  if (accion === 'importar' && !datos.cargado) {
    const aviso = dialogo?.querySelector<HTMLElement>('#demo-archivo-e')
    if (aviso) aviso.textContent = 'Primero elige un archivo.'
    dialogo?.querySelector<HTMLElement>('[data-accion="cargar"]')?.focus({ preventScroll: true })
    return false
  }
  return true
}

const MENSAJES: Record<string, string> = {
  eliminar: 'Laura Méndez eliminada',
  cancelar: 'Cancelado, no se guardó nada',
  guardar: 'Enviado a aprobación',
  aprobar: 'Solicitud aprobada',
  rechazar: 'Solicitud rechazada',
  enviar: 'Solicitud de vacaciones enviada',
  terminar: 'Empleado dado de alta',
  importar: 'Se importaron 3 empleados',
  descartar: 'Cambios descartados',
  seguir: 'Sigues editando',
}

/** Días hábiles (lunes a viernes) entre dos fechas ISO, ambas incluidas. */
function diasHabiles(desde: string, hasta: string): number {
  const a = new Date(`${desde}T12:00:00`)
  const b = new Date(`${hasta}T12:00:00`)
  let n = 0
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) if (d.getDay() % 6 !== 0) n++
  return n
}

function actualizaDias(): void {
  const t = dialogo?.querySelector('#demo-dias')
  const d = campo('demo-desde')?.value
  const h = campo('demo-hasta')?.value
  if (!t || !d || !h || h < d) return
  const n = diasHabiles(d, h)
  t.textContent = `${n} ${n === 1 ? 'día hábil' : 'días hábiles'}${n > 12 ? ' (máximo 12)' : ''}`
}

/** Cierra el diálogo y avisa con el toast (con «Deshacer» si se eliminó). */
async function resolver(accion: string, token = ciclo): Promise<void> {
  if (!avisoToast || !textoToast || !deshacer) return
  const mio = ++avisoId
  cerrarDialogo()
  textoToast.textContent = MENSAJES[accion]
  deshacer.hidden = accion !== 'eliminar'
  avisoToast.removeAttribute('inert')
  avisoToast.classList.add('visible')
  let deshecho = false
  const alDeshacer = (): void => {
    deshecho = true
    textoToast.textContent = 'Cambio deshecho'
    deshacer.hidden = true
  }
  deshacer.addEventListener('click', alDeshacer, { once: true })
  try {
    if (automatico && token === ciclo) await esperar(token, 2400)
    else {
      // A mano: se queda el aviso unos segundos (menos si se deshizo) para que se alcance a leer y a usar «Deshacer».
      for (let t = 0; t < 26 && !deshecho && mio === avisoId; t++) await pausa(100)
      if (deshecho && mio === avisoId) await pausa(900)
    }
  } finally {
    deshacer.removeEventListener('click', alDeshacer)
    if (mio === avisoId) {
      avisoToast.classList.remove('visible')
      avisoToast.setAttribute('inert', '')
    }
  }
}

/** Pasos que no cierran el diálogo: se vuelve a pintar con el estado nuevo. */
const INTERNAS = ['siguiente', 'atras', 'cargar']

function interna(accion: string): void {
  if (datos.paso === 1) datos.nombre = campo('demo-nombre')?.value.trim() ?? datos.nombre
  if (datos.paso === 2) datos.puesto = campo('demo-puesto')?.value ?? datos.puesto
  if (accion === 'siguiente') datos.paso = Math.min(3, datos.paso + 1)
  if (accion === 'atras') datos.paso = Math.max(1, datos.paso - 1)
  if (accion === 'cargar') datos.cargado = true
  pintar()
  if (!automatico) dialogo?.querySelector<HTMLElement>('input, select, [data-accion="importar"]')?.focus({ preventScroll: true })
}

/** Valida y hace la acción: sigue en el mismo diálogo (pasos), o lo cierra con su aviso. Devuelve si se hizo algo. */
async function accionar(accion: string, token = ciclo): Promise<boolean> {
  if (!valida(accion)) return false
  if (INTERNAS.includes(accion)) {
    interna(accion)
    return true
  }
  await resolver(accion, token)
  return true
}

// ── Uso manual ───────────────────────────────────────────────────────────────
function detener(): void {
  if (!automatico) return
  automatico = false
  ciclo++
  cursor?.classList.remove('visible')
  for (const c of [...activos]) c()
}

// Quien usa la maqueta la tiene toda para él; si se va (sin tocarla unos segundos), la invitación sigue donde iba. Un toque que solo
// empieza a desplazar la página en el teléfono no cuenta como usarla: solo el toque completo (clic), el ratón, el teclado y la escritura.
let retoma = 0
function armarRetoma(): void {
  clearTimeout(retoma)
  if (sinMovimiento.matches || !pantalla) return
  retoma = window.setTimeout(() => {
    const campoActivo = pantalla.contains(document.activeElement) && document.activeElement?.matches('input, textarea, select')
    if (automatico) return
    if (pausado() || campoActivo) return armarRetoma() // aún la está usando o no se ve: se vuelve a esperar
    automatico = true
    cursor?.classList.remove('visible')
    void reproducir(++ciclo, (ESCENAS.indexOf(escenaActual) + 1) % ESCENAS.length)
  }, Number(pantalla.dataset.retoma) || 12000)
}
const tocada = (): void => {
  detener()
  armarRetoma()
}
pantalla?.addEventListener('pointerdown', (e) => e.pointerType !== 'touch' && tocada())
pantalla?.addEventListener('click', tocada)
pantalla?.addEventListener('keydown', tocada)
pantalla?.addEventListener('input', () => !automatico && armarRetoma())
document.querySelectorAll('button[data-escena]').forEach((b) =>
  b.addEventListener('click', () => elegir((b as HTMLElement).dataset.escena as Escena)),
)

dialogo?.addEventListener('click', async (e) => {
  const boton = (e.target as Element).closest<HTMLButtonElement>('button[data-accion]')
  if (!boton) return
  const accion = boton.dataset.accion!
  await accionar(accion)
  if (!automatico && !dialogo.classList.contains('entra')) abrirEscena(escenaActual)
})
dialogo?.addEventListener('input', (e) => {
  const t = e.target as HTMLElement
  if (t.id === 'demo-desde' || t.id === 'demo-hasta') actualizaDias()
  if (t.getAttribute('aria-invalid') === 'true') error(t.id, '')
})

/** Elegir una escena la abre y, si hay movimiento, la reproduce una vez (el cursor escribe y pulsa); al terminar queda lista para usarse. */
function elegir(e: Escena): void {
  for (const c of [...activos]) c() // corta lo que estuviera reproduciéndose
  automatico = false
  ciclo++
  avisoId++ // un aviso pendiente ya no aplica
  avisoToast?.classList.remove('visible')
  avisoToast?.setAttribute('inert', '')
  cursor?.classList.remove('visible')
  abrirEscena(e)
  clearTimeout(retoma)
  if (sinMovimiento.matches) return
  automatico = true
  void (async (token: number) => {
    try {
      await esperar(token, 700)
      await interpretar(e, token)
      // Terminó la que se pidió: queda lista para usarse y, si nadie la toca, la invitación sigue con la siguiente.
      automatico = false
      abrirEscena(e)
      armarRetoma()
    } catch (err) {
      if (!(err instanceof Cancelado)) throw err
      // Alguien la tomó a media reproducción: si el diálogo quedó cerrado, se vuelve a abrir.
      if (dialogo && !dialogo.classList.contains('entra')) abrirEscena(escenaActual)
    }
  })(ciclo)
}

// ── La invitación: un cursor que recorre las escenas ─────────────────────────
function moverCursor(objetivo: Element): void {
  if (!pantalla || !cursor) return
  const p = pantalla.getBoundingClientRect()
  const o = objetivo.getBoundingClientRect()
  cursor.style.transform = `translate(${o.left - p.left + o.width * 0.6}px, ${o.top - p.top + o.height * 0.6}px)`
}

async function escribir(token: number, nodo: HTMLInputElement | HTMLTextAreaElement | null, texto: string): Promise<void> {
  if (!nodo) return
  for (let i = 1; i <= texto.length; i++) {
    nodo.value = texto.slice(0, i)
    await esperar(token, 55)
  }
}

/** Pone un valor (como si se eligiera en el selector de fecha) y avisa para que se actualicen los días. */
async function poner(token: number, id: string, valor: string): Promise<void> {
  const nodo = campo(id)
  if (!nodo) return
  nodo.value = valor
  nodo.dispatchEvent(new Event('input', { bubbles: true }))
  await esperar(token, 200)
}

async function pulsar(token: number, accion: string): Promise<void> {
  const objetivo = dialogo?.querySelector(`[data-accion="${accion}"]`)
  if (!objetivo) return
  moverCursor(objetivo)
  await esperar(token, 800)
  objetivo.classList.add('pulsa')
  await esperar(token, 220)
  objetivo.classList.remove('pulsa')
  await accionar(accion, token)
}

const GUION: Record<Escena, (t: number) => Promise<void>> = {
  borrar: (t) => pulsar(t, 'eliminar'),
  formulario: async (t) => {
    await escribir(t, campo('demo-rfc'), 'XAXX010101000')
    await esperar(t, 250)
    await escribir(t, campo('demo-importe'), '1,250.00')
    await esperar(t, 400)
    await pulsar(t, 'guardar')
  },
  aprobar: async (t) => {
    await escribir(t, campo('demo-motivo'), 'Cubre su equipo')
    await esperar(t, 400)
    await pulsar(t, 'aprobar')
  },
  vacaciones: async (t) => {
    await esperar(t, 300)
    await poner(t, 'demo-desde', '2026-12-21')
    await esperar(t, 500)
    await poner(t, 'demo-hasta', '2026-12-30')
    await esperar(t, 700)
    await pulsar(t, 'enviar')
  },
  asistente: async (t) => {
    await escribir(t, campo('demo-nombre'), 'Mario Ruiz')
    await esperar(t, 400)
    await pulsar(t, 'siguiente')
    await esperar(t, 700)
    await pulsar(t, 'siguiente')
    await esperar(t, 900)
    await pulsar(t, 'terminar')
  },
  importar: async (t) => {
    await esperar(t, 300)
    await pulsar(t, 'cargar')
    await esperar(t, 1100)
    await pulsar(t, 'importar')
  },
  descartar: (t) => pulsar(t, 'descartar'),
}

/** Una escena completa: el cursor aparece, hace el guion y se va. */
async function interpretar(e: Escena, token: number): Promise<void> {
  cursor?.classList.add('visible')
  await esperar(token, 500)
  await GUION[e](token)
  cursor?.classList.remove('visible')
}

async function reproducir(token: number, desde = 0): Promise<void> {
  try {
    for (let i = desde; token === ciclo; i = (i + 1) % ESCENAS.length) {
      abrirEscena(ESCENAS[i])
      await esperar(token, 500)
      await interpretar(ESCENAS[i], token)
      await esperar(token, 400)
    }
  } catch (e) {
    if (!(e instanceof Cancelado)) throw e
    // Alguien la tomó a media animación: si el diálogo quedó cerrado, se vuelve a abrir para que pueda usarlo.
    if (dialogo && !dialogo.classList.contains('entra')) abrirEscena(escenaActual)
  }
}

if (pantalla) {
  new IntersectionObserver((es) => {
    visible = es[0]?.isIntersecting ?? true
    reanudar()
  }).observe(pantalla)
  document.addEventListener('visibilitychange', reanudar)
  marcarEscena()
  if (automatico) void reproducir(ciclo)
}
