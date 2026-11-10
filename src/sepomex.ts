/**
 * Catálogo de códigos postales de SEPOMEX servido desde tu propio sitio: sin API de terceros y siempre al día.
 *
 * 1. Descarga el catálogo oficial (correosdemexico.gob.mx → «Descarga tu código postal», formato TXT).
 * 2. Conviértelo en archivos pequeños por prefijo (uno por cada dos primeros dígitos):
 *    `npx nexus-dialogs-sepomex CPdescarga.txt public/cp`
 * 3. Úsalo en el campo `address`:
 *
 * ```ts
 * import { sepomexLookup } from 'nexus-dialogs/sepomex'
 * const lookupPostalCode = sepomexLookup({ baseUrl: '/cp/' })
 * form({ fields: [{ name: 'domicilio', label: 'Domicilio', type: 'address', lookupPostalCode }] })
 * ```
 * Cada consulta baja solo el archivo de su prefijo (unos KB) y queda en memoria.
 */

/** Lo que regresa para un código postal (lo mismo que espera `lookupPostalCode`). */
export interface SepomexResult {
  state: string
  municipality: string
  city?: string
  neighborhoods: string[]
}

/** Formato de cada archivo: { "64000": [estado, municipio, ciudad, [colonias…]] }. */
export type SepomexShard = Record<string, [string, string, string, string[]]>

export interface SepomexOptions {
  /** Carpeta pública con los archivos `NN.json` (termina en /). Ejemplo: '/cp/' o 'https://cdn.tuempresa.mx/cp/'. */
  baseUrl: string
  /** fetch propio (pruebas, encabezados, caché). */
  fetch?: (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>
}

/** Devuelve la función de búsqueda para `lookupPostalCode`. null si el CP no existe. */
export function sepomexLookup(o: SepomexOptions): (cp: string) => Promise<SepomexResult | null> {
  const cache = new Map<string, Promise<SepomexShard>>()
  const base = o.baseUrl.endsWith('/') ? o.baseUrl : o.baseUrl + '/'
  const pedir = o.fetch ?? ((u: string) => fetch(u))
  return async (cp) => {
    const c = String(cp).trim()
    if (!/^\d{5}$/.test(c)) return null
    const prefijo = c.slice(0, 2)
    let p = cache.get(prefijo)
    if (!p) {
      p = pedir(`${base}${prefijo}.json`).then((r) => (r.ok ? (r.json() as Promise<SepomexShard>) : {}))
      // Si falla la red, se vuelve a intentar en la siguiente consulta.
      p.catch(() => cache.delete(prefijo))
      cache.set(prefijo, p)
    }
    const fila = (await p)[c]
    return fila ? { state: fila[0], municipality: fila[1], city: fila[2] || undefined, neighborhoods: fila[3] } : null
  }
}

/** Convierte el texto de CPdescarga.txt (separado por |) en archivos por prefijo. Lo usa el comando; también sirve en tu servidor. */
export function buildSepomexShards(texto: string): Record<string, SepomexShard> {
  const salida: Record<string, SepomexShard> = {}
  for (const linea of texto.split(/\r?\n/)) {
    const c = linea.split('|')
    if (c.length < 6 || !/^\d{5}$/.test(c[0])) continue // nota de derechos y encabezado
    const [cp, colonia, , municipio, estado, ciudad] = c.map((x) => x.trim())
    const shard = (salida[cp.slice(0, 2)] ??= {})
    const fila = (shard[cp] ??= [estado, municipio, ciudad, []])
    if (colonia && !fila[3].includes(colonia)) fila[3].push(colonia)
  }
  for (const shard of Object.values(salida)) for (const fila of Object.values(shard)) fila[3].sort((a, b) => a.localeCompare(b, 'es'))
  return salida
}
