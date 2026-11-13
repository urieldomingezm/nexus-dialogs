// Mesa de pruebas: elegir tema y modo (con followPageScheme), abrir diálogos de verdad y armar un resumen para reportar.
import './comun'
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { themes, followPageScheme, type Theme } from 'nexus-dialogs/themes'
import { idioma } from './textos'
import { funciones as ej } from './ejemplos-idioma'

// Textos de la mesa en el idioma de la página (español e inglés; el resto, en español como el contenido de la página).
const TXT = {
  es: {
    estado: (modo: string, tema: string) => `Los diálogos que abras ahora salen en modo ${modo}, con el tema ${tema}.`,
    claro: 'claro',
    oscuro: 'oscuro',
    casos: ['Confirmar un borrado', 'Aviso de error', 'Formulario con validación', 'Asistente de varios pasos', 'Pestañas', 'Pestañas compactas', 'Seguimiento por etapas', 'Seguimiento horizontal', 'Panel lateral', 'Pantalla de espera', 'Aviso con acción', 'Elegir entre opciones'],
    revision: [
      'Con el teclado: Tab recorre los botones y campos en orden, Esc cierra y el foco vuelve al botón que abrió el diálogo.',
      'Al cambiar entre claro y oscuro, todo el diálogo cambia de color y nada queda ilegible.',
      'Con el tema elegido (Tailwind, Bootstrap o Material), los colores y las esquinas se parecen a tu página.',
      'En un teléfono (o con la ventana angosta) el diálogo cabe sin desplazarse hacia los lados.',
      'Con el zoom al 200 %, el formulario sigue pudiéndose usar.',
      'En el formulario, enviar vacío muestra los errores junto a cada campo y el foco va al primero.',
      'Con un lector de pantalla (NVDA, VoiceOver, TalkBack) se anuncia el título y los errores.',
      'Los textos y botones se entienden sin explicación.',
    ],
    navegador: 'Navegador',
    ventana: (w: number, h: number, z: number) => `Ventana: ${w}×${h} (zoom del dispositivo ${z})`,
    apariencia: (t: string, m: string) => `Apariencia: tema ${t}, modo ${m}`,
    revisionTitulo: 'Revisión:',
    notas: 'Notas',
    ninguna: '(ninguna)',
    copiado: 'Resumen copiado',
    seleccion: 'Selecciona y copia el resumen con Ctrl+C',
  },
  en: {
    estado: (modo: string, tema: string) => `Dialogs you open now come out in ${modo} mode, with the ${tema} theme.`,
    claro: 'light',
    oscuro: 'dark',
    casos: ['Confirm a delete', 'Error notice', 'Form with validation', 'Multi-step wizard', 'Tabs', 'Compact tabs', 'Step-by-step tracking', 'Horizontal tracking', 'Side panel', 'Wait screen', 'Notice with an action', 'Choose between options'],
    revision: [
      'With the keyboard: Tab goes through the buttons and fields in order, Esc closes and focus returns to the button that opened the dialog.',
      'When switching between light and dark, the whole dialog changes color and nothing becomes unreadable.',
      'With the chosen theme (Tailwind, Bootstrap or Material), the colors and corners look like your page.',
      'On a phone (or with a narrow window) the dialog fits without scrolling sideways.',
      'With zoom at 200 %, the form is still usable.',
      'In the form, submitting empty shows the errors next to each field and focus goes to the first one.',
      'With a screen reader (NVDA, VoiceOver, TalkBack) the title and the errors are announced.',
      'The texts and buttons are understood without explanation.',
    ],
    navegador: 'Browser',
    ventana: (w: number, h: number, z: number) => `Window: ${w}×${h} (device zoom ${z})`,
    apariencia: (t: string, m: string) => `Appearance: ${t} theme, ${m} mode`,
    revisionTitulo: 'Review:',
    notas: 'Notes',
    ninguna: '(none)',
    copiado: 'Summary copied',
    seleccion: 'Select and copy the summary with Ctrl+C',
  },
}
const T = idioma === 'en' ? TXT.en : TXT.es

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
  $('estado-apariencia').textContent = T.estado(vigente === 'oscuro' ? T.oscuro : T.claro, NOMBRES[tema])
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
  [T.casos[0], ej.borrar],
  [T.casos[1], ej.error],
  [T.casos[2], ej.gasto],
  [T.casos[3], ej.asistente],
  [T.casos[4], ej.pestanas],
  [T.casos[5], ej.pestanasCompactas],
  [T.casos[6], ej.seguimiento],
  [T.casos[7], ej.seguimientoHorizontal],
  [T.casos[8], ej.panel],
  [T.casos[9], ej.espera],
  [T.casos[10], ej.toastAccion],
  [T.casos[11], ej.elegir],
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
  ['teclado', T.revision[0]],
  ['modos', T.revision[1]],
  ['tema', T.revision[2]],
  ['celular', T.revision[3]],
  ['zoom', T.revision[4]],
  ['errores', T.revision[5]],
  ['lector', T.revision[6]],
  ['claridad', T.revision[7]],
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
    `${T.navegador}: ${navegador}`,
    T.ventana(innerWidth, innerHeight, devicePixelRatio),
    T.apariencia(NOMBRES[tema], vigente === 'oscuro' ? T.oscuro : T.claro),
    '',
    T.revisionTitulo,
    ...REVISION.map(([id, texto]) => `[${datos.marcas[id] ? 'x' : ' '}] ${texto}`),
    '',
    `${T.notas}: ${datos.notas.trim() || T.ninguna}`,
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
    toast.success(T.copiado)
  } catch {
    resumen.select()
    toast(T.seleccion)
  }
})
addEventListener('resize', armarResumen)

activar()
