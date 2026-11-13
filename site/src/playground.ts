// Playground: el código que escribes corre en esta página con la librería de esta versión.
// Los `import { x } from 'nexus-dialogs/…'` se resuelven a los módulos del sitio (cargados al momento) y el resto se ejecuta como
// el cuerpo de una función `async`, así que `await` funciona sin envolverlo. Sin servidor: nada del código sale de la página.
import './comun'
import { analizar } from './ejemplos-datos'
import fuente from './ejemplos-def.ts?raw'

type Modulo = Record<string, unknown>
const MODULOS: Record<string, () => Promise<Modulo>> = {
  'nexus-dialogs': () => import('nexus-dialogs') as Promise<Modulo>,
  'nexus-dialogs/forms': () => import('nexus-dialogs/forms') as Promise<Modulo>,
  'nexus-dialogs/patterns': () => import('nexus-dialogs/patterns') as Promise<Modulo>,
  'nexus-dialogs/toast': () => import('nexus-dialogs/toast') as Promise<Modulo>,
  'nexus-dialogs/mx': () => import('nexus-dialogs/mx') as Promise<Modulo>,
  'nexus-dialogs/import': () => import('nexus-dialogs/import') as Promise<Modulo>,
  'nexus-dialogs/table': () => import('nexus-dialogs/table') as Promise<Modulo>,
  'nexus-dialogs/tabs': () => import('nexus-dialogs/tabs') as Promise<Modulo>,
  'nexus-dialogs/timeline': () => import('nexus-dialogs/timeline') as Promise<Modulo>,
  'nexus-dialogs/rrhh': () => import('nexus-dialogs/rrhh') as Promise<Modulo>,
  'nexus-dialogs/themes': () => import('nexus-dialogs/themes') as Promise<Modulo>,
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...valores: unknown[]) => Promise<unknown>

const IMPORT = /^[ \t]*import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?[ \t]*$/gm

/** Separa los `import` del resto y los convierte en nombres ya resueltos. */
async function preparar(codigo: string): Promise<{ nombres: string[]; valores: unknown[]; cuerpo: string }> {
  const nombres: string[] = []
  const valores: unknown[] = []
  const pedidos: [string, string][] = []
  const cuerpo = codigo.replace(IMPORT, (_t, soloTipo: string | undefined, lista: string, de: string) => {
    if (soloTipo) return ''
    for (const parte of lista.split(',')) {
      const p = parte.trim()
      if (!p || p.startsWith('type ')) continue
      const m = /^(\w+)(?:\s+as\s+(\w+))?$/.exec(p)
      if (!m) throw new Error(`No entiendo este import: «${p}».`)
      pedidos.push([de, m[1]])
      nombres.push(m[2] ?? m[1])
    }
    return ''
  })
  const cargados = new Map<string, Modulo>()
  for (const [de] of pedidos) {
    if (cargados.has(de)) continue
    const carga = MODULOS[de]
    if (!carga) throw new Error(`No conozco «${de}». Disponibles: ${Object.keys(MODULOS).join(', ')}.`)
    cargados.set(de, await carga())
  }
  for (const [de, nombre] of pedidos) {
    const v = cargados.get(de)![nombre]
    if (v === undefined) throw new Error(`«${de}» no exporta «${nombre}».`)
    valores.push(v)
  }
  return { nombres, valores, cuerpo }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const editor = $<HTMLTextAreaElement>('pg-codigo')
const salida = $('pg-salida')
const selector = $<HTMLSelectElement>('pg-ejemplo')
const ejecutar = $<HTMLButtonElement>('pg-ejecutar')
const compartir = $<HTMLButtonElement>('pg-compartir')
const restablecer = $<HTMLButtonElement>('pg-restablecer')

const VACIO = `import { dialog } from 'nexus-dialogs'

const r = await dialog.confirm({ title: '¿Guardar los cambios?', text: 'Esto actualiza el expediente.' })
console.log(r)
`

// Solo entran los ejemplos que son JavaScript: los que traen anotaciones de tipos de TypeScript no corren aquí.
const ejemplos = analizar(fuente).filter((e) => {
  try {
    new AsyncFunction(e.codigo.replace(IMPORT, ''))
    return true
  } catch {
    return false
  }
})
for (const g of [...new Set(ejemplos.map((e) => e.grupo))]) {
  const og = document.createElement('optgroup')
  og.label = g
  for (const e of ejemplos.filter((x) => x.grupo === g)) og.append(new Option(e.titulo, e.id))
  selector.append(og)
}
selector.prepend(new Option('Tu código', ''))

const aBase64 = (t: string): string => btoa(String.fromCharCode(...new TextEncoder().encode(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const deBase64 = (b: string): string => {
  const bin = atob(b.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

function linea(texto: string, clase = ''): void {
  const p = document.createElement('pre')
  p.className = `pg-linea ${clase}`.trim()
  p.textContent = texto
  salida.append(p)
  salida.scrollTop = salida.scrollHeight
}
const mostrar = (v: unknown): string => {
  if (typeof v === 'string') return v
  if (v === undefined) return 'undefined'
  try {
    return JSON.stringify(v, null, 2) ?? String(v)
  } catch {
    return String(v)
  }
}

async function correr(): Promise<void> {
  ejecutar.disabled = true
  ejecutar.setAttribute('aria-busy', 'true')
  salida.replaceChildren()
  const consola = {
    log: (...a: unknown[]) => linea(a.map(mostrar).join(' ')),
    info: (...a: unknown[]) => linea(a.map(mostrar).join(' ')),
    warn: (...a: unknown[]) => linea(a.map(mostrar).join(' '), 'aviso'),
    error: (...a: unknown[]) => linea(a.map(mostrar).join(' '), 'error'),
  }
  try {
    const { nombres, valores, cuerpo } = await preparar(editor.value)
    const f = new AsyncFunction(...nombres, 'console', cuerpo)
    const r = await f(...valores, consola)
    if (r !== undefined) linea(`→ ${mostrar(r)}`)
    if (!salida.childElementCount) linea('(listo: el código terminó sin escribir nada)', 'tenue')
  } catch (e) {
    linea(e instanceof Error ? `${e.name}: ${e.message}` : String(e), 'error')
  } finally {
    ejecutar.disabled = false
    ejecutar.removeAttribute('aria-busy')
  }
}

function poner(codigo: string, id = ''): void {
  editor.value = codigo
  selector.value = id
  salida.replaceChildren()
}

function desdeHash(): void {
  const h = location.hash.slice(1)
  if (h.startsWith('c=')) {
    try {
      return poner(deBase64(h.slice(2)))
    } catch {
      /* enlace dañado: se queda el ejemplo inicial */
    }
  }
  const e = ejemplos.find((x) => x.id === h.replace(/^ej=/, ''))
  if (e) return poner(e.codigo, e.id)
  poner(VACIO)
}

selector.addEventListener('change', () => {
  const e = ejemplos.find((x) => x.id === selector.value)
  poner(e ? e.codigo : VACIO, e?.id ?? '')
  history.replaceState(null, '', e ? `#ej=${e.id}` : location.pathname + location.search)
})
editor.addEventListener('input', () => {
  selector.value = ''
})
editor.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
    ev.preventDefault()
    if (!ejecutar.disabled) void correr()
  }
})
ejecutar.addEventListener('click', () => void correr())
restablecer.addEventListener('click', () => {
  const e = ejemplos.find((x) => x.id === selector.value)
  poner(e ? e.codigo : VACIO, e?.id ?? '')
})
compartir.addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#c=${aBase64(editor.value)}`
  history.replaceState(null, '', url)
  try {
    await navigator.clipboard.writeText(url)
    compartir.textContent = 'Enlace copiado'
  } catch {
    compartir.textContent = 'Está en la barra de direcciones'
  }
  setTimeout(() => (compartir.textContent = 'Copiar enlace'), 2000)
})
window.addEventListener('hashchange', desdeHash)
desdeHash()
