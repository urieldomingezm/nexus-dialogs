import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fieldsFromJSON, form, formatPhone, formFromJSON, matches, wizard } from '../../src/forms'
import { $, $$, abiertos, boton, escribir, esperar } from './utilidades'

beforeEach(() => localStorage.clear())

describe('phone', () => {
  it('formatea mientras se escribe y entrega +52 con 10 dígitos', async () => {
    const p = form({ title: 'X', fields: [{ name: 'tel', label: 'Teléfono', type: 'phone', required: true }] })
    const input = $<HTMLInputElement>('input[type=tel]')
    expect($<HTMLSelectElement>('select.dial').value).toBe('+52')
    escribir(input, '8112345678')
    expect(input.value).toBe('81 1234 5678')
    escribir(input, '2221234567')
    expect(input.value).toBe('222 123 4567')
    boton('confirm').click()
    expect((await p).value).toEqual({ tel: '+522221234567' })
  })

  it('valida el largo según la lada y lee un valor inicial con lada', async () => {
    const p = form({ title: 'X', fields: [{ name: 'tel', label: 'Teléfono', type: 'phone', value: '+34612345678' }] })
    const input = $<HTMLInputElement>('input[type=tel]')
    expect($<HTMLSelectElement>('select.dial').value).toBe('+34')
    expect(input.value).toBe('612 345 678')
    escribir(input, '6123')
    boton('confirm').click()
    await esperar()
    expect($('.field.phone .msg').textContent).toBe('Escribe los 9 dígitos del teléfono.')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    escribir(input, '')
    boton('confirm').click()
    expect((await p).value).toEqual({ tel: '' })
  })

  it('formatPhone', () => {
    expect(formatPhone('5512345678')).toBe('55 1234 5678')
    expect(formatPhone('4155552671', '+1')).toBe('415 555 2671')
    expect(formatPhone('811')).toBe('811')
  })
})

describe('address', () => {
  const lookup = vi.fn(async (cp: string) =>
    cp === '64000'
      ? { state: 'Nuevo León', municipality: 'Monterrey', neighborhoods: ['Centro', 'Obispado'] }
      : cp === '01000'
        ? { state: 'Ciudad de México', municipality: 'Álvaro Obregón', neighborhoods: ['San Ángel'] }
        : null,
  )

  it('llena estado y municipio por CP y ofrece las colonias', async () => {
    const p = form({ title: 'X', fields: [{ name: 'dir', label: 'Dirección', type: 'address', required: true, lookupPostalCode: lookup }] })
    escribir($<HTMLInputElement>('input[name="dir.postalCode"]'), '64000')
    await esperar()
    expect(lookup).toHaveBeenCalledWith('64000')
    expect($<HTMLInputElement>('input[name="dir.state"]').value).toBe('Nuevo León')
    expect($<HTMLInputElement>('input[name="dir.municipality"]').value).toBe('Monterrey')
    const colonias = $<HTMLSelectElement>('.ad-neighborhood select')
    expect([...colonias.options].map((o) => o.value)).toEqual(['', 'Centro', 'Obispado'])
    boton('confirm').click()
    await esperar()
    expect($('.field.address .msg').textContent).toBe('Falta: colonia, calle y número.')
    escribir(colonias, 'Obispado')
    escribir($<HTMLInputElement>('input[name="dir.street"]'), 'Hidalgo 123')
    boton('confirm').click()
    expect((await p).value).toEqual({
      dir: { postalCode: '64000', state: 'Nuevo León', municipality: 'Monterrey', neighborhood: 'Obispado', street: 'Hidalgo 123' },
    })
  })

  it('con una sola colonia la pone directo; si no existe el CP, avisa y deja escribir', async () => {
    const p = form({ title: 'X', fields: [{ name: 'dir', label: 'Dirección', type: 'address', lookupPostalCode: lookup }] })
    const cp = $<HTMLInputElement>('input[name="dir.postalCode"]')
    escribir(cp, '01000')
    await esperar()
    expect($<HTMLInputElement>('input[name="dir.neighborhood"]').value).toBe('San Ángel')
    escribir(cp, '99999')
    await esperar()
    expect($('.ad-note').textContent).toBe('No encontramos ese código postal: escribe los datos.')
    boton('cancel').click()
    await esperar()
    boton('discard')?.click()
    await p
  })

  it('vacío y opcional no es error', async () => {
    const p = form({ title: 'X', fields: [{ name: 'dir', label: 'Dirección', type: 'address' }] })
    boton('confirm').click()
    expect((await p).value).toEqual({ dir: null })
  })
})

describe('borrador automático', () => {
  const abrir = () =>
    form({
      title: 'Alta',
      draftKey: 'alta',
      fields: [
        { name: 'nombre', label: 'Nombre' },
        { name: 'clave', label: 'Contraseña', type: 'password' },
      ],
    })

  it('guarda mientras se escribe (sin contraseñas), pregunta al volver y se borra al enviar', async () => {
    const p1 = abrir()
    escribir($<HTMLInputElement>('input[name=nombre]'), 'Laura')
    escribir($<HTMLInputElement>('input[name=clave]'), 'secreta')
    await esperar(350)
    const guardado = JSON.parse(localStorage.getItem('nexus-dialogs:draft:alta')!)
    expect(guardado.values).toEqual({ nombre: 'Laura' })
    // Se cierra la pestaña sin enviar: aquí lo simulamos cerrando sin preguntar.
    document.querySelector('dialog')!.remove()
    void p1

    const p2 = abrir()
    await esperar()
    expect($('h2').textContent).toBe('¿Continuar donde te quedaste?')
    boton('resume').click()
    await esperar(20)
    expect($<HTMLInputElement>('input[name=nombre]').value).toBe('Laura')
    expect($<HTMLInputElement>('input[name=clave]').value).toBe('')
    boton('confirm').click()
    expect((await p2).value).toEqual({ nombre: 'Laura', clave: '' })
    expect(localStorage.getItem('nexus-dialogs:draft:alta')).toBeNull()
  })

  it('«Empezar de nuevo» borra el borrador; draftPrompt: false restaura sin preguntar', async () => {
    localStorage.setItem('nexus-dialogs:draft:alta', JSON.stringify({ values: { nombre: 'Ana' }, at: 1 }))
    const p = abrir()
    await esperar()
    boton('fresh').click()
    await esperar(20)
    expect($<HTMLInputElement>('input[name=nombre]').value).toBe('')
    expect(localStorage.getItem('nexus-dialogs:draft:alta')).toBeNull()
    boton('confirm').click()
    await p

    localStorage.setItem('nexus-dialogs:draft:x', JSON.stringify({ values: { nombre: 'Leo' }, at: 1 }))
    const q = form({ title: 'X', draftKey: 'x', draftPrompt: false, fields: [{ name: 'nombre', label: 'Nombre' }] })
    await esperar()
    expect(abiertos()).toBe(1)
    expect($<HTMLInputElement>('input[name=nombre]').value).toBe('Leo')
    boton('confirm').click()
    await q
  })

  it('al descartar los cambios también se borra', async () => {
    const p = abrir()
    escribir($<HTMLInputElement>('input[name=nombre]'), 'Laura')
    await esperar(350)
    boton('cancel').click()
    await esperar()
    boton('discard').click()
    await p
    expect(localStorage.getItem('nexus-dialogs:draft:alta')).toBeNull()
  })

  it('en el asistente vuelve al paso donde se quedó', async () => {
    localStorage.setItem('nexus-dialogs:draft:w', JSON.stringify({ values: { a: 'uno', b: 'dos' }, step: 1, at: 1 }))
    const p = wizard({
      title: 'W',
      draftKey: 'w',
      draftPrompt: false,
      steps: [
        { title: 'Uno', fields: [{ name: 'a', label: 'A' }] },
        { title: 'Dos', fields: [{ name: 'b', label: 'B' }] },
      ],
    })
    await esperar()
    expect($('.step-title').textContent).toBe('Dos')
    expect($<HTMLInputElement>('input[name=b]').value).toBe('dos')
    boton('confirm').click()
    expect((await p).value).toEqual({ a: 'uno', b: 'dos' })
  })
})

describe('pasos condicionales', () => {
  const abrir = () =>
    wizard({
      title: 'Cliente',
      review: true,
      steps: [
        { title: 'Tipo', fields: [{ name: 'tipo', label: 'Tipo', type: 'segmented', options: ['persona', 'empresa'], value: 'persona' }] },
        {
          title: 'Empresa',
          when: { field: 'tipo', equals: 'empresa' },
          fields: [{ name: 'razon', label: 'Razón social', required: true }],
        },
        { title: 'Contacto', when: (v) => v.tipo !== undefined, fields: [{ name: 'correo', label: 'Correo' }] },
      ],
    })
  const visibles = () =>
    $$('.stepper li')
      .filter((li) => !li.hidden)
      .map((li) => li.textContent)

  it('el paso aparece según la respuesta y sus valores solo cuentan si aplica', async () => {
    const p = abrir()
    expect(visibles()).toEqual(['1Tipo', '3Contacto', '4Revisar'])
    expect($('.step-count').textContent).toBe('Paso 1 de 3')
    const [, empresa] = $$<HTMLInputElement>('input[type=radio]') as HTMLInputElement[]
    empresa.click()
    expect(visibles()).toEqual(['1Tipo', '2Empresa', '3Contacto', '4Revisar'])
    expect($('.step-count').textContent).toBe('Paso 1 de 4')
    boton('next').click()
    await esperar()
    expect($('.step-title').textContent).toBe('Empresa')
    escribir($<HTMLInputElement>('input[name=razon]'), 'Acme SA')
    boton('back').click()
    await esperar()
    ;($$('input[type=radio]')[0] as HTMLInputElement).click()
    boton('next').click()
    await esperar()
    expect($('.step-title').textContent).toBe('Contacto')
    boton('next').click()
    await esperar()
    expect($$('.review h4').map((x) => x.textContent)).toEqual(['Tipo', 'Contacto'])
    boton('confirm').click()
    expect((await p).value).toEqual({ tipo: 'persona', correo: '' })
  })
})

describe('formFromJSON', () => {
  it('arma el formulario, visibleIf declarativo y resolvers por nombre', async () => {
    const rfcLibre = vi.fn(async (v: string) => (v === 'XAXX010101000' ? 'Ese RFC ya está registrado' : null))
    const p = formFromJSON(
      JSON.stringify({
        title: 'Proveedor',
        fields: [
          { name: 'tipo', label: 'Tipo', type: 'select', options: ['persona', 'empresa'], required: true },
          { name: 'rfc', label: 'RFC', type: 'rfc', validate: 'rfcLibre', visibleIf: { field: 'tipo', equals: 'empresa' } },
        ],
      }),
      { resolvers: { rfcLibre } },
    )
    await esperar()
    expect($('input[name=rfc]').closest('.field')!.hasAttribute('hidden')).toBe(true)
    escribir($<HTMLSelectElement>('select[name=tipo]'), 'empresa')
    expect($('input[name=rfc]').closest('.field')!.hasAttribute('hidden')).toBe(false)
    escribir($<HTMLInputElement>('input[name=rfc]'), 'XAXX010101000')
    boton('confirm').click()
    await esperar(10)
    expect(rfcLibre).toHaveBeenCalled()
    expect($('.summary').textContent).toContain('Ese RFC ya está registrado')
    escribir($<HTMLSelectElement>('select[name=tipo]'), 'persona')
    boton('confirm').click()
    expect((await p).value).toEqual({ tipo: 'persona' })
  })

  it('con steps abre un asistente', async () => {
    const p = formFromJSON({ title: 'W', steps: [{ title: 'Uno', fields: [{ name: 'a', label: 'A' }] }] })
    await esperar()
    expect($('.stepper')).not.toBeNull()
    boton('confirm').click()
    expect((await p).value).toEqual({ a: '' })
  })

  it('errores claros: tipo desconocido y resolver faltante', async () => {
    await expect(formFromJSON({ title: 'X', fields: [{ name: 'a', label: 'A', type: 'nope' as any }] })).rejects.toThrow(
      'tipo desconocido «nope»',
    )
    expect(() => fieldsFromJSON([{ name: 'a', label: 'A', validate: 'falta' }])).toThrow('falta el resolver «falta» (campo «a»)')
    expect(abiertos()).toBe(0)
  })

  it('matches', () => {
    const v = { a: 'x', b: '', c: ['1'], d: false }
    expect(matches({ field: 'a', in: ['x', 'y'] }, v)).toBe(true)
    expect(matches({ field: 'b', filled: false }, v)).toBe(true)
    expect(matches({ all: [{ field: 'c' }, { not: { field: 'd' } }] }, v)).toBe(true)
    expect(
      matches(
        {
          any: [
            { field: 'a', notEquals: 'x' },
            { field: 'd', equals: true },
          ],
        },
        v,
      ),
    ).toBe(false)
  })
})
