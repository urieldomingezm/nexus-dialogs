// «Míralo en acción»: una pantalla de muestra (decorativa) que repite un borrado y un formulario con los colores de cada tema,
// y el selector de apariencia, que también cambia los diálogos y toasts reales de la página.
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { confirmDelete } from 'nexus-dialogs/patterns'
import { themes, type Theme } from 'nexus-dialogs/themes'
import { chispas } from './animaciones'

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

type Escena = 'borrar' | 'formulario' | 'aprobar'
const ESCENAS: Escena[] = ['borrar', 'formulario', 'aprobar']

// Plantillas propias de este archivo, sin datos de nadie.
const HTML_ESCENA: Record<Escena, string> = {
  borrar: `<p class="demo-titulo">¿Eliminar a Laura Méndez?</p>
<p class="demo-texto">Se eliminará su registro. Esta acción no se puede deshacer.</p>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="cancelar">Cancelar</button><button type="button" class="demo-btn peligro" data-accion="eliminar">Eliminar</button></div>`,
  formulario: `<p class="demo-titulo">Nuevo gasto</p>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-rfc">RFC del proveedor</label><input class="demo-entrada" id="demo-rfc" autocomplete="off" spellcheck="false" aria-describedby="demo-rfc-e" /><span class="demo-error" id="demo-rfc-e"></span></div>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-importe">Importe</label><input class="demo-entrada" id="demo-importe" inputmode="decimal" autocomplete="off" aria-describedby="demo-importe-e" /><span class="demo-error" id="demo-importe-e"></span></div>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="cancelar">Cancelar</button><button type="button" class="demo-btn primario" data-accion="guardar">Guardar</button></div>`,
  aprobar: `<p class="demo-titulo">Solicitud de vacaciones</p>
<p class="demo-texto">Laura Méndez pide 5 días hábiles, del 18 al 22 de diciembre.</p>
<div class="demo-campo"><label class="demo-etiqueta" for="demo-motivo">Motivo (obligatorio al rechazar)</label><textarea class="demo-entrada" id="demo-motivo" rows="2" aria-describedby="demo-motivo-e"></textarea><span class="demo-error" id="demo-motivo-e"></span></div>
<div class="demo-botones"><button type="button" class="demo-btn cancelar" data-accion="rechazar">Rechazar</button><button type="button" class="demo-btn primario" data-accion="aprobar">Aprobar</button></div>`,
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

function abrirEscena(e: Escena): void {
  if (!dialogo) return
  escenaActual = e
  dialogo.innerHTML = HTML_ESCENA[e]
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
  return true
}

const MENSAJES: Record<string, string> = {
  eliminar: 'Laura Méndez eliminada',
  cancelar: 'Cancelado, no se guardó nada',
  guardar: 'Enviado a aprobación',
  aprobar: 'Solicitud aprobada',
  rechazar: 'Solicitud rechazada',
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

// ── Uso manual ───────────────────────────────────────────────────────────────
function detener(): void {
  if (!automatico) return
  automatico = false
  ciclo++
  cursor?.classList.remove('visible')
  for (const c of [...activos]) c()
}

pantalla?.addEventListener('pointerdown', detener)
pantalla?.addEventListener('keydown', detener)
document.querySelectorAll('button[data-escena]').forEach((b) =>
  b.addEventListener('click', () => elegir((b as HTMLElement).dataset.escena as Escena)),
)

dialogo?.addEventListener('click', async (e) => {
  const boton = (e.target as Element).closest<HTMLButtonElement>('button[data-accion]')
  if (!boton) return
  const accion = boton.dataset.accion!
  if (!valida(accion)) return
  await resolver(accion)
  if (!automatico && !dialogo.classList.contains('entra')) abrirEscena(escenaActual)
})
dialogo?.addEventListener('input', (e) => {
  const t = e.target as HTMLElement
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
  if (sinMovimiento.matches) return
  automatico = true
  void (async (token: number) => {
    try {
      await esperar(token, 700)
      await interpretar(e, token)
      automatico = false
      abrirEscena(e)
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

async function pulsar(token: number, accion: string): Promise<void> {
  const objetivo = dialogo?.querySelector(`[data-accion="${accion}"]`)
  if (!objetivo) return
  moverCursor(objetivo)
  await esperar(token, 800)
  objetivo.classList.add('pulsa')
  await esperar(token, 220)
  objetivo.classList.remove('pulsa')
  await resolver(accion, token)
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
}

/** Una escena completa: el cursor aparece, hace el guion y se va. */
async function interpretar(e: Escena, token: number): Promise<void> {
  cursor?.classList.add('visible')
  await esperar(token, 500)
  await GUION[e](token)
  cursor?.classList.remove('visible')
}

async function reproducir(token: number): Promise<void> {
  try {
    for (let i = 0; token === ciclo; i = (i + 1) % ESCENAS.length) {
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
