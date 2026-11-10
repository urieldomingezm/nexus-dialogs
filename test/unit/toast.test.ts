import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from '../../src/toast'
import { dialog } from 'nexus-dialogs'
import { esperar } from './utilidades'

const sr = () => (document.querySelector('[data-nexus-toast]') as HTMLElement | null)?.shadowRoot
const items = () => [...(sr()?.querySelectorAll('li') ?? [])].filter((li) => !li.classList.contains('out'))
const textos = () => items().map((li) => li.querySelector('.txt')!.textContent)

afterEach(async () => {
  toast.dismiss()
  await esperar(5)
})

describe('toast', () => {
  it('muestra, anuncia en una región viva y se cierra solo', async () => {
    toast.success('Guardado', { duration: 150 })
    expect(textos()).toEqual(['Guardado'])
    expect(items()[0].className).toBe('success')
    await esperar(80)
    expect(sr()!.querySelector('[role=status]')!.textContent).toBe('Guardado')
    await esperar(150)
    expect(document.querySelector('[data-nexus-toast]')).toBeNull()
  })

  it('los errores se anuncian con role=alert', async () => {
    toast.error('Falló el timbrado', { duration: 0 })
    await esperar(80)
    expect(sr()!.querySelector('[role=alert]')!.textContent).toBe('Falló el timbrado')
  })

  it('cola: máximo 3 visibles y el siguiente entra al cerrar uno', async () => {
    const ids = [1, 2, 3, 4, 5].map((n) => toast(`Aviso ${n}`, { duration: 0 }))
    expect(textos()).toEqual(['Aviso 1', 'Aviso 2', 'Aviso 3'])
    toast.dismiss(ids[0])
    await esperar()
    expect(textos()).toEqual(['Aviso 2', 'Aviso 3', 'Aviso 4'])
  })

  it('acción y cierre con ×', async () => {
    const onClick = vi.fn()
    const onClose = vi.fn()
    toast('Se archivaron 3 recibos', { action: { label: 'Deshacer', onClick }, onClose })
    const [accion, x] = [...items()[0].querySelectorAll('button')]
    expect(accion.textContent).toBe('Deshacer')
    expect(accion.className).toBe('act')
    expect(items()[0].querySelector('.icon')).toBeNull()
    expect(x.getAttribute('aria-label')).toBe('Cerrar aviso')
    accion.click()
    expect(onClick).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('promise: de cargando a éxito o error', async () => {
    const ok = toast.promise(Promise.resolve(148), { loading: 'Calculando…', success: (n) => `${n} recibos`, error: 'Falló' })
    expect(items()[0].className).toBe('loading')
    await ok
    await esperar()
    expect(textos()).toContain('148 recibos')
    const mal = toast.promise(Promise.reject(new Error('sin red')), { loading: 'Enviando…', success: 'ok', error: (e) => e.message })
    await mal.catch(() => {})
    await esperar()
    expect(textos()).toContain('sin red')
  })

  it('update con el mismo id reemplaza en lugar de duplicar', () => {
    toast('Subiendo…', { id: 'subida', type: 'loading' })
    toast('Subido', { id: 'subida', type: 'success' })
    expect(textos()).toEqual(['Subido'])
  })

  it('con un diálogo abierto se monta dentro de él (si no, quedaría inerte)', async () => {
    const p = dialog.alert('Abierto')
    toast('Dentro del diálogo')
    const host = document.querySelector('[data-nexus-toast]')!
    expect(host.parentElement?.tagName).toBe('DIALOG')
    dialog.close()
    await p
  })

  it('icono en círculo por tipo y giro al cargar', () => {
    toast.success('Guardado')
    toast('Cargando', { type: 'loading' })
    const [ok, cargando] = items()
    expect(ok.querySelector('.icon.i-success svg')).not.toBeNull()
    expect(cargando.querySelector('.spin')).not.toBeNull()
  })
})
