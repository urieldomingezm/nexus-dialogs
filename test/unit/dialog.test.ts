import { describe, expect, it, vi } from 'vitest'
import { configure, dialog, es } from 'nexus-dialogs'
import { $, $$, abiertos, boton, escribir, esperar, raiz } from './utilidades'

describe('alert', () => {
  it('abre un <dialog> modal con el título como nombre accesible y resuelve al confirmar', async () => {
    const p = dialog.alert('Guardado', 'Todo bien')
    const d = document.querySelector('dialog[data-nexus-dialog]') as HTMLDialogElement
    expect(d.open).toBe(true)
    expect(d.getAttribute('role')).toBe('alertdialog')
    expect(d.getAttribute('aria-label')).toBe('Guardado')
    expect($('.title').textContent).toBe('Guardado')
    expect($('.text').textContent).toBe('Todo bien')
    expect($$('.foot button').map((b) => b.textContent)).toEqual([es.ok])
    boton('confirm').click()
    const r = await p
    expect(r).toEqual({ confirmed: true, denied: false, value: true, reason: 'confirm' })
    expect(abiertos()).toBe(0)
  })

  it('los atajos success/error ponen el icono y centran el encabezado', async () => {
    const p = dialog.success('Listo')
    expect($('.icon.i-success')).toBeTruthy()
    expect($('.head.centered')).toBeTruthy()
    dialog.close()
    expect((await p).reason).toBe('program')
  })

  it('el texto nunca se interpreta como HTML', async () => {
    const p = dialog.alert({ title: '<img src=x onerror=alert(1)>', text: '<b>hola</b>' })
    expect($('.title').textContent).toBe('<img src=x onerror=alert(1)>')
    expect($('.title img')).toBeNull()
    expect($('.text b')).toBeNull()
    dialog.close()
    await p
  })

  it('cierra solo con timer (reason timer)', async () => {
    const r = await dialog.alert({ title: 'Se cierra solo', timer: 30 })
    expect(r.reason).toBe('timer')
    expect(r.confirmed).toBe(false)
  })
})

describe('confirm', () => {
  it('Cancelar resuelve confirmed false', async () => {
    const p = dialog.confirm({ title: '¿Seguro?' })
    expect($$('.foot button').map((b) => b.className)).toEqual(['btn btn-cancel', 'btn btn-primary'])
    boton('cancel').click()
    expect(await p).toMatchObject({ confirmed: false, reason: 'cancel' })
  })

  it('danger: confirmar rojo, Cancelar gris y con el foco', async () => {
    const p = dialog.confirm({ title: '¿Eliminar?', danger: true, confirmText: 'Eliminar' })
    expect(boton('confirm').className).toBe('btn btn-danger')
    expect(boton('cancel').className).toBe('btn btn-secondary')
    expect(raiz().activeElement).toBe(boton('cancel'))
    dialog.close()
    await p
  })

  it('Esc cierra con reason escape; dismissible false lo impide', async () => {
    const p = dialog.confirm({ title: 'A' })
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect((await p).reason).toBe('escape')

    const q = dialog.confirm({ title: 'B', dismissible: false })
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await esperar()
    expect(abiertos()).toBe(1)
    ;($('.overlay') as HTMLElement).click()
    await esperar()
    expect(abiertos()).toBe(1)
    dialog.close()
    expect((await q).reason).toBe('program')
  })

  it('clic fuera cierra con reason backdrop', async () => {
    const p = dialog.confirm({ title: 'A' })
    $('.overlay').click()
    expect((await p).reason).toBe('backdrop')
  })

  it('requireText habilita el botón solo con el texto exacto', async () => {
    const p = dialog.confirm({ title: '¿Eliminar periodo?', danger: true, requireText: 'Quincena 21' })
    const input = $<HTMLInputElement>('.typed input')
    expect(raiz().activeElement).toBe(input)
    expect(boton('confirm').disabled).toBe(true)
    escribir(input, 'quincena 21')
    expect(boton('confirm').disabled).toBe(true)
    escribir(input, 'Quincena 21')
    expect(boton('confirm').disabled).toBe(false)
    boton('confirm').click()
    expect((await p).confirmed).toBe(true)
  })

  it('preConfirm: muestra el error que lanza y deja el diálogo abierto', async () => {
    let intento = 0
    const p = dialog.confirm({
      title: 'Timbrar',
      preConfirm: async () => {
        intento++
        await esperar(5)
        if (intento === 1) throw new Error('El SAT no responde')
        return 'UUID-123'
      },
    })
    boton('confirm').click()
    await esperar()
    expect(boton('confirm').disabled).toBe(true)
    expect(boton('confirm').textContent).toBe(es.loading)
    await esperar(20)
    expect($('.err').textContent).toBe('El SAT no responde')
    expect(boton('confirm').disabled).toBe(false)
    expect(boton('confirm').textContent).toBe(es.confirm)
    boton('confirm').click()
    expect(await p).toMatchObject({ confirmed: true, value: 'UUID-123' })
  })

  it('preConfirm que devuelve false no cierra', async () => {
    const p = dialog.confirm({ title: 'X', preConfirm: () => false })
    boton('confirm').click()
    await esperar()
    expect(abiertos()).toBe(1)
    dialog.close()
    await p
  })

  it('beforeClose puede impedir el cierre', async () => {
    const beforeClose = vi.fn(() => false)
    const p = dialog.confirm({ title: 'X', beforeClose })
    boton('cancel').click()
    await esperar()
    expect(beforeClose).toHaveBeenCalledWith('cancel', expect.anything())
    expect(abiertos()).toBe(1)
    dialog.closeAll()
    await p
  })
})

describe('open', () => {
  it('botones custom y deny', async () => {
    const onClick = vi.fn(() => false)
    const p = dialog.open({
      title: 'Cambios sin guardar',
      buttons: [
        { id: 'deny', role: 'deny', text: 'No guardar', value: 'x' },
        { id: 'otro', text: 'Otro', onClick },
        { id: 'confirm', role: 'confirm', text: 'Guardar' },
      ],
    })
    expect(boton('deny').className).toBe('btn btn-cancel')
    expect(boton('otro').className).toBe('btn btn-secondary')
    boton('otro').click()
    await esperar()
    expect(onClick).toHaveBeenCalled()
    expect(abiertos()).toBe(1)
    boton('deny').click()
    expect(await p).toEqual({ confirmed: false, denied: true, value: 'x', reason: 'deny' })
  })

  it('panel lateral: × visible por omisión', async () => {
    const p = dialog.open({ title: 'Filtros', placement: 'right' })
    expect($('.p-right')).toBeTruthy()
    $('.x').click()
    expect((await p).reason).toBe('close')
  })

  it('bloquea el scroll mientras hay diálogos y lo libera al cerrar el último', async () => {
    const a = dialog.alert('A')
    const b = dialog.alert('B')
    expect(document.documentElement.hasAttribute('data-nexus-lock')).toBe(true)
    dialog.close()
    await b
    expect(document.documentElement.hasAttribute('data-nexus-lock')).toBe(true)
    dialog.close()
    await a
    expect(document.documentElement.hasAttribute('data-nexus-lock')).toBe(false)
    expect(dialog.isOpen()).toBe(false)
  })

  it('emite nexus-dialogs:open y :close', async () => {
    const eventos: string[] = []
    const f = (e: Event) => eventos.push(e.type)
    document.addEventListener('nexus-dialogs:open', f)
    document.addEventListener('nexus-dialogs:close', f)
    const p = dialog.alert('A')
    dialog.close()
    await p
    expect(eventos).toEqual(['nexus-dialogs:open', 'nexus-dialogs:close'])
  })

  it('devuelve el foco a quien lo tenía', async () => {
    const b = document.createElement('button')
    document.body.appendChild(b)
    b.focus()
    const p = dialog.alert('A')
    expect(document.activeElement).not.toBe(b)
    dialog.close()
    await p
    expect(document.activeElement).toBe(b)
  })
})

describe('prompt', () => {
  it('valida obligatorio, correo y validate propio; Enter confirma', async () => {
    const p = dialog.prompt({
      title: 'Correo',
      label: 'Correo',
      input: 'email',
      validate: (v) => (v.endsWith('@x.com') ? 'Ese dominio no' : null),
    })
    const input = $<HTMLInputElement>('input')
    expect(raiz().activeElement).toBe(input)
    expect($('label').textContent).toBe('Correo')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe(es.required)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    escribir(input, 'nada')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe(es.invalidEmail)
    escribir(input, 'a@x.com')
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe('Ese dominio no')
    escribir(input, 'ana@empresa.mx')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }))
    expect(await p).toMatchObject({ confirmed: true, value: 'ana@empresa.mx' })
  })

  it('select con opciones', async () => {
    const p = dialog.prompt({ title: 'Área', input: 'select', options: ['Almacén', { value: 'nom', label: 'Nómina' }] })
    const s = $<HTMLSelectElement>('select')
    expect([...s.options].map((o) => o.textContent)).toEqual([es.select, 'Almacén', 'Nómina'])
    escribir(s, 'nom')
    boton('confirm').click()
    expect((await p).value).toBe('nom')
  })
})

describe('configure', () => {
  it('idioma, textos y tema', async () => {
    configure({ lang: 'en', labels: { cancel: 'Nope' }, theme: { accent: '#ff0000' } })
    const p = dialog.confirm({ title: 'Sure?' })
    expect(boton('cancel').textContent).toBe('Nope')
    expect(boton('confirm').textContent).toBe('Confirm')
    const host = document.querySelector('[data-nexus-host]') as HTMLElement
    expect(host.style.getPropertyValue('--nd-accent')).toBe('#ff0000')
    dialog.close()
    await p
    configure({ lang: 'es', theme: { accent: '' } })
  })
})
