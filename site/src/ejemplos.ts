// Galería de ejemplos: lee site/src/ejemplos-def.ts como texto (para mostrar el código tal cual) y como módulo (para ejecutarlo).
import './comun'
import { decorarCodigo } from './comun'
import { chispas, fueConfirmado } from './animaciones'
import { analizar, type Ejemplo } from './ejemplos-datos'
import fuente from './ejemplos-def.ts?raw'
import * as funciones from './ejemplos-def'

const ejemplos = analizar(fuente)
const grupos = [...new Set(ejemplos.map((e) => e.grupo))]
const cont = document.querySelector<HTMLElement>('#galeria')!
const buscador = document.querySelector<HTMLInputElement>('#buscar')!
const chips = document.querySelector<HTMLElement>('#chips')!
const vacio = document.querySelector<HTMLElement>('#vacio')!
let grupoActivo = ''

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {}, ...hijos: (Node | string)[]) {
  const n = document.createElement(tag)
  const { class: clase, ...resto } = props
  if (clase) n.className = clase
  Object.assign(n, resto)
  n.append(...hijos)
  return n
}

function mostrar(res: unknown): string {
  if (res === undefined) return '(sin valor: el ejemplo no devuelve nada)'
  try {
    return JSON.stringify(res, null, 2) ?? String(res)
  } catch {
    return String(res)
  }
}

function tarjeta(e: Ejemplo): HTMLElement {
  const salida = el('div', { class: 'resultado' })
  salida.hidden = true
  const boton = el('button', { class: 'btn primario chico', type: 'button' }, 'Probar')
  boton.addEventListener('click', async () => {
    boton.disabled = true
    boton.setAttribute('aria-busy', 'true')
    try {
      const res = await (funciones as unknown as Record<string, () => unknown>)[e.funcion]()
      if (fueConfirmado(res)) chispas(boton)
      salida.replaceChildren('Resultado:', el('pre', { 'data-lang': 'json' } as never, el('code', { class: 'language-json' }, mostrar(res))))
    } catch (err) {
      salida.replaceChildren(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      salida.hidden = false
      decorarCodigo(salida)
      boton.disabled = false
      boton.removeAttribute('aria-busy')
    }
  })
  const pre = el('pre', { 'data-lang': 'ts' } as never, el('code', { class: 'language-ts' }, e.codigo))
  const art = el(
    'article',
    { class: 'ejemplo', id: `ej-${e.id}` },
    el('header', {}, el('div', {}, el('h3', {}, e.titulo), el('p', {}, e.desc)), boton),
    pre,
    salida,
  )
  art.dataset.grupo = e.grupo
  art.dataset.texto = `${e.titulo} ${e.desc} ${e.grupo} ${e.codigo}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return art
}

const tarjetas = new Map<string, HTMLElement>()
for (const g of grupos) {
  const seccion = el('section', { class: 'grupo' }, el('h2', { class: 'grupo-titulo' }, g))
  seccion.dataset.grupo = g
  for (const e of ejemplos.filter((x) => x.grupo === g)) {
    const t = tarjeta(e)
    tarjetas.set(e.id, t)
    seccion.appendChild(t)
  }
  cont.appendChild(seccion)
}
decorarCodigo(cont)

function chip(texto: string, valor: string): HTMLButtonElement {
  const b = el('button', { class: 'chip', type: 'button' }, texto)
  b.setAttribute('aria-pressed', String(grupoActivo === valor))
  b.addEventListener('click', () => {
    grupoActivo = valor
    for (const c of chips.querySelectorAll('button')) c.setAttribute('aria-pressed', String(c === b))
    filtrar()
  })
  return b
}
chips.append(chip('Todos', ''), ...grupos.map((g) => chip(g, g)))

function filtrar(): void {
  const q = buscador.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  let visibles = 0
  for (const s of cont.querySelectorAll<HTMLElement>('section.grupo')) {
    let dentro = 0
    for (const t of s.querySelectorAll<HTMLElement>('.ejemplo')) {
      const ok = (!grupoActivo || t.dataset.grupo === grupoActivo) && (!q || (t.dataset.texto ?? '').includes(q))
      t.hidden = !ok
      if (ok) dentro++
    }
    s.hidden = dentro === 0
    visibles += dentro
  }
  vacio.hidden = visibles > 0
}
buscador.addEventListener('input', filtrar)

document.querySelector('#total')!.textContent = String(ejemplos.length)
if (location.hash) tarjetas.get(location.hash.slice(1))?.scrollIntoView()  // #alerta → tarjeta ej-alerta
