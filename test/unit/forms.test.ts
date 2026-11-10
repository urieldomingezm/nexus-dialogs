import { describe, expect, it } from 'vitest'
import { es } from 'nexus-dialogs'
import { form, wizard } from '../../src/forms'
import { $, $$, abiertos, boton, escribir, esperar, raiz } from './utilidades'

const input = (name: string) => $<HTMLInputElement>(`[name="${name}"]`)

describe('form', () => {
  it('lee los valores con su tipo y los devuelve al confirmar', async () => {
    const p = form({
      title: 'Nuevo cliente',
      fields: [
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'edad', label: 'Edad', type: 'number' },
        { name: 'factura', label: 'Factura', type: 'switch' },
        { name: 'tipo', label: 'Tipo', type: 'segmented', options: ['Persona', 'Empresa'], value: 'Persona' },
      ],
    })
    expect(raiz().activeElement).toBe(input('nombre'))
    expect($('[role=switch]')).toBeTruthy()
    escribir(input('nombre'), '  Ana  ')
    escribir(input('edad'), '31')
    const sw = $<HTMLInputElement>('[role=switch]')
    sw.checked = true
    sw.dispatchEvent(new Event('change', { bubbles: true }))
    boton('confirm').click()
    expect(await p).toMatchObject({ confirmed: true, value: { nombre: 'Ana', edad: 31, factura: true, tipo: 'Persona' } })
  })

  it('al enviar con errores muestra el resumen con enlaces y marca cada campo', async () => {
    const p = form({
      title: 'X',
      fields: [
        { name: 'a', label: 'Nombre', required: true },
        { name: 'b', label: 'Correo', type: 'email' },
        { name: 'c', label: 'Clave', minLength: 4 },
      ],
    })
    escribir(input('b'), 'malo')
    escribir(input('c'), 'ab')
    boton('confirm').click()
    await esperar()
    const resumen = $('.summary')
    expect(resumen.hidden).toBe(false)
    expect(resumen.querySelector('p')!.textContent).toBe('Revisa 3 campo(s):')
    expect($$('.summary a').map((a) => a.textContent)).toEqual([
      `Nombre: ${es.required}`,
      `Correo: ${es.invalidEmail}`,
      'Clave: Escribe al menos 4 caracteres.',
    ])
    expect(input('a').getAttribute('aria-invalid')).toBe('true')
    expect(input('a').getAttribute('aria-describedby')).toContain($$('.msg')[0].id)
    expect(abiertos()).toBe(1)
    ;($$('.summary a')[1] as HTMLAnchorElement).click()
    expect(raiz().activeElement).toBe(input('b'))
    escribir(input('a'), 'Ana')
    escribir(input('b'), 'ana@x.mx')
    escribir(input('c'), 'abcd')
    boton('confirm').click()
    expect((await p).confirmed).toBe(true)
  })

  it('campos condicionales: ocultos no se validan ni se envían', async () => {
    const p = form({
      title: 'X',
      confirmDiscard: false,
      fields: [
        { name: 'tipo', label: 'Tipo', type: 'radio', options: ['Persona', 'Empresa'], value: 'Persona' },
        { name: 'rfc', label: 'RFC', type: 'rfc', required: true, visible: (v) => v.tipo === 'Empresa' },
      ],
    })
    expect(input('rfc').closest('.field')!.hasAttribute('hidden')).toBe(true)
    const radios = $$('input[type=radio]') as HTMLInputElement[]
    radios[0].checked = false // happy-dom no agrupa radios dentro de shadow roots
    radios[1].checked = true
    radios[1].dispatchEvent(new Event('change', { bubbles: true }))
    expect(input('rfc').closest('.field')!.hasAttribute('hidden')).toBe(false)
    escribir(input('rfc'), 'pem840101ab')
    boton('confirm').click()
    await esperar()
    expect(input('rfc').value).toBe('PEM840101AB')
    expect($$('.msg').find((m) => m.textContent)?.textContent).toBe(es.invalidRfc)
    escribir(input('rfc'), 'PEM840101AB3')
    boton('confirm').click()
    expect((await p).value).toEqual({ tipo: 'Empresa', rfc: 'PEM840101AB3' })
  })

  it('tipos de México: curp, nss, clabe y postal validan su dígito verificador', async () => {
    const p = form({
      title: 'Nómina',
      fields: [
        { name: 'curp', label: 'CURP', type: 'curp' },
        { name: 'nss', label: 'NSS', type: 'nss' },
        { name: 'clabe', label: 'CLABE', type: 'clabe' },
        { name: 'cp', label: 'CP', type: 'postal' },
      ],
    })
    expect(input('nss').getAttribute('inputmode')).toBe('numeric')
    expect(input('curp').getAttribute('maxlength')).toBe('18')
    escribir(input('curp'), 'pelj900515hjcrpn04')
    escribir(input('nss'), '12169012345')
    escribir(input('clabe'), '002010077777777772')
    escribir(input('cp'), '00600')
    boton('confirm').click()
    await esperar()
    expect(input('curp').value).toBe('PELJ900515HJCRPN04')
    expect($$('.msg').map((m) => m.textContent)).toEqual([es.invalidCurp, es.invalidNss, es.invalidClabe, es.invalidPostal])
    escribir(input('curp'), 'PELJ900515HJCRPN03')
    escribir(input('nss'), '12169012346')
    escribir(input('clabe'), '002010077777777771')
    escribir(input('cp'), '06600')
    boton('confirm').click()
    expect((await p).value).toEqual({ curp: 'PELJ900515HJCRPN03', nss: '12169012346', clabe: '002010077777777771', cp: '06600' })
  })

  it('money: formatea con miles al salir y devuelve número', async () => {
    const p = form({ title: 'Gasto', fields: [{ name: 'importe', label: 'Importe', type: 'money', min: 1 }] })
    const i = input('importe')
    escribir(i, '12500.5')
    i.dispatchEvent(new FocusEvent('blur'))
    expect(i.value).toBe('12,500.50')
    expect($('.affix .cur').textContent).toBe('MXN')
    boton('confirm').click()
    expect((await p).value).toEqual({ importe: 12500.5 })
  })

  it('validate global y validación async por campo', async () => {
    const p = form({
      title: 'X',
      fields: [
        { name: 'rfc', label: 'RFC', validate: async (v) => (v === 'EXISTE' ? 'Ya está registrado' : null) },
        { name: 'a', label: 'Desde', type: 'number' },
        { name: 'b', label: 'Hasta', type: 'number' },
      ],
      validate: (v: any) => (v.a > v.b ? { b: 'Debe ser mayor que «Desde»' } : undefined),
    })
    escribir(input('rfc'), 'EXISTE')
    escribir(input('a'), '5')
    escribir(input('b'), '2')
    boton('confirm').click()
    await esperar(5)
    expect($$('.msg').map((m) => m.textContent)).toEqual(['Ya está registrado', '', 'Debe ser mayor que «Desde»'])
    escribir(input('rfc'), 'NUEVO')
    escribir(input('b'), '9')
    boton('confirm').click()
    expect((await p).confirmed).toBe(true)
  })

  it('con cambios, cancelar pregunta antes de descartar', async () => {
    const p = form({ title: 'X', fields: [{ name: 'a', label: 'A' }] })
    escribir(input('a'), 'algo')
    boton('cancel').click()
    await esperar()
    expect(abiertos()).toBe(2)
    expect(raiz().querySelector('.title')!.textContent).toBe(es.discardTitle)
    expect(boton('keep').className).toBe('btn btn-secondary')
    expect(raiz().activeElement).toBe(boton('keep'))
    boton('keep').click()
    await esperar()
    expect(abiertos()).toBe(1)
    boton('cancel').click()
    await esperar()
    boton('discard').click()
    expect(await p).toMatchObject({ confirmed: false, reason: 'cancel' })
    expect(abiertos()).toBe(0)
  })
})

describe('wizard', () => {
  const pasos = () =>
    wizard({
      title: 'Alta',
      review: true,
      submitText: 'Dar de alta',
      steps: [
        { title: 'Datos', fields: [{ name: 'nombre', label: 'Nombre', required: true }] },
        { title: 'Puesto', fields: [{ name: 'area', label: 'Área', type: 'select', options: ['Almacén', 'Nómina'], required: true }] },
      ],
    })

  it('valida cada paso, Atrás conserva datos, revisión con Editar y envío', async () => {
    const p = pasos()
    const visibles = () =>
      $$('.foot button')
        .filter((b) => !b.hidden)
        .map((b) => b.textContent)
    expect(visibles()).toEqual([es.cancel, es.next])
    expect($('.stepper [aria-current=step]').textContent).toContain('Datos')
    boton('next').click()
    await esperar()
    expect($('.summary').hidden).toBe(false)
    expect($('.stepper [aria-current=step]').textContent).toContain('Datos')
    escribir(input('nombre'), 'Laura')
    boton('next').click()
    await esperar()
    expect($('.step-count').textContent).toBe('Paso 2 de 3')
    expect(visibles()).toEqual([es.cancel, es.back, es.next])
    boton('back').click()
    await esperar()
    expect(input('nombre').value).toBe('Laura')
    boton('next').click()
    await esperar()
    escribir($<HTMLSelectElement>('select'), 'Nómina')
    boton('next').click()
    await esperar()
    expect($('.step-title').textContent).toBe(es.review)
    expect(visibles()).toEqual([es.cancel, es.back, 'Dar de alta'])
    expect($$('.review dd').map((d) => d.textContent)).toEqual(['Laura', 'Nómina'])
    ;($$('.review .link')[0] as HTMLButtonElement).click()
    expect($('.step-title').textContent).toBe('Datos')
    boton('next').click()
    await esperar()
    boton('next').click()
    await esperar()
    boton('confirm').click()
    expect(await p).toMatchObject({ confirmed: true, value: { nombre: 'Laura', area: 'Nómina' } })
  })
})
