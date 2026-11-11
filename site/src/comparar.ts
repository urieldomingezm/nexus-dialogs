// Comparación en vivo: el mismo escenario con SweetAlert2 real, con el adaptador `nexus-dialogs/swal` y con la API propia.
import './comun'
import { decorarCodigo } from './comun'
import Swal from 'nexus-dialogs/swal'
import { dialog } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { form } from 'nexus-dialogs/forms'
import { confirmDelete } from 'nexus-dialogs/patterns'
import {
  A_MEDIAS,
  METODOS_PENDIENTES,
  METODOS_SOPORTADOS,
  PARAMS_DISTINTAS,
  PARAMS_PENDIENTES,
  PARAMS_SOPORTADAS,
} from './swal2-cobertura'

type SwalLike = { fire: (o: Record<string, unknown>) => Promise<unknown> } & Record<string, any>
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
let real: Promise<SwalLike> | undefined
const cargarReal = () => (real ??= import('sweetalert2').then((m) => m.default as unknown as SwalLike))

interface Escenario {
  titulo: string
  desc: string
  swal: string
  nexus: string
  conSwal: (S: SwalLike) => Promise<unknown>
  /** Si el adaptador no puede con este escenario, aquí va por qué. */
  sinAdaptador?: string
  conNexus: () => Promise<unknown>
}

const ESCENARIOS: Escenario[] = [
  {
    titulo: 'Confirmar un borrado',
    desc: 'El caso más común. Con SweetAlert2 hay que acordarse de `focusCancel`; la receta de nexus-dialogs ya deja el foco en Cancelar.',
    swal: `const r = await Swal.fire({
  title: '¿Eliminar a Laura Méndez?',
  text: 'No se puede deshacer.',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar',
  cancelButtonText: 'Cancelar',
  focusCancel: true,
})
if (r.isConfirmed) await borrar()`,
    nexus: `import { confirmDelete } from 'nexus-dialogs/patterns'

if (await confirmDelete({ what: 'a Laura Méndez' })) await borrar()`,
    conSwal: (S) =>
      S.fire({
        title: '¿Eliminar a Laura Méndez?',
        text: 'No se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        focusCancel: true,
      }),
    conNexus: () => confirmDelete({ what: 'a Laura Méndez' }),
  },
  {
    titulo: 'Éxito que se cierra solo',
    desc: 'Aviso con icono y temporizador.',
    swal: `await Swal.fire({ icon: 'success', title: 'Guardado', text: 'Laura ya aparece en la nómina.', timer: 2500, showConfirmButton: false })`,
    nexus: `await dialog.success({ title: 'Guardado', text: 'Laura ya aparece en la nómina.', timer: 2500 })`,
    conSwal: (S) => S.fire({ icon: 'success', title: 'Guardado', text: 'Laura ya aparece en la nómina.', timer: 2500, showConfirmButton: false }),
    conNexus: () => dialog.success({ title: 'Guardado', text: 'Laura ya aparece en la nómina.', timer: 2500 }),
  },
  {
    titulo: 'Pedir un dato con validación',
    desc: 'Un campo, con mensaje de error propio. Con el valor `abc` verás el error en los dos.',
    swal: `const r = await Swal.fire({
  title: 'Nueva área',
  input: 'text',
  inputLabel: 'Nombre del área',
  showCancelButton: true,
  inputValidator: (v) => (v.length < 5 ? 'Escribe al menos 5 caracteres.' : null),
})
if (r.isConfirmed) crear(r.value)`,
    nexus: `const r = await dialog.prompt({
  title: 'Nueva área',
  label: 'Nombre del área',
  validate: (v) => (v.length < 5 ? 'Escribe al menos 5 caracteres.' : null),
})
if (r.confirmed) crear(r.value)`,
    conSwal: (S) =>
      S.fire({
        title: 'Nueva área',
        input: 'text',
        inputLabel: 'Nombre del área',
        showCancelButton: true,
        inputValidator: (v: string) => (v.length < 5 ? 'Escribe al menos 5 caracteres.' : null),
      }),
    conNexus: () =>
      dialog.prompt({
        title: 'Nueva área',
        label: 'Nombre del área',
        validate: (v) => (v.length < 5 ? 'Escribe al menos 5 caracteres.' : null),
      }),
  },
  {
    titulo: 'Esperar al servidor al confirmar',
    desc: 'La primera vez falla a propósito para que veas cómo se muestra el error.',
    swal: `let intento = 0
await Swal.fire({
  title: 'Timbrar 148 recibos',
  showCancelButton: true,
  confirmButtonText: 'Timbrar',
  showLoaderOnConfirm: true,
  preConfirm: async () => {
    await espera(1200)
    if (++intento === 1) Swal.showValidationMessage('El SAT no respondió.')
    else return 148
  },
})`,
    nexus: `let intento = 0
await dialog.confirm({
  title: 'Timbrar 148 recibos',
  confirmText: 'Timbrar',
  preConfirm: async () => {
    await espera(1200)
    if (++intento === 1) throw new Error('El SAT no respondió.')
    return 148
  },
})`,
    conSwal: (() => {
      let intento = 0
      return (S: SwalLike) =>
        S.fire({
          title: 'Timbrar 148 recibos',
          showCancelButton: true,
          confirmButtonText: 'Timbrar',
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            await espera(1200)
            if (++intento % 2 === 1) {
              S.showValidationMessage('El SAT no respondió.')
              return false
            }
            return 148
          },
        })
    })(),
    conNexus: (() => {
      let intento = 0
      return () =>
        dialog.confirm({
          title: 'Timbrar 148 recibos',
          confirmText: 'Timbrar',
          preConfirm: async () => {
            await espera(1200)
            if (++intento % 2 === 1) throw new Error('El SAT no respondió.')
            return 148
          },
        })
    })(),
  },
  {
    titulo: 'Toast',
    desc: 'Aviso que no bloquea. SweetAlert2 lo hace con `toast: true`; nexus-dialogs tiene cola, pausa con el mouse y los anuncia al lector de pantalla.',
    swal: `Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empleado guardado', timer: 3000, timerProgressBar: true, showConfirmButton: false })`,
    nexus: `toast.success('Empleado guardado')`,
    conSwal: (S) =>
      S.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empleado guardado', timer: 3000, timerProgressBar: true, showConfirmButton: false }),
    conNexus: async () => {
      toast.success('Empleado guardado')
    },
  },
  {
    titulo: 'Formulario de varios campos',
    desc: 'SweetAlert2 solo trae un campo; para varios se arma el HTML y se leen los valores a mano. nexus-dialogs trae `form` con validación por campo, RFC con formato real y un resumen de errores con enlaces.',
    swal: `const r = await Swal.fire({
  title: 'Nuevo gasto',
  html: '<input id="rfc" class="swal2-input" placeholder="RFC"><input id="importe" class="swal2-input" type="number" placeholder="Importe">',
  focusConfirm: false,
  showCancelButton: true,
  preConfirm: () => {
    const rfc = document.getElementById('rfc').value
    const importe = document.getElementById('importe').value
    if (!rfc || !importe) Swal.showValidationMessage('Faltan datos')
    else return { rfc, importe }  // sin validar el RFC ni dar formato al importe
  },
})`,
    nexus: `const r = await form({
  title: 'Nuevo gasto',
  fields: [
    { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
    { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
  ],
})`,
    conSwal: (S) =>
      S.fire({
        title: 'Nuevo gasto',
        html: '<input id="rfc" class="swal2-input" placeholder="RFC"><input id="importe" class="swal2-input" type="number" placeholder="Importe">',
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          const rfc = (document.getElementById('rfc') as HTMLInputElement).value
          const importe = (document.getElementById('importe') as HTMLInputElement).value
          if (!rfc || !importe) {
            S.showValidationMessage('Faltan datos')
            return false
          }
          return { rfc, importe }
        },
      }),
    sinAdaptador:
      'Este código busca los campos con document.getElementById. En nexus-dialogs el contenido vive dentro del Shadow DOM, así que no los encuentra: hay que migrarlo a `form()` (o usar `render`).',
    conNexus: () =>
      form({
        title: 'Nuevo gasto',
        fields: [
          { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
          { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
        ],
      }),
  },
]

const mostrar = (v: unknown): string => {
  try {
    return JSON.stringify(v, null, 2) ?? String(v)
  } catch {
    return String(v)
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase = '', ...hijos: (Node | string)[]): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag)
  if (clase) n.className = clase
  n.append(...hijos)
  return n
}
const codigo = (texto: string) => {
  const pre = el('pre')
  pre.dataset.lang = 'ts'
  pre.appendChild(el('code', 'language-ts', texto))
  return pre
}

const contenedor = document.getElementById('escenarios')!
for (const e of ESCENARIOS) {
  const salida = el('div', 'resultado nota')
  salida.hidden = true
  const correr = (boton: HTMLButtonElement, fn: () => Promise<unknown>) => async () => {
    boton.disabled = true
    try {
      const r = await fn()
      salida.replaceChildren('Resultado: ', el('code', '', mostrar(r).replace(/\s+/g, ' ').slice(0, 200)))
    } catch (err) {
      salida.replaceChildren(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      salida.hidden = false
      boton.disabled = false
    }
  }
  const bSwal = el('button', 'btn chico', 'SweetAlert2')
  bSwal.type = 'button'
  bSwal.addEventListener('click', async () => correr(bSwal, async () => e.conSwal(await cargarReal()))())
  const bAdap = el('button', 'btn chico', 'Adaptador (mismo código)')
  bAdap.type = 'button'
  if (e.sinAdaptador) {
    bAdap.disabled = true
    bAdap.title = 'Este código no funciona con el adaptador: ver la nota'
  } else bAdap.addEventListener('click', () => correr(bAdap, () => e.conSwal(Swal as unknown as SwalLike))())
  const bNexus = el('button', 'btn chico primario', 'nexus-dialogs')
  bNexus.type = 'button'
  bNexus.addEventListener('click', () => correr(bNexus, e.conNexus)())

  const tarjeta = el(
    'article',
    'escenario',
    el('h3', '', e.titulo),
    el('p', '', e.desc),
    el('div', 'acciones', bSwal, bAdap, bNexus),
    ...(e.sinAdaptador ? [el('p', 'nota', `Adaptador: ${e.sinAdaptador}`)] : []),
    salida,
    el('details', '', el('summary', '', 'Ver el código de cada uno'), el('p', 'nota', 'SweetAlert2'), codigo(e.swal), el('p', 'nota', 'nexus-dialogs'), codigo(e.nexus)),
  )
  contenedor.appendChild(tarjeta)
}
decorarCodigo(contenedor)

// ── Cobertura del adaptador ─────────────────────────────────────────────────
const set = (id: string, v: string | number) => {
  const n = document.getElementById(id)
  if (n) n.textContent = String(v)
}
const distintas = Object.keys(PARAMS_DISTINTAS)
const totalParams = PARAMS_SOPORTADAS.length + distintas.length + PARAMS_PENDIENTES.length
const totalMetodos = METODOS_SOPORTADOS.length + METODOS_PENDIENTES.length
set('n-params', totalParams)
set('n-params-ok', PARAMS_SOPORTADAS.length)
set('n-params-dist', distintas.length)
set('n-params-falta', PARAMS_PENDIENTES.length)
set('n-metodos', totalMetodos)
set('n-metodos-ok', METODOS_SOPORTADOS.length)
set('n-metodos-falta', METODOS_PENDIENTES.length)

const lista = (id: string, nombres: string[], titulos?: Record<string, string>) => {
  const dest = document.getElementById(id)
  if (!dest) return
  for (const n of nombres) {
    const c = el('code', '', n)
    if (titulos?.[n]) c.title = titulos[n]
    dest.appendChild(c)
  }
}
lista('l-params-ok', PARAMS_SOPORTADAS)
lista('l-params-dist', distintas, PARAMS_DISTINTAS)
lista('l-params-falta', PARAMS_PENDIENTES)
lista('l-metodos-ok', METODOS_SOPORTADOS)
lista('l-metodos-falta', METODOS_PENDIENTES)
const medias = document.getElementById('l-medias')
if (medias) for (const m of A_MEDIAS) medias.appendChild(el('li', '', el('strong', '', `${m.nombre}: `), m.detalle))
const motivos = document.getElementById('l-motivos')
if (motivos) for (const [k, v] of Object.entries(PARAMS_DISTINTAS)) motivos.appendChild(el('tr', '', el('td', '', el('code', '', k)), el('td', '', v)))
