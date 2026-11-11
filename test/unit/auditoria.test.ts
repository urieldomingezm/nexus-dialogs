// Hallazgos de la auditoría del código: reentradas, carreras y contenedores que desaparecen. Cada prueba falló antes del arreglo.
import { describe, expect, it, vi } from 'vitest'
import { dialog, openDialog } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { $, abiertos, boton, escribir, esperar } from './utilidades'

describe('reentradas al confirmar', () => {
  it('doble clic en Confirmar durante una validación asíncrona: preConfirm corre una sola vez', async () => {
    const preConfirm = vi.fn(async () => undefined)
    const p = form({
      title: 'Alta',
      fields: [
        {
          name: 'rfc',
          label: 'RFC',
          validate: async () => {
            await esperar(40)
            return null
          },
        },
      ],
      preConfirm,
    })
    escribir($('input[name="rfc"]'), 'ABC')
    boton('confirm').click()
    boton('confirm').click()
    boton('confirm').click()
    const r = await p
    expect(r.confirmed).toBe(true)
    expect(preConfirm).toHaveBeenCalledTimes(1)
  })

  it('Cancelar mientras valida: no se ejecuta preConfirm después de cerrar', async () => {
    const preConfirm = vi.fn(async () => undefined)
    const p = openDialog({
      title: 'Alta',
      collect: async () => {
        await esperar(40)
        return 'valor'
      },
      preConfirm,
    })
    boton('confirm').click()
    await esperar(5)
    boton('cancel').click()
    const r = await p
    expect(r.reason).toBe('cancel')
    await esperar(80)
    expect(preConfirm).not.toHaveBeenCalled()
  })

  it('doble clic en un botón personalizado con onClick asíncrono: se ejecuta una vez', async () => {
    const onClick = vi.fn(async () => {
      await esperar(30)
      return 'listo'
    })
    const p = dialog.open({
      title: 'Opciones',
      buttons: [
        { id: 'cancel', role: 'cancel', text: 'Cancelar' },
        { id: 'guardar', text: 'Guardar borrador', onClick },
      ],
    })
    const b = boton('guardar')
    b.click()
    b.click()
    const r = await p
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(r.reason).toBe('guardar')
  })

  it('tras un INVALID se puede volver a confirmar', async () => {
    const p = form({
      title: 'X',
      fields: [{ name: 'a', label: 'A', validate: (v) => (v === 'bien' ? null : 'mal') }],
    })
    escribir($('input[name="a"]'), 'mal')
    boton('confirm').click()
    await esperar(10)
    expect(abiertos()).toBe(1)
    escribir($('input[name="a"]'), 'bien')
    boton('confirm').click()
    expect((await p).confirmed).toBe(true)
  })
})

describe('validación asíncrona por campo', () => {
  it('una respuesta vieja y lenta no pisa a la más reciente', async () => {
    const validate = async (v: unknown) => {
      if (v === 'a') {
        await esperar(60)
        return 'a ya existe'
      }
      await esperar(5)
      return null
    }
    const p = form({ title: 'X', fields: [{ name: 'codigo', label: 'Código', validate }] })
    const campo = $('input[name="codigo"]')
    escribir(campo, 'a')
    escribir(campo, 'ab')
    await esperar(120)
    expect(campo.getAttribute('aria-invalid')).toBe('false')
    expect($('.field .msg').textContent).toBe('')
    dialog.closeAll()
    await p
  })
})

describe('contenedor que desaparece (cambio de ruta)', () => {
  it('si se quita del DOM el contenedor, la promesa resuelve y se libera el scroll', async () => {
    const zona = document.createElement('div')
    document.body.appendChild(zona)
    const p = openDialog({ title: 'En una vista', target: zona })
    expect(document.documentElement.hasAttribute('data-nexus-lock')).toBe(true)
    zona.remove() // el router destruye la vista
    const r = await Promise.race([p, esperar(200).then(() => 'colgado' as const)])
    expect(r).not.toBe('colgado')
    expect(document.documentElement.hasAttribute('data-nexus-lock')).toBe(false)
    expect(abiertos()).toBe(0)
  })
})

const PREFIJO = 'nexus-dialogs:draft:'

describe('borrador automático (draftKey)', () => {
  it('con localStorage roto o lleno el formulario sigue funcionando', async () => {
    const espia = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('lleno', 'QuotaExceededError')
    })
    try {
      const p = form({ title: 'X', draftKey: 'prueba-lleno', fields: [{ name: 'a', label: 'A' }] })
      escribir($('input[name="a"]'), 'hola')
      await esperar(400)
      boton('confirm').click()
      expect((await p).value).toEqual({ a: 'hola' })
    } finally {
      espia.mockRestore()
    }
  })

  it('un borrador corrupto se ignora', async () => {
    localStorage.setItem(`${PREFIJO}prueba-malo`, '{no es json')
    const p = form({ title: 'X', draftKey: 'prueba-malo', fields: [{ name: 'a', label: 'A' }] })
    await esperar(20)
    expect(abiertos()).toBeGreaterThan(0)
    dialog.closeAll()
    await p
  })

  it('las contraseñas nunca se guardan en el borrador', async () => {
    const p = form({
      title: 'X',
      draftKey: 'prueba-clave',
      fields: [
        { name: 'usuario', label: 'Usuario' },
        { name: 'clave', label: 'Clave', type: 'password' },
      ],
    })
    escribir($('input[name="usuario"]'), 'ana')
    escribir($('input[name="clave"]'), 'secreto123')
    await esperar(400)
    const guardado = localStorage.getItem(`${PREFIJO}prueba-clave`) ?? ''
    expect(guardado).toContain('ana')
    expect(guardado).not.toContain('secreto123')
    dialog.closeAll()
    await p
  })
})

describe('funciones puras ante entradas raras', () => {
  it('los validadores devuelven false y no lanzan', async () => {
    const { isRFC, isCURP, isNSS, isCLABE, isPostalCode } = await import('../../src/mx')
    for (const f of [isRFC, isCURP, isNSS, isCLABE, isPostalCode]) {
      for (const raro of [undefined, null, 0, NaN, {}, [], '', ' ', '💥', 'a'.repeat(10_000), '\u0000']) {
        expect(() => f(raro as never), f.name).not.toThrow()
        expect(f(raro as never), f.name).toBe(false)
      }
    }
  })
})
