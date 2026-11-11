// @vitest-environment node
// La tabla de cobertura del sitio (site/src/swal2-cobertura.ts) debe decir la verdad sobre SweetAlert2 y sobre el adaptador.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import Swal from 'sweetalert2'
import {
  A_MEDIAS,
  METODOS_PENDIENTES,
  METODOS_SOPORTADOS,
  PARAMS_DISTINTAS,
  PARAMS_PENDIENTES,
  PARAMS_SOPORTADAS,
} from '../../site/src/swal2-cobertura'

const PARAMS = [...PARAMS_SOPORTADAS, ...Object.keys(PARAMS_DISTINTAS), ...PARAMS_PENDIENTES]
const METODOS = [...METODOS_SOPORTADOS, ...METODOS_PENDIENTES]

// Alias obsoletos o internos de SweetAlert2: no cuentan como API que alguien migre.
const IGNORADOS = [
  'on',
  'off',
  'once',
  'default',
  '_destroy',
  'closeModal',
  'closePopup',
  'closeToast',
  'enableLoading',
  'disableLoading',
  'handleAwaitingPromise',
  'rejectPromise',
  'isDeprecatedParameter',
]

const duplicados = (l: string[]) => l.filter((x, i) => l.indexOf(x) !== i)

describe('cobertura de SweetAlert2 en el sitio', () => {
  it('cada opción listada existe de verdad en SweetAlert2', () => {
    const inventadas = PARAMS.filter((p) => !Swal.isValidParameter(p))
    expect(inventadas).toEqual([])
  })

  it('no hay opciones repetidas entre las tres listas', () => {
    expect(duplicados(PARAMS)).toEqual([])
  })

  it('cada método listado existe en Swal', () => {
    const inventados = METODOS.filter((m) => !(m in Swal))
    expect(inventados).toEqual([])
    expect(duplicados(METODOS)).toEqual([])
  })

  it('no falta ningún método de Swal por clasificar', () => {
    const publicos = Object.keys(Swal).filter((k) => !IGNORADOS.includes(k))
    const sinClasificar = publicos.filter((k) => !METODOS.includes(k))
    expect(sinClasificar).toEqual([])
  })

  it('lo que se declara soportado se usa de verdad en src/swal.ts', () => {
    const codigo = readFileSync('src/swal.ts', 'utf8')
    const ausentes = PARAMS_SOPORTADAS.filter((p) => !new RegExp(`\\b${p}\\b`).test(codigo))
    expect(ausentes).toEqual([])
    const metodos = METODOS_SOPORTADOS.filter((m) => !new RegExp(`\\b${m}\\b`).test(codigo))
    expect(metodos).toEqual([])
  })

  it('lo que se declara pendiente no está implementado todavía', () => {
    const codigo = readFileSync('src/swal.ts', 'utf8')
    const yaEsta = PARAMS_PENDIENTES.filter((p) => new RegExp(`\\bo\\.${p}\\b`).test(codigo))
    expect(yaEsta, 'si ya existe, muévela a soportadas').toEqual([])
  })

  it('las funciones a medias traen detalle', () => {
    for (const a of A_MEDIAS) expect(a.detalle.length).toBeGreaterThan(10)
  })
})
