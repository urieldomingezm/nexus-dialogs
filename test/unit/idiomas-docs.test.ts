// Las páginas por idioma no se desordenan: la tabla de SweetAlert2 en inglés tiene los mismos parámetros y estados que la de español,
// y cada documento traducido tiene los mismos títulos de sección que el original (así los enlaces con ancla no se rompen).
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const leer = (p: string) => readFileSync(p, 'utf8')
const filas = (md: string) => [...md.matchAll(/^\| `(\w+)` \| ([\wñ ]+?) \|/gm)].map((m) => [m[1], m[2]])
const ESTADO: Record<string, string> = { compatible: 'compatible', parcial: 'partial', ignorado: 'ignored', 'sin soporte': 'unsupported' }

describe('documentación por idioma', () => {
  it('la tabla de SweetAlert2 en inglés coincide con la de español (parámetros y estados)', () => {
    const es = filas(leer('docs/swal-compat.md')).map(([p, e]) => [p, ESTADO[e]])
    expect(filas(leer('docs/en/swal-compat.md'))).toEqual(es)
  })

  it('cada documento traducido tiene los mismos bloques de código que el original', () => {
    const bloques = (md: string) => (md.match(/^```\w*$/gm) ?? []).length
    for (const f of readdirSync('docs/en').filter((x) => x.endsWith('.md'))) {
      expect(existsSync(`docs/${f}`), `docs/${f} existe`).toBe(true)
      expect(bloques(leer(`docs/en/${f}`)), `bloques de código de ${f}`).toBe(bloques(leer(`docs/${f}`)))
    }
  })

  it('cada documento traducido tiene el mismo número de secciones y de tablas que el original', () => {
    const secciones = (md: string) => (md.match(/^#{2,3} /gm) ?? []).length
    const tablas = (md: string) => (md.match(/^\|---/gm) ?? []).length
    for (const f of readdirSync('docs/en').filter((x) => x.endsWith('.md'))) {
      const o = leer(`docs/${f}`)
      const t = leer(`docs/en/${f}`)
      expect(secciones(t), `secciones de ${f}`).toBe(secciones(o))
      expect(tablas(t), `tablas de ${f}`).toBe(tablas(o))
    }
  })
  it('README.en.md tiene las mismas secciones y bloques de código que README.md, y las anclas que usan las páginas en inglés existen', () => {
    const es = leer('README.md')
    const en = leer('README.en.md')
    const cuenta = (md: string, re: RegExp) => (md.match(re) ?? []).length
    expect(cuenta(en, /^#{2,3} /gm)).toBe(cuenta(es, /^#{2,3} /gm) + 0)
    expect(cuenta(en, /^```\w*$/gm)).toBe(cuenta(es, /^```\w*$/gm))
    const slug = (t: string) =>
      t
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .trim()
        .replace(/\s/g, '-')
    const anclas = new Set([...en.matchAll(/^#{2,4} (.+)$/gm)].map((m) => slug(m[1])))
    const fuentes = [...readdirSync('docs/en').map((f) => `docs/en/${f}`), 'site/en/index.html']
    for (const f of fuentes)
      for (const m of leer(f).matchAll(/guia\.html#([^)"\s]+)/g)) expect(anclas.has(decodeURIComponent(m[1])), `${f} → #${m[1]}`).toBe(true)
    for (const m of en.matchAll(/\]\(#([^)]+)\)/g)) expect(anclas.has(m[1]), `README.en.md → #${m[1]}`).toBe(true)
  })
})
