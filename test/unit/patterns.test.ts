import { describe, expect, it, vi } from 'vitest'
import { es } from 'nexus-dialogs'
import { approval, bulkAction, choose, confirmDelete, loading, sessionTimeout, unsavedChanges, watchIdle } from '../../src/patterns'
import { $, $$, abiertos, boton, escribir, esperar, raiz } from './utilidades'

describe('confirmDelete', () => {
  it('muestra qué se pierde, exige el nombre y resuelve true', async () => {
    const onConfirm = vi.fn()
    const p = confirmDelete({
      what: 'el periodo de nómina',
      name: 'Quincena 21',
      requireName: true,
      consequences: ['148 recibos'],
      onConfirm,
    })
    expect($('.title').textContent).toBe('¿Eliminar el periodo de nómina?')
    expect($('.lead b').textContent).toBe('Quincena 21')
    expect($$('.loss li').map((l) => l.textContent)).toEqual(['148 recibos'])
    // El campo para escribir va después de lo que se pierde.
    const hijos = [...$('.body').children]
    expect(hijos.indexOf($('.typed'))).toBeGreaterThan(0)
    expect(boton('confirm').className).toBe('btn btn-danger')
    expect(boton('confirm').disabled).toBe(true)
    escribir($('.typed input'), 'Quincena 21')
    boton('confirm').click()
    expect(await p).toBe(true)
    expect(onConfirm).toHaveBeenCalled()
  })

  it('cancelar resuelve false', async () => {
    const p = confirmDelete({ what: 'a Laura' })
    expect(raiz().activeElement).toBe(boton('cancel'))
    boton('cancel').click()
    expect(await p).toBe(false)
  })
})

describe('unsavedChanges', () => {
  it('lista los cambios y devuelve la decisión', async () => {
    let p = unsavedChanges({ changes: [{ label: 'Puesto', from: 'Analista', to: 'Coordinadora' }] })
    expect($('.title').textContent).toBe('Tienes 1 cambio sin guardar')
    expect($('.changes s').textContent).toBe('Analista')
    expect(raiz().activeElement).toBe(boton('keep'))
    expect(boton('save')).toBeNull() // sin onSave no hay «Guardar y salir»
    boton('discard').click()
    expect(await p).toBe('discard')

    const onSave = vi.fn()
    p = unsavedChanges({ onSave })
    boton('save').click()
    expect(await p).toBe('save')
    expect(onSave).toHaveBeenCalled()

    p = unsavedChanges()
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(await p).toBe('keep')
  })
})

describe('sessionTimeout', () => {
  it('cuenta hacia atrás y expira', async () => {
    const p = sessionTimeout({ seconds: 1 })
    expect($('.num').textContent).toBe('0:01')
    expect(raiz().activeElement).toBe(boton('extend'))
    expect(await p).toBe('expired')
  })

  it('Seguir trabajando y Cerrar sesión', async () => {
    let p = sessionTimeout({ seconds: 60 })
    boton('extend').click()
    expect(await p).toBe('extend')
    p = sessionTimeout({ seconds: 60 })
    boton('logout').click()
    expect(await p).toBe('logout')
  })
})

describe('watchIdle', () => {
  it('avisa tras la inactividad y llama onLogout al expirar', async () => {
    const onLogout = vi.fn()
    const w = watchIdle({ minutes: 0, warnSeconds: 1, onLogout })
    await esperar(1100) // límite mínimo = aviso + 1 s
    expect(abiertos()).toBe(1)
    await esperar(1200)
    expect(onLogout).toHaveBeenCalledWith('expired')
    w.stop()
  })
})

describe('approval', () => {
  it('aprobar con comentario opcional', async () => {
    const onApprove = vi.fn()
    const p = approval({ title: 'Vacaciones', details: [{ label: 'Días', value: '5' }], warning: 'Ojo', onApprove })
    expect($$('.facts dd').map((d) => d.textContent)).toEqual(['5'])
    expect($('.warn').textContent).toBe('Ojo')
    escribir($('textarea'), 'Disfrútalas')
    boton('confirm').click()
    expect(await p).toEqual({ decision: 'approved', comment: 'Disfrútalas' })
    expect(onApprove).toHaveBeenCalledWith('Disfrútalas')
  })

  it('rechazar exige motivo; «Volver» regresa a la solicitud', async () => {
    const onReject = vi.fn()
    const p = approval({ title: 'Vacaciones', reasons: ['Sin saldo', 'Cierre'], minReasonLength: 5, onReject })
    boton('reject').click()
    await esperar()
    expect(abiertos()).toBe(2)
    expect(boton('confirm').className).toBe('btn btn-danger')
    boton('back').click()
    await esperar()
    expect(abiertos()).toBe(1)
    boton('reject').click()
    await esperar()
    boton('confirm').click()
    await esperar()
    expect($('.msg').textContent).toBe('Escribe al menos 5 caracteres.')
    expect(abiertos()).toBe(2)
    const radio = $$('input[type=radio]')[0] as HTMLInputElement
    radio.checked = true
    escribir($('textarea'), 'No tiene días disponibles')
    boton('confirm').click()
    expect(await p).toEqual({ decision: 'rejected', comment: 'No tiene días disponibles', reason: 'Sin saldo' })
    expect(onReject).toHaveBeenCalledWith('No tiene días disponibles', 'Sin saldo')
    expect(abiertos()).toBe(0)
  })

  it('pedir más información y cancelar', async () => {
    let p = approval({ title: 'X', allowRequestInfo: true })
    boton('info').click()
    expect((await p).decision).toBe('info')
    p = approval({ title: 'X' })
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect((await p).decision).toBe('cancelled')
  })
})

describe('bulkAction', () => {
  const gente = ['Ana', 'Luis', 'Marta', 'Óscar', 'Pedro'].map((n) => ({ n }))

  it('vista previa, omitidos, progreso, errores por fila y reintento', async () => {
    let falla = true
    const p = bulkAction({
      title: 'Mover',
      items: gente,
      label: (e) => e.n,
      describe: () => 'Almacén → Logística',
      skip: (e) => e.n === 'Óscar' && 'ya está',
      preview: 2,
      run: async (e) => {
        if (e.n === 'Pedro' && falla) throw new Error('baja vigente')
      },
    })
    expect(boton('run').textContent).toBe('Aplicar a 4')
    expect($$('.row').length).toBe(2)
    expect($('.more').textContent).toBe('y 2 más…')
    expect($('.warn').textContent).toContain('1 se omitirán')
    boton('run').click()
    await esperar(10)
    expect($('.title').textContent).toBe('Listo')
    expect($('.results .bad').textContent).toBe('Pedro: baja vigente')
    expect(boton('retry').textContent).toBe('Reintentar 1')
    falla = false
    boton('retry').click()
    await esperar(10)
    expect(boton('retry')).toBeNull()
    boton('done').click()
    const r = await p
    expect(r.confirmed).toBe(true)
    expect(r.done.map((e) => e.n)).toEqual(['Ana', 'Luis', 'Marta', 'Pedro'])
    expect(r.failed).toEqual([])
    expect(r.skipped).toEqual([{ item: { n: 'Óscar' }, reason: 'ya está' }])
  })

  it('cancelar antes de empezar', async () => {
    const run = vi.fn()
    const p = bulkAction({ title: 'X', items: gente, label: (e) => e.n, run })
    boton('cancel').click()
    expect((await p).confirmed).toBe(false)
    expect(run).not.toHaveBeenCalled()
  })
})

describe('choose', () => {
  it('devuelve la opción elegida o null', async () => {
    let p = choose({
      title: 'Formato',
      options: [
        { value: 'xlsx', label: 'Excel' },
        { value: 'csv', label: 'CSV', description: 'Para importar' },
        { value: 'pdf', label: 'PDF', disabled: true },
      ],
    })
    const radios = $$('input[type=radio]') as HTMLInputElement[]
    expect(radios[0].checked).toBe(true)
    expect(radios[2].disabled).toBe(true)
    expect(raiz().activeElement).toBe(radios[0])
    radios[0].checked = false
    radios[1].checked = true
    boton('confirm').click()
    expect(await p).toBe('csv')
    p = choose({ title: 'F', options: [{ value: 'a', label: 'A' }] })
    boton('cancel').click()
    expect(await p).toBeNull()
  })
})

describe('loading', () => {
  it('muestra la espera, no se puede cerrar y devuelve el resultado', async () => {
    const p = loading('Timbrando…', () => esperar(20).then(() => 148))
    await esperar()
    expect(abiertos()).toBe(1)
    document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await esperar()
    expect(abiertos()).toBe(1)
    expect(await p).toBe(148)
    await esperar()
    expect(abiertos()).toBe(0)
  })

  it('relanza el error de la tarea y cierra', async () => {
    await expect(loading('X', Promise.reject(new Error('falló')))).rejects.toThrow('falló')
    await esperar()
    expect(abiertos()).toBe(0)
  })

  it('loading.open con update y close', async () => {
    const c = loading.open('Paso 1')
    await esperar()
    c.update('Paso 2')
    expect($('.title').textContent).toBe('Paso 2')
    c.close()
    await esperar()
    expect(abiertos()).toBe(0)
    expect(es.ok).toBe('Aceptar')
  })
})
