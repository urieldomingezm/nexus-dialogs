// @vitest-environment node
// Renderizado en servidor (Nuxt, Next, Angular Universal): importar la librería no debe tocar el DOM,
// lo que no necesita el navegador sigue funcionando y abrir un diálogo sin DOM falla de forma explícita.
import { describe, expect, it } from 'vitest'

describe('sin DOM (Node)', () => {
  it('importar cada subruta no lanza', async () => {
    const mods = await Promise.all([
      import('../../src/index'),
      import('../../src/forms'),
      import('../../src/toast'),
      import('../../src/patterns'),
      import('../../src/import'),
      import('../../src/table'),
      import('../../src/mx'),
      import('../../src/rrhh'),
      import('../../src/themes'),
      import('../../src/sepomex'),
      import('../../src/swal'),
      import('../../src/vue'),
      import('../../src/react'),
      import('../../src/angular'),
    ])
    for (const m of mods) expect(Object.keys(m).length).toBeGreaterThan(0)
  })

  it('validadores, CSV y plantillas funcionan en el servidor', async () => {
    const { isRFC, isCLABE, businessDays } = await import('../../src/mx')
    expect(isRFC('XAXX010101000')).toBe(true)
    expect(isCLABE('123')).toBe(false)
    expect(typeof businessDays).toBe('function')
    const { parseCSV, toCSV } = await import('../../src/import')
    expect(parseCSV('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
    expect(toCSV([{ a: 1 }], [{ key: 'a', label: 'A' }])).toContain('A')
    const { plantillas } = await import('../../src/rrhh')
    expect(Object.keys(plantillas)).toHaveLength(9)
  })

  it('abrir un diálogo o un toast sin DOM falla con un error, no se queda colgado', async () => {
    const { dialog } = await import('../../src/index')
    const { toast } = await import('../../src/toast')
    await expect(Promise.resolve().then(() => dialog.alert('x'))).rejects.toThrow()
    await expect(Promise.resolve().then(() => toast('x'))).rejects.toThrow()
  })
})
