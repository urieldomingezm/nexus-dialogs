/**
 * Validadores para datos de México. No usan el DOM: sirven igual en el navegador que en el servidor (Node),
 * así validas lo mismo en los dos lados.
 *
 * ```ts
 * import { isRFC, isCURP, isNSS, isCLABE, isPostalCode } from 'nexus-dialogs/mx'
 * isCLABE('002010077777777771') // true
 * ```
 * Todos aceptan minúsculas y espacios alrededor; normaliza con `normalize()` antes de guardar.
 */

/** Mayúsculas y sin espacios. */
export const normalize = (v: string): string => v.trim().toUpperCase().replace(/\s+/g, '')

const fechaValida = (aa: string, mm: string, dd: string): boolean => {
  const m = +mm
  const d = +dd
  if (m < 1 || m > 12 || d < 1) return false
  // El año de 2 dígitos no dice el siglo; para el 29 de febrero se acepta si algún siglo lo permite.
  const dias = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
  return d <= dias && !(m === 2 && d === 29 && +aa % 4 !== 0)
}

/** RFC: 12 caracteres (persona moral) o 13 (persona física), con fecha válida. No verifica el dígito de la homoclave. */
export function isRFC(valor: string): boolean {
  const v = normalize(valor)
  const m = /^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{2})([A\d])$/.exec(v)
  return !!m && fechaValida(m[2], m[3], m[4])
}

const CURP =
  /^[A-Z][AEIOUX][A-Z]{2}(\d{2})(\d{2})(\d{2})[HMX](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/
const DICCIONARIO = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'

/** CURP: 18 caracteres, fecha y estado válidos y dígito verificador correcto. */
export function isCURP(valor: string): boolean {
  const v = normalize(valor)
  const m = CURP.exec(v)
  if (!m || !fechaValida(m[1], m[2], m[3])) return false
  let suma = 0
  for (let i = 0; i < 17; i++) suma += DICCIONARIO.indexOf(v[i]) * (18 - i)
  return (10 - (suma % 10)) % 10 === +v[17]
}

/** Número de Seguridad Social (IMSS): 11 dígitos con dígito verificador (algoritmo de Luhn). */
export function isNSS(valor: string): boolean {
  const v = normalize(valor)
  if (!/^\d{11}$/.test(v)) return false
  let suma = 0
  for (let i = 0; i < 10; i++) {
    let d = +v[i]
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    suma += d
  }
  return (10 - (suma % 10)) % 10 === +v[10]
}

/** CLABE interbancaria: 18 dígitos con dígito de control (pesos 3, 7, 1). */
export function isCLABE(valor: string): boolean {
  const v = normalize(valor)
  if (!/^\d{18}$/.test(v)) return false
  const pesos = [3, 7, 1]
  let suma = 0
  for (let i = 0; i < 17; i++) suma += (+v[i] * pesos[i % 3]) % 10
  return (10 - (suma % 10)) % 10 === +v[17]
}

/** Código postal: 5 dígitos, de 01000 a 99999. */
export const isPostalCode = (valor: string): boolean => /^(0[1-9]|[1-9]\d)\d{3}$/.test(normalize(valor))
