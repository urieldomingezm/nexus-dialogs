// Mesa de pruebas: elegir tema y modo (con followPageScheme), abrir diálogos de verdad y armar un resumen para reportar.
import './comun'
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { themes, followPageScheme, type Theme } from 'nexus-dialogs/themes'
import * as ej from './ejemplos-def'

type TemaPrueba = 'nexus' | 'tailwind' | 'bootstrap' | 'material'
type Modo = 'claro' | 'oscuro' | 'sistema'

const REPO = 'https://github.com/urieldomingezm/nexus-dialogs'
const NOMBRES: Record<TemaPrueba, string> = { nexus: 'Nexus', tailwind: 'Tailwind', bootstrap: 'Bootstrap', material: 'Material' }
// Cada tema con su paleta clara y oscura. Bootstrap y Material no traen oscura: en oscuro vale la de Nexus (esquema `dark`).
const PARES: Record<TemaPrueba, { light: Theme; dark: Theme }> = {
  nexus: { light: {}, dark: {} },
  tailwind: { light: themes.tailwind, dark: themes.tailwindDark },
  bootstrap: { light: themes.bootstrap, dark: {} },
  material: { light: themes.material, dark: {} },
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const raiz = document.documentElement
const version = $('pruebas').dataset.version ?? ''

// ── Apariencia ──────────────────────────────────────────────────────────────
let tema: TemaPrueba = 'nexus'
let modo: Modo = raiz.dataset.tema === 'oscuro' ? 'oscuro' : raiz.dataset.tema === 'claro' ? 'claro' : 'sistema'
let vigente = 'claro'
let parar: (() => void) | undefined

function pintarBotones(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tema-prueba]')) b.setAttribute('aria-pressed', String(b.dataset.temaPrueba === tema))
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-modo-prueba]')) b.setAttribute('aria-pressed', String(b.dataset.modoPrueba === modo))
  $('estado-apariencia').textContent = `Los diálogos que abras ahora salen en modo ${vigente}, con el tema ${NOMBRES[tema]}.`
  armarResumen()
}

function activar(): void {
  parar?.()
  // Lo que Tailwind mira: la clase `dark` en <html>. Con «como el sistema» no hay clase y se sigue prefers-color-scheme.
  raiz.classList.toggle('dark', modo === 'oscuro')
  // Que el propio sitio también cambie de aspecto, para que la mesa se vea como la página que simula.
  if (modo === 'sistema') delete raiz.dataset.tema
  else raiz.dataset.tema = modo
  parar = followPageScheme(
    ({ scheme, theme }) => {
      vigente = scheme === 'dark' ? 'oscuro' : 'claro'
      configure({ scheme, theme })
      toast.configure({ scheme, theme })
      pintarBotones()
    },
    { strategy: modo === 'sistema' ? 'media' : 'class', ...PARES[tema] },
  )
}

for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tema-prueba]')) {
  b.addEventListener('click', () => {
    tema = b.dataset.temaPrueba as TemaPrueba
    activar()
  })
}
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-modo-prueba]')) {
  b.addEventListener('click', () => {
    modo = b.dataset.modoPrueba as Modo
    activar()
  })
}
// El botón «Tema» del encabezado también cambia el modo: se refleja aquí para que no se descuadre.
new MutationObserver(() => {
  const actual: Modo = raiz.dataset.tema === 'oscuro' ? 'oscuro' : raiz.dataset.tema === 'claro' ? 'claro' : 'sistema'
  if (actual !== modo) {
    modo = actual
    activar()
  }
}).observe(raiz, { attributes: true, attributeFilter: ['data-tema'] })

// ── Diálogos de prueba ──────────────────────────────────────────────────────
const CASOS: [string, () => unknown][] = [
  ['Confirmar un borrado', ej.borrar],
  ['Aviso de error', ej.error],
  ['Formulario con validación', ej.gasto],
  ['Asistente de varios pasos', ej.asistente],
  ['Pestañas', ej.pestanas],
  ['Pestañas compactas', ej.pestanasCompactas],
  ['Seguimiento por etapas', ej.seguimiento],
  ['Seguimiento horizontal', ej.seguimientoHorizontal],
  ['Panel lateral', ej.panel],
  ['Pantalla de espera', ej.espera],
  ['Aviso con acción', ej.toastAccion],
  ['Elegir entre opciones', ej.elegir],
]
const contenedor = $('botones')
for (const [texto, correr] of CASOS) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'btn'
  b.textContent = texto
  b.addEventListener('click', () => void correr())
  contenedor.append(b)
}

// ── Lista de revisión (se guarda en este navegador) ─────────────────────────
const REVISION: [string, string][] = [
  ['teclado', 'Con el teclado: Tab recorre los botones y campos en orden, Esc cierra y el foco vuelve al botón que abrió el diálogo.'],
  ['modos', 'Al cambiar entre claro y oscuro, todo el diálogo cambia de color y nada queda ilegible.'],
  ['tema', 'Con el tema elegido (Tailwind, Bootstrap o Material), los colores y las esquinas se parecen a tu página.'],
  ['celular', 'En un teléfono (o con la ventana angosta) el diálogo cabe sin desplazarse hacia los lados.'],
  ['zoom', 'Con el zoom al 200 %, el formulario sigue pudiéndose usar.'],
  ['errores', 'En el formulario, enviar vacío muestra los errores junto a cada campo y el foco va al primero.'],
  ['lector', 'Con un lector de pantalla (NVDA, VoiceOver, TalkBack) se anuncia el título y los errores.'],
  ['claridad', 'Los textos y botones se entienden sin explicación.'],
]
type Guardado = { marcas: Record<string, boolean>; notas: string }
const LLAVE = 'nd-pruebas'
const leer = (): Guardado => {
  try {
    return { marcas: {}, notas: '', ...JSON.parse(localStorage.getItem(LLAVE) ?? '{}') }
  } catch {
    return { marcas: {}, notas: '' }
  }
}
const datos = leer()
const guardar = (): void => {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(datos))
  } catch {
    /* sin almacenamiento: la lista vale solo para esta visita */
  }
}

const lista = $('lista-revision')
for (const [id, texto] of REVISION) {
  const li = document.createElement('li')
  const etiqueta = document.createElement('label')
  const caja = document.createElement('input')
  caja.type = 'checkbox'
  caja.id = `rev-${id}`
  caja.checked = !!datos.marcas[id]
  caja.addEventListener('change', () => {
    datos.marcas[id] = caja.checked
    guardar()
    armarResumen()
  })
  etiqueta.append(caja, ` ${texto}`)
  li.append(etiqueta)
  lista.append(li)
}
const notas = $<HTMLTextAreaElement>('notas')
notas.value = datos.notas
notas.addEventListener('input', () => {
  datos.notas = notas.value
  guardar()
  armarResumen()
})

// ── Resumen y reportes ──────────────────────────────────────────────────────
const resumen = $<HTMLTextAreaElement>('resumen')
function armarResumen(): void {
  const navegador = navigator.userAgent
  const lineas = [
    `nexus-dialogs ${version}`,
    `Navegador: ${navegador}`,
    `Ventana: ${innerWidth}×${innerHeight} (zoom del dispositivo ${devicePixelRatio})`,
    `Apariencia: tema ${NOMBRES[tema]}, modo ${vigente}`,
    '',
    'Revisión:',
    ...REVISION.map(([id, texto]) => `[${datos.marcas[id] ? 'x' : ' '}] ${texto}`),
    '',
    `Notas: ${datos.notas.trim() || '(ninguna)'}`,
  ]
  resumen.value = lineas.join('\n')
  const corto = navegador.length > 120 ? `${navegador.slice(0, 117)}…` : navegador
  const url = (plantilla: string) => `${REPO}/issues/new?template=${plantilla}&version=${encodeURIComponent(version)}&navegador=${encodeURIComponent(corto)}`
  $<HTMLAnchorElement>('reportar-error').href = url('error.yml')
  $<HTMLAnchorElement>('reportar-ok').href = url('adopcion.yml')
}

$('copiar').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resumen.value)
    toast.success('Resumen copiado')
  } catch {
    resumen.select()
    toast('Selecciona y copia el resumen con Ctrl+C')
  }
})
addEventListener('resize', armarResumen)

activar()
