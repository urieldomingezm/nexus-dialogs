// Casos extremos: varios diálogos a la vez o seguidos, promesas pendientes al desmontar, validaciones asíncronas,
// archivos malos o enormes y navegadores sin alguna API nativa.
import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { dialog } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { NexusDialogs } from '../../src/vue'
import { useDialog } from '../../src/vue'
import { parseCSV, processRows, readSpreadsheet, toCSV } from '../../src/import'
import { $, $$, abiertos, boton, escribir, esperar } from './utilidades'

describe('varios diálogos', () => {
  it('uno tras otro: cada promesa resuelve y no queda nada en el DOM', async () => {
    for (let i = 0; i < 25; i++) {
      const p = dialog.confirm(`Pregunta ${i}`)
      expect(abiertos()).toBe(1)
      boton(i % 2 ? 'cancel' : 'confirm').click()
      expect((await p).confirmed).toBe(i % 2 === 0)
    }
    expect(abiertos()).toBe(0)
  })

  it('apilados: close() cierra solo el de arriba y respeta el orden', async () => {
    const orden: string[] = []
    const a = dialog.alert('A').then(() => orden.push('A'))
    const b = dialog.alert('B').then(() => orden.push('B'))
    const c = dialog.alert('C').then(() => orden.push('C'))
    expect(abiertos()).toBe(3)
    dialog.close()
    await c
    expect(abiertos()).toBe(2)
    dialog.close()
    await b
    dialog.close()
    await a
    expect(orden).toEqual(['C', 'B', 'A'])
    expect(abiertos()).toBe(0)
  })

  it('closeAll cierra toda la pila y todas las promesas resuelven', async () => {
    const ps = [dialog.alert('1'), dialog.confirm('2'), dialog.alert('3')]
    dialog.closeAll()
    const rs = await Promise.all(ps)
    expect(rs.map((r) => r.reason)).toEqual(['program', 'program', 'program'])
    expect(abiertos()).toBe(0)
  })

  it('abrir otro diálogo desde el .then del anterior (encadenado) funciona', async () => {
    const p = dialog.confirm('¿Borrar?').then((r) => (r.confirmed ? dialog.alert('Borrado') : null))
    boton('confirm').click()
    await esperar(5)
    expect($('.title').textContent).toBe('Borrado')
    boton('confirm').click()
    expect((await p)?.confirmed).toBe(true)
    expect(abiertos()).toBe(0)
  })

  it('close() sin diálogos abiertos no falla', () => {
    expect(() => dialog.close()).not.toThrow()
    expect(() => dialog.closeAll()).not.toThrow()
  })
})

describe('desmontar con la promesa pendiente', () => {
  it('Vue: un diálogo y un formulario con validación lenta se cierran sin errores sin atrapar', async () => {
    const api: { actual?: ReturnType<typeof useDialog> } = {}
    const App = defineComponent({
      setup() {
        api.actual = useDialog()
        return () => h('div')
      },
    })
    const app = createApp(App).use(NexusDialogs)
    app.mount(document.createElement('div'))
    const p = api.actual!.confirm({ title: '¿Seguro?' })
    expect(abiertos()).toBe(1)
    app.unmount()
    expect(await p).toMatchObject({ confirmed: false, reason: 'program' })
    expect(abiertos()).toBe(0)
    await nextTick()
  })

  it('cerrar con la validación async a medias no deja la promesa colgada ni lanza', async () => {
    const lenta = vi.fn(async () => {
      await esperar(30)
      return 'Ya existe'
    })
    const p = form({ title: 'Alta', fields: [{ name: 'rfc', label: 'RFC', validate: lenta }] })
    escribir($('input[name="rfc"]'), 'ABC')
    boton('confirm').click()
    await esperar(5)
    dialog.closeAll()
    expect((await p).confirmed).toBe(false)
    await esperar(50) // la validación termina después de cerrar: no debe romper nada
    expect(abiertos()).toBe(0)
  })
})

describe('validaciones asíncronas', () => {
  it('una validación lenta bloquea el envío, muestra su error y deja corregir', async () => {
    const existe = async (v: unknown) => {
      await esperar(10)
      return v === 'EXISTE' ? 'Ya está registrado' : null
    }
    const p = form({ title: 'Alta', fields: [{ name: 'codigo', label: 'Código', validate: existe }] })
    escribir($('input[name="codigo"]'), 'EXISTE')
    boton('confirm').click()
    await esperar(40)
    expect(abiertos()).toBe(1)
    expect($$('.msg').some((e) => e.textContent === 'Ya está registrado')).toBe(true)
    escribir($('input[name="codigo"]'), 'NUEVO')
    boton('confirm').click()
    const r = await p
    expect(r.confirmed).toBe(true)
    expect(r.value).toEqual({ codigo: 'NUEVO' })
  })

  it('un validate que lanza se muestra como error del campo, no rompe el formulario', async () => {
    const p = form({
      title: 'Alta',
      fields: [
        {
          name: 'x',
          label: 'X',
          validate: async () => {
            throw new Error('El servicio no responde')
          },
        },
      ],
    })
    boton('confirm').click()
    await esperar(20)
    expect(abiertos()).toBe(1)
    expect(raizTexto()).toContain('El servicio no responde')
    dialog.closeAll()
    await p
  })

  it('un preConfirm que falla muestra el error y mantiene el diálogo abierto', async () => {
    const p = dialog.confirm({
      title: 'Guardar',
      preConfirm: async () => {
        throw new Error('Sin conexión')
      },
    })
    boton('confirm').click()
    await esperar(20)
    expect(abiertos()).toBe(1)
    expect(raizTexto()).toContain('Sin conexión')
    dialog.closeAll()
    await p
  })
})

function raizTexto(): string {
  return $$('*')
    .map((e) => e.textContent ?? '')
    .join(' ')
}

describe('importar y exportar con archivos difíciles', () => {
  const zipRoto = () => new File([new Uint8Array([0x50, 0x4b, 3, 4, 9, 9, 9, 9, 9, 9, 9, 9])], 'roto.xlsx')

  it('un .xlsx corrupto se rechaza con un error, no se queda colgado', async () => {
    await expect(readSpreadsheet(zipRoto())).rejects.toBeDefined()
  })

  it('un archivo vacío da cero filas', async () => {
    expect(await readSpreadsheet(new File([''], 'vacio.csv'))).toEqual([])
  })

  it('CSV con BOM, CRLF, punto y coma y comillas se lee bien', () => {
    const csv = '﻿nombre;nota\r\n"Ana; la grande";9,5\r\n"Luis ""el rápido""";8\r\n'
    const filas = parseCSV(csv)
    expect(filas[0]).toEqual(['nombre', 'nota'])
    expect(filas[1]).toEqual(['Ana; la grande', '9,5'])
    expect(filas[2]![0]).toBe('Luis "el rápido"')
  })

  it('comillas sin cerrar no cuelgan ni lanzan', () => {
    expect(() => parseCSV('a,b\n"x,1\n2,3')).not.toThrow()
  })

  it('50 000 filas se leen y validan rápido y reportan cada error con su número de fila', () => {
    const cuerpo = Array.from({ length: 50_000 }, (_, i) => `${i},${i % 1000 === 0 ? 'no-es-numero' : '10'}`)
    const t0 = performance.now()
    const filas = parseCSV('id,monto\n' + cuerpo.join('\n'))
    const r = processRows(
      filas.slice(1),
      [
        { name: 'id', label: 'ID', type: 'number', required: true },
        { name: 'monto', label: 'Monto', type: 'number' },
      ],
      { id: 0, monto: 1 },
    )
    expect(filas).toHaveLength(50_001)
    expect(r.errors).toHaveLength(50)
    expect(r.rows.length + r.errors.length).toBeLessThanOrEqual(50_000)
    expect(r.errors[0]!.row).toBeGreaterThanOrEqual(1)
    expect(performance.now() - t0).toBeLessThan(3000)
  })

  it('exportar CSV protege comillas, saltos de línea e inyección de fórmulas', () => {
    const csv = toCSV(
      [{ n: 'Ana "la" grande', f: '=HYPERLINK("http://x")', m: 'línea1\nlínea2' }],
      [
        { key: 'n', label: 'Nombre' },
        { key: 'f', label: 'Fórmula' },
        { key: 'm', label: 'Nota' },
      ],
    )
    expect(csv).toContain('"Ana ""la"" grande"')
    expect(csv).toContain('"línea1\nlínea2"')
    expect(csv).not.toMatch(/(^|,)=HYPERLINK/)
  })
})

describe('navegadores sin alguna capacidad', () => {
  it('sin matchMedia el diálogo abre y cierra', async () => {
    const guardado = window.matchMedia
    ;(window as { matchMedia?: unknown }).matchMedia = undefined
    try {
      const p = dialog.alert('Hola')
      expect(abiertos()).toBe(1)
      boton('confirm').click()
      expect((await p).confirmed).toBe(true)
    } finally {
      window.matchMedia = guardado
    }
  })

  it('sin hojas de estilo construibles usa <style> dentro del shadow root', async () => {
    vi.resetModules()
    vi.stubGlobal('CSSStyleSheet', undefined)
    try {
      const { dialog: d } = await import('../../src/dialog')
      const p = d.alert('Sin hojas')
      expect($$('style').length).toBeGreaterThan(0)
      d.close()
      await p
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
