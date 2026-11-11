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
export const normalize = (v: string): string => (typeof v === 'string' ? v : '').trim().toUpperCase().replace(/\s+/g, '')

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

// ── Días festivos y días hábiles ─────────────────────────────────────────────

const isoUTC = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
/** N-ésimo lunes (1 = primero) del mes (0 = enero). */
const lunes = (y: number, m: number, n: number) => {
  const primero = new Date(Date.UTC(y, m, 1)).getUTCDay()
  return isoUTC(y, m, 1 + ((8 - primero) % 7) + (n - 1) * 7)
}

/**
 * Días de descanso obligatorio del artículo 74 de la Ley Federal del Trabajo, como AAAA-MM-DD:
 * 1 de enero, primer lunes de febrero, tercer lunes de marzo, 1 de mayo, 16 de septiembre,
 * tercer lunes de noviembre, 25 de diciembre y, cada seis años (2024, 2030…), el 1 de octubre por la transmisión del Poder Ejecutivo.
 * No incluye los que no son de ley (Semana Santa, 2 de noviembre, 12 de diciembre): agrégalos con `holidays`.
 */
export function mexicanHolidays(year: number): string[] {
  const dias = [
    isoUTC(year, 0, 1),
    lunes(year, 1, 1),
    lunes(year, 2, 3),
    isoUTC(year, 4, 1),
    isoUTC(year, 8, 16),
    lunes(year, 10, 3),
    isoUTC(year, 11, 25),
  ]
  if (year >= 2024 && (year - 2024) % 6 === 0) dias.push(isoUTC(year, 9, 1))
  return dias.sort()
}

export interface BusinessDaysOptions {
  /** Festivos como AAAA-MM-DD (además de los de ley, si `mexican` no es false). */
  holidays?: string[]
  /** Contar los de ley de México. Por omisión true. */
  mexican?: boolean
  /** Días de descanso de la semana (0 = domingo … 6 = sábado). Por omisión sábado y domingo. */
  weekend?: number[]
}

/** ¿Es un día hábil? (AAAA-MM-DD). */
export function isBusinessDay(date: string, o: BusinessDaysOptions = {}): boolean {
  const fin = o.weekend ?? [0, 6]
  const d = new Date(date + 'T00:00:00Z')
  if (fin.includes(d.getUTCDay())) return false
  if (o.holidays?.includes(date)) return false
  return o.mexican === false || !mexicanHolidays(d.getUTCFullYear()).includes(date)
}

/** Días hábiles entre dos fechas, ambas incluidas (AAAA-MM-DD). 0 si `to` es anterior a `from`. */
export function businessDays(from: string, to: string, o: BusinessDaysOptions = {}): number {
  if (!from || !to || to < from) return 0
  const d = new Date(from + 'T00:00:00Z')
  const fin = new Date(to + 'T00:00:00Z')
  let n = 0
  while (d <= fin) {
    if (isBusinessDay(d.toISOString().slice(0, 10), o)) n++
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return n
}

/** Suma `n` días hábiles a una fecha (n puede ser negativo). Útil para fechas límite. */
export function addBusinessDays(date: string, n: number, o: BusinessDaysOptions = {}): string {
  const d = new Date(date + 'T00:00:00Z')
  const paso = n < 0 ? -1 : 1
  let faltan = Math.abs(n)
  while (faltan > 0) {
    d.setUTCDate(d.getUTCDate() + paso)
    if (isBusinessDay(d.toISOString().slice(0, 10), o)) faltan--
  }
  return d.toISOString().slice(0, 10)
}
