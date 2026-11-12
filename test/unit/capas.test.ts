// Los tres niveles de nexus-dialogs: cada uno solo puede importar del mismo nivel o de uno inferior.
// Núcleo (diálogos) < UI avanzada (formularios, toasts, tablas) < Empresa (RR. HH., importación) < Integraciones (Vue, React, Angular, swal y el paquete de navegador `global`).
// `mx` y `sepomex` son hojas puras sin importaciones, así que cualquier nivel puede usarlas.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '../../src')
const NIVEL: Record<string, number> = {}
const asignar = (n: number, ...mods: string[]) => mods.forEach((m) => (NIVEL[m] = n))
asignar(0, 'index', 'dialog', 'config', 'styles', 'types', 'i18n', 'core/dom', 'core/engine', 'core/icons', 'core/sheet')
asignar(1, 'forms', 'fields', 'toast', 'table', 'tabs', 'timeline', 'patterns', 'themes')
asignar(2, 'rrhh', 'import')
asignar(3, 'vue', 'react', 'angular', 'adaptadores', 'swal', 'swal-global', 'global')
const HOJAS = new Set(['mx', 'sepomex'])

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') && !p.endsWith('.d.ts') ? [p] : []
  })
}

/** 'nexus-dialogs/forms' → 'forms'; './core/dom' → 'core/dom'; 'nexus-dialogs' → 'index'. */
function modulo(desde: string, spec: string): string | null {
  if (spec === 'nexus-dialogs') return 'index'
  if (spec.startsWith('nexus-dialogs/')) return spec.slice('nexus-dialogs/'.length)
  if (spec.startsWith('.')) {
    const base = join(desde, '..', spec)
    return relative(SRC, base).replace(/\\/g, '/')
  }
  return null
}

describe('niveles de la librería', () => {
  const todos = archivos(SRC).map((p) => ({ p, mod: relative(SRC, p).replace(/\.ts$/, '').replace(/\\/g, '/') }))

  it('cada archivo pertenece a un nivel o es una hoja', () => {
    const sin = todos.filter((t) => NIVEL[t.mod] === undefined && !HOJAS.has(t.mod)).map((t) => t.mod)
    expect(sin).toEqual([])
  })

  it('las hojas (mx, sepomex) no importan nada de la librería', () => {
    for (const h of HOJAS) {
      const src = readFileSync(join(SRC, `${h}.ts`), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      const imports = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
      expect(
        imports.filter((s) => s.startsWith('.') || s.startsWith('nexus-dialogs')),
        h,
      ).toEqual([])
    }
  })

  it('ningún archivo importa de un nivel superior', () => {
    const faltas: string[] = []
    for (const { p, mod } of todos) {
      const mio = NIVEL[mod]
      if (mio === undefined) continue
      const src = readFileSync(p, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      for (const m of src.matchAll(/(?:from|import\()\s*'([^']+)'/g)) {
        const dest = modulo(p, m[1])
        if (!dest || HOJAS.has(dest)) continue
        const suyo = NIVEL[dest]
        if (suyo === undefined) continue
        if (suyo > mio) faltas.push(`${mod} (nivel ${mio}) importa ${dest} (nivel ${suyo})`)
      }
    }
    expect(faltas).toEqual([])
  })
})
