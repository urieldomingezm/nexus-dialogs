// «Míralo en acción»: una pantalla de muestra (decorativa) que repite un borrado y un formulario con los colores de cada tema,
// y el selector de apariencia, que también cambia los diálogos y toasts reales de la página.
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { confirmDelete } from 'nexus-dialogs/patterns'
import { themes, type Theme } from 'nexus-dialogs/themes'
import { chispas } from './animaciones'

const $ = <T extends HTMLElement>(q: string) => document.querySelector<T>(q)
const pantalla = $('.demo-pantalla')
const controles = document.querySelector('.demo-controles')

type Apariencia = 'nexus' | 'material' | 'bootstrap' | 'tailwind' | 'oscuro'
const NOMBRES: Record<Apariencia, string> = { nexus: 'Nexus', material: 'Material', bootstrap: 'Bootstrap', tailwind: 'Tailwind', oscuro: 'Oscuro' }
// Cada apariencia con su paleta clara y oscura (Bootstrap y Material no traen oscura: en oscuro vale la de Nexus), como en la mesa de pruebas.
const PARES: Record<Apariencia, { claro: Theme; oscuro: Theme }> = {
  nexus: { claro: {}, oscuro: {} },
  material: { claro: themes.material, oscuro: {} },
  bootstrap: { claro: themes.bootstrap, oscuro: {} },
  tailwind: { claro: themes.tailwind, oscuro: themes.tailwindDark },
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

// ── La pantalla de muestra ───────────────────────────────────────────────────
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)')
const dialogo = pantalla?.querySelector<HTMLElement>('.demo-dialogo') ?? null
const avisoToast = pantalla?.querySelector<HTMLElement>('.demo-toast') ?? null
const cursor = pantalla?.querySelector<HTMLElement>('.demo-cursor') ?? null

const ESCENA_BORRAR = `<p class="demo-titulo">¿Eliminar a Laura Méndez?</p>
<p class="demo-texto">Se eliminará su registro. Esta acción no se puede deshacer.</p>
<div class="demo-botones"><span class="demo-btn cancelar">Cancelar</span><span class="demo-btn peligro" data-objetivo>Eliminar</span></div>`
const ESCENA_FORM = `<p class="demo-titulo">Nuevo gasto</p>
<div class="demo-campo"><span class="demo-etiqueta">RFC del proveedor</span><span class="demo-entrada"><span data-escribe="0"></span></span></div>
<div class="demo-campo"><span class="demo-etiqueta">Importe</span><span class="demo-entrada"><span data-escribe="1"></span></span></div>
<div class="demo-botones"><span class="demo-btn cancelar">Cancelar</span><span class="demo-btn primario" data-objetivo>Guardar</span></div>`

class Cancelado extends Error {}
let ciclo = 0
let pausas: Array<() => void> = []
let visible = true

const pausado = (): boolean => !visible || document.hidden
function reanudar(): void {
  if (pausado()) return
  const p = pausas
  pausas = []
  for (const f of p) f()
}

async function esperar(token: number, ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
  while (pausado()) await new Promise<void>((r) => pausas.push(r))
  if (token !== ciclo) throw new Cancelado()
}

function moverCursor(objetivo: Element): void {
  if (!pantalla || !cursor) return
  const p = pantalla.getBoundingClientRect()
  const o = objetivo.getBoundingClientRect()
  cursor.style.transform = `translate(${o.left - p.left + o.width * 0.6}px, ${o.top - p.top + o.height * 0.6}px)`
}

async function escribir(token: number, nodo: Element, texto: string): Promise<void> {
  for (let i = 1; i <= texto.length; i++) {
    nodo.textContent = texto.slice(0, i)
    await esperar(token, 55)
  }
}

async function pulsar(token: number, objetivo: Element): Promise<void> {
  moverCursor(objetivo)
  await esperar(token, 800)
  objetivo.classList.add('pulsa')
  await esperar(token, 220)
  objetivo.classList.remove('pulsa')
}

async function mostrarToast(token: number, texto: string): Promise<void> {
  if (!avisoToast) return
  avisoToast.firstElementChild!.textContent = texto
  avisoToast.classList.add('visible')
  await esperar(token, 2400)
  avisoToast.classList.remove('visible')
  await esperar(token, 500)
}

async function escena(token: number, html: string, accion: (objetivo: Element) => Promise<void>, mensaje: string): Promise<void> {
  if (!dialogo || !cursor) return
  dialogo.innerHTML = html // plantillas propias de este archivo, sin datos de nadie
  dialogo.classList.remove('sale')
  dialogo.classList.add('entra')
  cursor.classList.add('visible')
  const objetivo = dialogo.querySelector('[data-objetivo]')!
  await esperar(token, 1000)
  await accion(objetivo)
  dialogo.classList.replace('entra', 'sale')
  cursor.classList.remove('visible')
  await mostrarToast(token, mensaje)
}

async function reproducir(token: number): Promise<void> {
  try {
    while (token === ciclo) {
      await escena(token, ESCENA_BORRAR, (o) => pulsar(token, o), 'Laura Méndez eliminada')
      await escena(
        token,
        ESCENA_FORM,
        async (o) => {
          const campos = dialogo!.querySelectorAll('[data-escribe]')
          await escribir(token, campos[0], 'XAXX010101000')
          await esperar(token, 250)
          await escribir(token, campos[1], '$ 1,250.00')
          await esperar(token, 400)
          await pulsar(token, o)
        },
        'Enviado a aprobación',
      )
    }
  } catch (e) {
    if (!(e instanceof Cancelado)) throw e
  }
}

function arrancar(): void {
  ciclo++
  if (!pantalla || !dialogo) return
  if (sinMovimiento.matches) {
    // Sin movimiento: una sola imagen fija del borrado.
    dialogo.innerHTML = ESCENA_BORRAR
    dialogo.classList.add('entra')
    cursor?.classList.remove('visible')
    avisoToast?.classList.remove('visible')
    return
  }
  void reproducir(ciclo)
}

if (pantalla) {
  new IntersectionObserver((es) => {
    visible = es[0]?.isIntersecting ?? true
    reanudar()
  }).observe(pantalla)
  document.addEventListener('visibilitychange', reanudar)
  sinMovimiento.addEventListener('change', arrancar)
  arrancar()
}
